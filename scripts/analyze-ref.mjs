import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SAMPLE_SIZE = 64;
const MAX_WINDOW_FRAMES = 60;
const AUTO_WINDOW_FRAMES = 40;

function printUsage() {
  console.log(`Usage:
  pnpm run analyze:ref -- --input <video.mp4> [options]

Options:
  --input <path>        Reference video file path (required)
  --out-dir <dir>       Output folder (default: out/ref-analysis/<slug>)
  --window <start:end>  Explicit 1f/cell window, e.g. 20:59 (max 60 frames)
  --top-cuts <N>        Number of strongest motion peaks to record (default: 12)
  -h, --help            Show this help message`);
}

function parseCliArgs(rawArgs) {
  const argv = [...rawArgs];
  if (argv[0] === "--") {
    argv.shift();
  }

  const opts = {
    input: undefined,
    outDir: undefined,
    windowSpec: undefined,
    topCuts: 12,
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
    else if (arg === "--out-dir") opts.outDir = nextValue();
    else if (arg === "--window") opts.windowSpec = nextValue();
    else if (arg === "--top-cuts") opts.topCuts = Number(nextValue());
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function parseFps(rateStr) {
  const parts = String(rateStr || "24/1").split("/");
  const num = Number(parts[0]);
  const den = Number(parts[1] || 1);
  return den > 0 ? num / den : num || 24;
}

function probeVideoMeta(inputPath) {
  const raw = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=r_frame_rate,nb_frames,duration",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      inputPath,
    ],
    { encoding: "utf8" }
  );
  const parsed = JSON.parse(raw);
  const stream = parsed.streams?.[0] ?? {};
  const fps = parseFps(stream.r_frame_rate);
  const durationSec = Number(stream.duration ?? parsed.format?.duration ?? 0);
  const totalFrames = Number(stream.nb_frames) || Math.round(durationSec * fps);
  return { fps, durationSec, totalFrames };
}

/** Decode 64x64 grayscale frames and score frame-to-frame luminance delta. */
function computeFrameMotion(inputPath) {
  const raw = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      inputPath,
      "-vf",
      `scale=${SAMPLE_SIZE}:${SAMPLE_SIZE},format=gray`,
      "-f",
      "rawvideo",
      "-",
    ],
    { maxBuffer: 256 * 1024 * 1024 }
  );

  const frameBytes = SAMPLE_SIZE * SAMPLE_SIZE;
  const nFrames = Math.floor(raw.length / frameBytes);
  const scores = new Array(nFrames).fill(0);

  for (let i = 1; i < nFrames; i++) {
    const prevOff = (i - 1) * frameBytes;
    const currOff = i * frameBytes;
    let diff = 0;
    for (let k = 0; k < frameBytes; k++) {
      diff += Math.abs(raw[currOff + k] - raw[prevOff + k]);
    }
    scores[i] = Number((diff / frameBytes).toFixed(3));
  }
  return scores;
}

function selectTopPeaks(scores, fps, topN) {
  const indexed = scores.map((motionScore, frame) => ({ frame, motionScore }));
  indexed.sort((a, b) => b.motionScore - a.motionScore);

  const picked = [];
  for (const item of indexed) {
    if (item.frame <= 0) continue;
    if (picked.some((p) => Math.abs(p.frame - item.frame) < 4)) {
      continue;
    }
    picked.push({
      frame: item.frame,
      timeSec: Number((item.frame / Math.max(1, fps)).toFixed(3)),
      motionScore: item.motionScore,
    });
    if (picked.length >= topN) break;
  }
  return picked;
}

function resolveWindow(windowSpec, topPeaks, totalFrames) {
  const lastIdx = Math.max(0, totalFrames - 1);
  if (windowSpec) {
    const parts = windowSpec.split(":");
    if (parts.length !== 2) {
      throw new Error(`Invalid --window "${windowSpec}". Use <start:end>.`);
    }
    const start = Math.max(0, Math.min(lastIdx, Number(parts[0])));
    const end = Math.max(start, Math.min(lastIdx, Number(parts[1])));
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      throw new Error(`Window bounds must be integers: "${windowSpec}".`);
    }
    if (end - start + 1 > MAX_WINDOW_FRAMES) {
      throw new Error(
        `Window span ${end - start + 1} exceeds max ${MAX_WINDOW_FRAMES} frames.`
      );
    }
    return { start, end };
  }

  const peakFrame = topPeaks[0]?.frame ?? Math.floor(totalFrames / 2);
  const half = Math.floor(AUTO_WINDOW_FRAMES / 2);
  let start = Math.max(0, peakFrame - half);
  let end = Math.min(lastIdx, start + AUTO_WINDOW_FRAMES - 1);
  start = Math.max(0, end - AUTO_WINDOW_FRAMES + 1);
  return { start, end };
}

function renderOneFrameSheet(inputPath, outPngPath, start, end) {
  const count = end - start + 1;
  const cols = Math.min(8, count);
  const rows = Math.ceil(count / cols);
  const filter = `drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='f=%{n}':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.85,select='between(n\\,${start}\\,${end})',scale=240:-1,tile=${cols}x${rows}`;

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      inputPath,
      "-vf",
      filter,
      "-fps_mode",
      "vfr",
      "-frames:v",
      "1",
      outPngPath,
    ],
    { stdio: "inherit" }
  );
}

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printUsage();
    return;
  }
  if (!opts.input) {
    printUsage();
    throw new Error("--input <path> is required");
  }
  if (!Number.isInteger(opts.topCuts) || opts.topCuts <= 0) {
    throw new Error(`Invalid --top-cuts value: ${opts.topCuts}`);
  }

  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Video not found: ${inputPath}`);
  }

  const slug = path
    .basename(inputPath, path.extname(inputPath))
    .replace(/[^a-zA-Z0-9_-]+/g, "_");
  const outDir = path.resolve(
    opts.outDir ?? path.join("out", "ref-analysis", slug)
  );
  fs.mkdirSync(outDir, { recursive: true });

  const meta = probeVideoMeta(inputPath);
  const scores = computeFrameMotion(inputPath);
  const totalFrames = Math.max(meta.totalFrames, scores.length);
  const topPeaks = selectTopPeaks(scores, meta.fps, opts.topCuts);
  const win = resolveWindow(opts.windowSpec, topPeaks, totalFrames);

  const profilePath = path.join(outDir, "motion-profile.json");
  const sheetPath = path.join(outDir, `window_${win.start}_${win.end}_1f.png`);

  renderOneFrameSheet(inputPath, sheetPath, win.start, win.end);

  const profile = {
    input: path.relative(process.cwd(), inputPath).replace(/\\/g, "/"),
    fps: Number(meta.fps.toFixed(3)),
    totalFrames,
    durationSec: Number(meta.durationSec.toFixed(3)),
    window: win,
    topPeaks,
  };
  fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");

  console.log(`Analyzed ${inputPath} (${totalFrames}f @ ${profile.fps}fps)`);
  console.log(`- profile: ${profilePath}`);
  console.log(`- strip:   ${sheetPath}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
