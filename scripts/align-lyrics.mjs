import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CREDITS_PER_MINUTE = 330;

function printUsage() {
  console.log(`Usage:
  pnpm run align:lyrics -- --audio <path> [options]
  pnpm run align:lyrics -- --export-review <align.json>
  pnpm run align:lyrics -- --apply-review <review.md> [--out <align.json>]

Options:
  --audio <path>            Audio or video file path (required for alignment/STT)
  --text "<lyrics>"         Plain text lyrics (defaults --mode to align)
  --text-file <path>        Plain text lyrics file (defaults --mode to align)
  --mode <align|stt>        Forced alignment ("align") or Scribe STT ("stt")
  --fps <number>            Target composition FPS for frame math (default: 24)
  --lang <iso-code>         Optional languageCode for stt mode (e.g. vi, vie, eng)
  --model <id>              STT model ID (default: scribe_v3)
  --out <path>              Output JSON path (default: src/storyboards/<name>.align.json)
  --dry-run                 Probe duration, compute cacheKey, estimate credits, make no API call
  --force                   Re-run API even if cacheKey + fps already match --out
  --export-review <json>    Generate or refresh <name>.review.md from an existing .align.json
  --apply-review <md>       Sync edited words/frames from <name>.review.md back to .align.json
  -h, --help                Show this help message`);
}

function parseCliArgs(rawArgs) {
  const argv = [...rawArgs];
  if (argv[0] === "--") {
    argv.shift();
  }

  const opts = {
    audio: undefined,
    text: undefined,
    textFile: undefined,
    mode: undefined,
    fps: 24,
    lang: undefined,
    model: "scribe_v3",
    out: undefined,
    exportReview: undefined,
    applyReview: undefined,
    dryRun: false,
    force: false,
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
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--force") opts.force = true;
    else if (arg === "--audio") opts.audio = nextValue();
    else if (arg === "--text") opts.text = nextValue();
    else if (arg === "--text-file") opts.textFile = nextValue();
    else if (arg === "--mode") opts.mode = nextValue();
    else if (arg === "--fps") opts.fps = Number(nextValue());
    else if (arg === "--lang") opts.lang = nextValue();
    else if (arg === "--model") opts.model = nextValue();
    else if (arg === "--out") opts.out = nextValue();
    else if (arg === "--export-review") opts.exportReview = nextValue();
    else if (arg === "--apply-review") opts.applyReview = nextValue();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/** Derive paired .review.md path from an .align.json path. */
function deriveReviewPath(alignPath) {
  if (alignPath.endsWith(".align.json")) {
    return `${alignPath.slice(0, -".align.json".length)}.review.md`;
  }
  return `${alignPath}.review.md`;
}

/** Derive paired .align.json path from a .review.md path. */
function deriveAlignPathFromReview(reviewPath) {
  if (reviewPath.endsWith(".review.md")) {
    return `${reviewPath.slice(0, -".review.md".length)}.align.json`;
  }
  return `${reviewPath}.align.json`;
}

/** Probe media duration in seconds with ffprobe; returns null if unavailable. */
function probeDurationSec(filePath) {
  try {
    const raw = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        filePath,
      ],
      { encoding: "utf8" }
    ).trim();
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/** Build a deterministic SHA-256 key over audio bytes and alignment parameters. */
function computeCacheKey({ audioPath, mode, normalizedText, model, lang }) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(audioPath));
  hash.update("\n");
  hash.update(
    JSON.stringify({
      mode,
      text: normalizedText,
      model: mode === "stt" ? model : "forced-alignment",
      lang: lang ?? "",
    })
  );
  return hash.digest("hex");
}

function readCachedAlignment(outPath, cacheKey, fps) {
  if (!fs.existsSync(outPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(outPath, "utf8"));
    if (parsed && parsed.cacheKey === cacheKey && parsed.fps === fps) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/** Flag potential alignment or transcription issues for human review. */
function computeWordFlags(words) {
  const flagged = words.map((w, i) => {
    const flags = [];
    const duration = Number(w.endSec) - Number(w.startSec);
    if (typeof w.loss === "number" && w.loss > 0.35) {
      flags.push("LOW_CONF");
    }
    if (duration < 0.06) {
      flags.push("TOO_SHORT");
    }
    if (duration > 2.5) {
      flags.push("TOO_LONG");
    }
    if (i > 0 && Number(w.startSec) < Number(words[i - 1].endSec) - 0.005) {
      flags.push("OVERLAP");
    }
    return {
      ...w,
      flags,
    };
  });
  const flaggedCount = flagged.filter((w) => w.flags.length > 0).length;
  return { words: flagged, flaggedCount };
}

/** Convert ElevenLabs word seconds into millisecond, frame boundaries, and anomaly flags. */
function mapWordsToFrames(rawWords, fps) {
  const mapped = [];
  for (const w of rawWords) {
    if ("type" in w && w.type && w.type !== "word") {
      continue;
    }
    const text = String(w.text ?? "").trim();
    if (!text) {
      continue;
    }
    const startSec = Number(w.start ?? 0);
    const endSec = Math.max(startSec, Number(w.end ?? startSec));
    const startFrame = Math.round(startSec * fps);
    const endFrame = Math.max(startFrame + 1, Math.round(endSec * fps));
    mapped.push({
      text,
      startSec,
      endSec,
      startMs: Math.round(startSec * 1000),
      endMs: Math.round(endSec * 1000),
      startFrame,
      endFrame,
      ...(typeof w.loss === "number" ? { loss: w.loss } : {}),
    });
  }
  return computeWordFlags(mapped);
}

function escapeTableCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function splitMarkdownCells(line) {
  const cells = [];
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "\\" && i + 1 < line.length && line[i + 1] === "|") {
      current += "|";
      i += 1;
    } else if (ch === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  if (cells.length > 0 && cells[0] === "") cells.shift();
  if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

/** Render a reviewable Markdown sheet paired with an .align.json file. */
function formatReviewMarkdown(payload, alignPath, reviewPath) {
  const relAlign = path.relative(process.cwd(), alignPath).replace(/\\/g, "/");
  const relReview = path.relative(process.cwd(), reviewPath).replace(/\\/g, "/");
  const applyArg = relReview.startsWith("..") ? reviewPath : relReview;

  const lines = [
    "# Lyrics Alignment Review",
    "",
    `- audio: \`${payload.audio ?? "unknown"}\``,
    `- mode: \`${payload.mode ?? "unknown"}\``,
    `- fps: \`${payload.fps}\``,
    `- reviewed: \`${Boolean(payload.reviewed)}\``,
    `- flaggedCount: \`${payload.flaggedCount ?? 0}\``,
    `- alignFile: \`${relAlign}\``,
    "",
    "Edit `Text`, `StartFrame`, or `EndFrame` in the table below (`StartSec` / `EndSec` / `Flags` are recalculated automatically), then run:",
    "",
    "```bash",
    `pnpm run align:lyrics -- --apply-review "${applyArg}"`,
    "```",
    "",
    "| # | Text | StartFrame | EndFrame | StartSec | EndSec | Flags |",
    "| ---: | --- | ---: | ---: | ---: | ---: | --- |",
  ];

  (payload.words ?? []).forEach((w, idx) => {
    const flagsLabel =
      Array.isArray(w.flags) && w.flags.length > 0 ? w.flags.join(", ") : "-";
    lines.push(
      `| ${idx + 1} | ${escapeTableCell(w.text)} | ${w.startFrame} | ${w.endFrame} | ${Number(
        w.startSec
      ).toFixed(3)} | ${Number(w.endSec).toFixed(3)} | ${flagsLabel} |`
    );
  });

  lines.push("");
  return lines.join("\n");
}

/** Parse edited rows from a .review.md table. */
function parseReviewMarkdown(markdownText) {
  const rows = [];
  const rawLines = markdownText.split(/\r?\n/);
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      continue;
    }
    const cells = splitMarkdownCells(trimmed);
    if (cells.length < 7) {
      continue;
    }
    if (cells[0] === "#" || /^[-:\s]+$/.test(cells[0])) {
      continue;
    }

    const rowIndex = Number(cells[0]);
    if (!Number.isInteger(rowIndex) || rowIndex <= 0) {
      throw new Error(`Invalid row index "${cells[0]}" in review table.`);
    }
    const text = cells[1].trim();
    if (!text) {
      throw new Error(`Empty word text at row #${rowIndex}.`);
    }

    const startFrame = Number(cells[2]);
    let endFrame = Number(cells[3]);
    if (
      !Number.isInteger(startFrame) ||
      !Number.isInteger(endFrame) ||
      startFrame < 0 ||
      endFrame < 0
    ) {
      throw new Error(
        `StartFrame/EndFrame must be non-negative integers at row #${rowIndex} ("${text}").`
      );
    }
    if (endFrame < startFrame) {
      throw new Error(
        `EndFrame (${endFrame}) cannot be less than StartFrame (${startFrame}) at row #${rowIndex}.`
      );
    }
    if (endFrame === startFrame) {
      endFrame = Math.max(startFrame + 1, endFrame);
    }

    rows.push({
      rowIndex,
      text,
      startFrame,
      endFrame,
    });
  }

  if (rows.length === 0) {
    throw new Error("No valid word rows found in review Markdown table.");
  }
  return rows;
}

function handleExportReview(alignArg) {
  const alignPath = path.resolve(alignArg);
  if (!fs.existsSync(alignPath)) {
    throw new Error(`Alignment JSON not found: ${alignPath}`);
  }
  const payload = JSON.parse(fs.readFileSync(alignPath, "utf8"));
  const { words, flaggedCount } = computeWordFlags(payload.words ?? []);
  const updatedPayload = {
    ...payload,
    reviewed: Boolean(payload.reviewed),
    flaggedCount,
    words,
  };
  const reviewPath = deriveReviewPath(alignPath);
  fs.writeFileSync(
    alignPath,
    `${JSON.stringify(updatedPayload, null, 2)}\n`,
    "utf8"
  );
  fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
  fs.writeFileSync(
    reviewPath,
    formatReviewMarkdown(updatedPayload, alignPath, reviewPath),
    "utf8"
  );
  console.log(
    `Exported ${words.length} words (${flaggedCount} flagged) to ${reviewPath}`
  );
}

function handleApplyReview(reviewArg, outArg) {
  const reviewPath = path.resolve(reviewArg);
  if (!fs.existsSync(reviewPath)) {
    throw new Error(`Review Markdown file not found: ${reviewPath}`);
  }
  const alignPath = path.resolve(outArg ?? deriveAlignPathFromReview(reviewPath));
  if (!fs.existsSync(alignPath)) {
    throw new Error(`Paired alignment JSON not found: ${alignPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(alignPath, "utf8"));
  const fps = Number(payload.fps);
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`Invalid fps in ${alignPath}: ${payload.fps}`);
  }

  const prevWords = Array.isArray(payload.words) ? payload.words : [];
  const parsedRows = parseReviewMarkdown(fs.readFileSync(reviewPath, "utf8"));

  let modifiedCount = 0;
  const nextRawWords = parsedRows.map((row, idx) => {
    const prev = prevWords[row.rowIndex - 1] ?? prevWords[idx];
    const startSec = Number((row.startFrame / fps).toFixed(4));
    const endSec = Number((row.endFrame / fps).toFixed(4));
    if (
      !prev ||
      prev.text !== row.text ||
      prev.startFrame !== row.startFrame ||
      prev.endFrame !== row.endFrame
    ) {
      modifiedCount += 1;
    }
    return {
      text: row.text,
      startSec,
      endSec,
      startMs: Math.round(startSec * 1000),
      endMs: Math.round(endSec * 1000),
      startFrame: row.startFrame,
      endFrame: row.endFrame,
      ...(prev && typeof prev.loss === "number" ? { loss: prev.loss } : {}),
    };
  });

  if (prevWords.length !== nextRawWords.length) {
    modifiedCount += Math.abs(prevWords.length - nextRawWords.length);
  }

  const { words, flaggedCount } = computeWordFlags(nextRawWords);
  const updatedPayload = {
    ...payload,
    reviewed: true,
    reviewedAt: new Date().toISOString(),
    flaggedCount,
    words,
  };

  fs.writeFileSync(
    alignPath,
    `${JSON.stringify(updatedPayload, null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(
    reviewPath,
    formatReviewMarkdown(updatedPayload, alignPath, reviewPath),
    "utf8"
  );
  console.log(
    `Applied review to ${alignPath} (${modifiedCount} modified, ${flaggedCount} flagged, reviewed=true).`
  );
}

async function run() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printUsage();
    return;
  }
  if (opts.exportReview) {
    handleExportReview(opts.exportReview);
    return;
  }
  if (opts.applyReview) {
    handleApplyReview(opts.applyReview, opts.out);
    return;
  }

  if (!opts.audio) {
    printUsage();
    throw new Error("--audio <path> is required");
  }
  if (!Number.isFinite(opts.fps) || opts.fps <= 0) {
    throw new Error(`Invalid --fps value: ${opts.fps}`);
  }

  const audioPath = path.resolve(opts.audio);
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  let rawText = opts.text ?? "";
  if (opts.textFile) {
    const textPath = path.resolve(opts.textFile);
    if (!fs.existsSync(textPath)) {
      throw new Error(`Text file not found: ${textPath}`);
    }
    rawText = fs.readFileSync(textPath, "utf8");
  }
  const normalizedText = rawText.replace(/\s+/g, " ").trim();

  const mode = opts.mode ?? (normalizedText ? "align" : "stt");
  if (mode !== "align" && mode !== "stt") {
    throw new Error(`Invalid --mode "${mode}". Use "align" or "stt".`);
  }
  if (mode === "align" && !normalizedText) {
    throw new Error("Forced alignment (--mode align) requires --text or --text-file.");
  }

  const baseName = path.basename(audioPath, path.extname(audioPath));
  const outPath = path.resolve(
    opts.out ?? path.join("src", "storyboards", `${baseName}.align.json`)
  );
  const reviewPath = deriveReviewPath(outPath);

  const durationSec = probeDurationSec(audioPath);
  const estCredits = durationSec
    ? Math.max(1, Math.ceil((durationSec / 60) * CREDITS_PER_MINUTE))
    : null;

  const cacheKey = computeCacheKey({
    audioPath,
    mode,
    normalizedText,
    model: opts.model,
    lang: opts.lang,
  });

  const cached = opts.force ? null : readCachedAlignment(outPath, cacheKey, opts.fps);

  if (opts.dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          audio: path.relative(process.cwd(), audioPath).replace(/\\/g, "/"),
          out: path.relative(process.cwd(), outPath).replace(/\\/g, "/"),
          reviewFile: path.relative(process.cwd(), reviewPath).replace(/\\/g, "/"),
          mode,
          model: mode === "stt" ? opts.model : "forced-alignment",
          fps: opts.fps,
          durationSec: durationSec ? Number(durationSec.toFixed(3)) : null,
          estimatedCredits: cached ? 0 : estCredits,
          cacheHit: Boolean(cached),
          cacheKey,
        },
        null,
        2
      )
    );
    return;
  }

  if (cached) {
    if (!fs.existsSync(reviewPath)) {
      const { words, flaggedCount } = computeWordFlags(cached.words ?? []);
      const refreshed = {
        ...cached,
        flaggedCount,
        words,
      };
      fs.writeFileSync(
        reviewPath,
        formatReviewMarkdown(refreshed, outPath, reviewPath),
        "utf8"
      );
    }
    console.log(
      `Cache hit (${cached.words?.length ?? 0} words) at ${outPath}. 0 credits spent.`
    );
    return;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error(
      "ELEVENLABS_API_KEY is not set in the environment. Run via `pnpm run align:lyrics -- ...` (loads .env.local) or run `pnpm dlx @elevenlabs/cli@latest onboard connect --env-path .env.local`."
    );
  }

  const client = new ElevenLabsClient();
  let aligned = { words: [], flaggedCount: 0 };
  let extraMeta = {};

  if (mode === "align") {
    const res = await client.forcedAlignment.create({
      file: fs.createReadStream(audioPath),
      text: normalizedText,
    });
    aligned = mapWordsToFrames(res.words ?? [], opts.fps);
    extraMeta = {
      ...(typeof res.loss === "number" ? { loss: res.loss } : {}),
    };
  } else {
    const res = await client.speechToText.convert({
      file: fs.createReadStream(audioPath),
      modelId: opts.model,
      timestampsGranularity: "word",
      ...(opts.lang ? { languageCode: opts.lang } : {}),
    });
    aligned = mapWordsToFrames(res.words ?? [], opts.fps);
    extraMeta = {
      transcript: res.text ?? "",
      languageCode: res.languageCode ?? opts.lang ?? null,
    };
  }

  const payload = {
    audio: path.relative(process.cwd(), audioPath).replace(/\\/g, "/"),
    durationSec: durationSec ? Number(durationSec.toFixed(3)) : null,
    mode,
    model: mode === "stt" ? opts.model : "forced-alignment",
    fps: opts.fps,
    cacheKey,
    createdAt: new Date().toISOString(),
    reviewed: false,
    flaggedCount: aligned.flaggedCount,
    ...extraMeta,
    words: aligned.words,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reviewPath,
    formatReviewMarkdown(payload, outPath, reviewPath),
    "utf8"
  );
  console.log(
    `Wrote ${aligned.words.length} aligned words (${aligned.flaggedCount} flagged) to ${outPath} and ${reviewPath}`
  );
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
