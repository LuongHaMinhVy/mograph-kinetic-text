import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const DEFAULT_INPUT = path.join(
  ROOT_DIR,
  "references",
  "_luntuyett.01_7640160161155386645.mp4"
);
const DEFAULT_AUDIO_OUT = path.join(ROOT_DIR, "public", "audio", "hk1999-vn.mp3");
const DEFAULT_ENERGY_OUT = path.join(
  ROOT_DIR,
  "src",
  "storyboards",
  "hk1999-vn.energy.json"
);
const DEFAULT_FPS = 24;
const DEFAULT_DURATION_FRAMES = 588;
const SAMPLE_RATE = 24000;

function printUsage() {
  console.log(`Usage:
  pnpm run prep:audio
  pnpm run prep:audio -- --input <path> [options]

Options:
  --input <path>            Source audio or video file (default: HK1999 VN reference)
  --audio-out <path>        Extracted MP3 path under public/audio (default: public/audio/hk1999-vn.mp3)
  --energy-out <path>       Energy JSON output path (default: src/storyboards/hk1999-vn.energy.json)
  --fps <number>            Target composition FPS (default: 24)
  --duration-frames <num>   Override total frame count (default: auto-probed via ffprobe)
  -h, --help                Show this help message`);
}

function parseCliArgs(rawArgs) {
  const argv = [...rawArgs];
  if (argv[0] === "--") {
    argv.shift();
  }

  const opts = {
    input: undefined,
    audioOut: undefined,
    energyOut: undefined,
    fps: DEFAULT_FPS,
    durationFrames: undefined,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const nextValue = () => {
      if (i + 1 >= argv.length) {
        throw new Error(`Missing value for flag ${arg}`);
      }
      i += 1;
      return argv[i];
    };

    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--input") opts.input = nextValue();
    else if (arg === "--audio-out") opts.audioOut = nextValue();
    else if (arg === "--energy-out") opts.energyOut = nextValue();
    else if (arg === "--fps") opts.fps = Number(nextValue());
    else if (arg === "--duration-frames") opts.durationFrames = Number(nextValue());
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/** Probe media duration in seconds using ffprobe. */
function probeDurationSec(inputPath) {
  const raw = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      inputPath,
    ],
    { encoding: "utf8" }
  ).trim();
  const dur = Number(raw);
  if (!Number.isFinite(dur) || dur <= 0) {
    throw new Error(`Could not determine valid duration for ${inputPath}`);
  }
  return dur;
}

function extractAudioMp3(inputPath, outputPath) {
  if (path.resolve(inputPath) === path.resolve(outputPath)) {
    return;
  }
  mkdirSync(path.dirname(outputPath), { recursive: true });
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      "192k",
      "-ar",
      "44100",
      "-ac",
      "2",
      outputPath,
    ],
    { stdio: "inherit" }
  );
}

function decodePcmFloat32(inputPath, audioFilter) {
  const args = ["-v", "error", "-i", inputPath, "-vn"];
  if (audioFilter) {
    args.push("-af", audioFilter);
  }
  args.push("-f", "f32le", "-ac", "1", "-ar", String(SAMPLE_RATE), "pipe:1");

  const buffer = execFileSync("ffmpeg", args, {
    maxBuffer: 64 * 1024 * 1024,
  });

  const sampleCount = Math.floor(buffer.byteLength / 4);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = buffer.readFloatLE(i * 4);
  }
  return samples;
}

function computePerFrameRms(samples, totalFrames, samplesPerFrame) {
  const rmsValues = new Array(totalFrames).fill(0);
  for (let frame = 0; frame < totalFrames; frame++) {
    const start = Math.floor(frame * samplesPerFrame);
    const end = Math.min(samples.length, Math.floor((frame + 1) * samplesPerFrame));
    if (start >= samples.length || end <= start) {
      rmsValues[frame] = 0;
      continue;
    }
    let sumSquares = 0;
    for (let i = start; i < end; i++) {
      const s = samples[i];
      sumSquares += s * s;
    }
    rmsValues[frame] = Math.sqrt(sumSquares / (end - start));
  }
  return rmsValues;
}

function normalizeSeries(values) {
  const peak = values.reduce((acc, v) => (v > acc ? v : acc), 0);
  if (peak <= 0) {
    return values.map(() => 0);
  }
  return values.map((v) => Math.min(1, Math.max(0, v / peak)));
}

/**
 * Beat flags from onset attacks instead of energy maxima.
 * The old detector marked the frame where bass RMS peaked, which trails the real attack by
 * 40-200ms. Here the log-energy rise (flux) is measured on a 10ms hop for bass and full band;
 * each strong flux peak marks the frame that contains the attack itself.
 */
function detectOnsetBeats(bassSamples, fullSamples, fps, totalFrames) {
  const hop = Math.round(SAMPLE_RATE / 100);
  const hops = Math.floor(Math.min(bassSamples.length, fullSamples.length) / hop);
  const rmsHop = (samples) => {
    const out = new Float64Array(hops);
    for (let h = 0; h < hops; h++) {
      let sum = 0;
      for (let i = h * hop; i < (h + 1) * hop; i++) sum += samples[i] * samples[i];
      out[h] = Math.sqrt(sum / hop);
    }
    return out;
  };
  const flux = (env) => {
    const out = new Float64Array(hops);
    for (let h = 1; h < hops; h++) {
      out[h] = Math.max(0, Math.log(env[h] + 1e-4) - Math.log(env[h - 1] + 1e-4));
    }
    return out;
  };
  const bassFlux = flux(rmsHop(bassSamples));
  const fullFlux = flux(rmsHop(fullSamples));
  const onset = new Float64Array(hops);
  for (let h = 0; h < hops; h++) onset[h] = bassFlux[h] + fullFlux[h];

  // Candidate peaks: local maxima over +-4 hops, at least 120ms apart.
  const candidates = [];
  for (let h = 4; h < hops - 4; h++) {
    let isMax = true;
    for (let k = -4; k <= 4; k++) {
      if (onset[h + k] > onset[h]) {
        isMax = false;
        break;
      }
    }
    if (!isMax || onset[h] <= 0) continue;
    const last = candidates[candidates.length - 1];
    if (last && h - last.h < 12) {
      if (onset[h] > last.v) candidates[candidates.length - 1] = { h, v: onset[h] };
      continue;
    }
    candidates.push({ h, v: onset[h] });
  }

  // Keep the strongest ~40% so beats are accents, not every syllable.
  const sorted = candidates.map((c) => c.v).sort((x, y) => x - y);
  const threshold = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.6)] : 0;
  const beats = new Array(totalFrames).fill(false);
  for (const c of candidates) {
    if (c.v < threshold) continue;
    const frame = Math.min(totalFrames - 1, Math.floor((c.h / 100) * fps));
    beats[frame] = true;
  }
  return beats;
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printUsage();
    return;
  }

  if (!Number.isFinite(opts.fps) || opts.fps <= 0) {
    throw new Error(`Invalid --fps value: ${opts.fps}`);
  }

  const inputPath = opts.input ? path.resolve(opts.input) : DEFAULT_INPUT;
  const audioOut = opts.audioOut ? path.resolve(opts.audioOut) : DEFAULT_AUDIO_OUT;
  const energyOut = opts.energyOut
    ? path.resolve(opts.energyOut)
    : DEFAULT_ENERGY_OUT;

  const isCustomInput = Boolean(opts.input);
  const durationFrames =
    opts.durationFrames !== undefined
      ? Math.max(1, Math.round(opts.durationFrames))
      : isCustomInput
      ? Math.max(1, Math.round(probeDurationSec(inputPath) * opts.fps))
      : DEFAULT_DURATION_FRAMES;

  const samplesPerFrame = SAMPLE_RATE / opts.fps;

  console.log("Extracting MP3 audio...");
  extractAudioMp3(inputPath, audioOut);

  console.log("Decoding bass and full-band PCM...");
  const bassSamples = decodePcmFloat32(inputPath, "lowpass=f=180");
  const fullSamples = decodePcmFloat32(inputPath, null);

  const bassRms = computePerFrameRms(bassSamples, durationFrames, samplesPerFrame);
  const fullRms = computePerFrameRms(fullSamples, durationFrames, samplesPerFrame);

  const bassNorm = normalizeSeries(bassRms);
  const overallNorm = normalizeSeries(fullRms);
  const isBeatFlags = detectOnsetBeats(bassSamples, fullSamples, opts.fps, durationFrames);

  const frames = [];
  let beatCount = 0;
  for (let i = 0; i < durationFrames; i++) {
    if (isBeatFlags[i]) {
      beatCount++;
    }
    frames.push({
      bass: round4(bassNorm[i]),
      overall: round4(overallNorm[i]),
      isBeat: isBeatFlags[i],
    });
  }

  mkdirSync(path.dirname(energyOut), { recursive: true });
  writeFileSync(
    energyOut,
    `${JSON.stringify(
      {
        fps: opts.fps,
        durationInFrames: durationFrames,
        frames,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `Generated ${audioOut} and ${energyOut} (${frames.length} frames @ ${opts.fps}fps, ${beatCount} beat peaks).`
  );
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
