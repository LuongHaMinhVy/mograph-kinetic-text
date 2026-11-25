import fs from "node:fs";
import path from "node:path";

function printUsage() {
  console.log(`Usage:
  pnpm run lint:storyboard -- --storyboard <path> [--strict]

Options:
  --storyboard <path>   Path to .storyboard.json or .props.json (required)
  --strict              Exit with non-zero code on warnings as well as errors
  -h, --help            Show this help message`);
}

function parseCliArgs(rawArgs) {
  const argv = [...rawArgs];
  if (argv[0] === "--") {
    argv.shift();
  }
  const opts = {
    storyboard: undefined,
    strict: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--strict") {
      opts.strict = true;
    } else if (arg === "--storyboard") {
      if (i + 1 >= argv.length) {
        throw new Error("Missing value for flag --storyboard");
      }
      i += 1;
      opts.storyboard = argv[i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

function estimateWordBox(word) {
  const lines = String(word.text ?? "").split("\n");
  const maxLineChars = Math.max(1, ...lines.map((l) => l.length));
  const charFactor = word.useNarrowDisplay ? 0.48 : 0.56;
  const estW = Math.min(
    word.maxWidthPx ?? 1120,
    maxLineChars * word.fontSize * charFactor
  );
  const estH = lines.length * word.fontSize * 0.9;
  const align = word.align ?? "center";
  const centerX =
    align === "left"
      ? word.x + estW / 2
      : align === "right"
      ? word.x - estW / 2
      : word.x;
  return { centerX, centerY: word.y, width: estW, height: estH };
}

function runLint(storyboard) {
  const errors = [];
  const warnings = [];
  const fps = Number(storyboard.fps) || 24;
  const durationInFrames = Number(storyboard.durationInFrames) || 0;
  const allWords = Array.isArray(storyboard.words) ? storyboard.words : [];
  // Ghost trails and micro captions are decorative and may overlap readable words.
  const words = allWords.filter((w) => !w.ambient);
  const graphics = Array.isArray(storyboard.graphics) ? storyboard.graphics : [];

  // 1. Granularity & Entrance Variety
  const granularityCounts = { char: 0, word: 0, sentence: 0, unspecified: 0 };
  for (const w of words) {
    if (w.granularity === "char" || w.granularity === "word" || w.granularity === "sentence") {
      granularityCounts[w.granularity] += 1;
    } else {
      granularityCounts.unspecified += 1;
    }
  }

  let runSig = "";
  let runLen = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const sig = `${w.entrance ?? ""}|${w.revealDir ?? ""}|${w.exitStyle ?? "cut"}`;
    if (sig === runSig) {
      runLen += 1;
      if (runLen === 3) {
        warnings.push(
          `3+ consecutive WordNodes share identical signature (${sig}) ending at "${w.id}"`
        );
      }
    } else {
      runSig = sig;
      runLen = 1;
    }
  }

  // 2. Transition Variety
  const transitions = graphics
    .filter((g) => g.kind === "sceneTransition")
    .sort((a, b) => a.startFrame - b.startFrame);
  const transitionVariants = transitions.map((t) => t.variant);
  // Camera glides and whips between compositions count as transitions too.
  const camKeys = Array.isArray(storyboard.cameraKeyframes) ? storyboard.cameraKeyframes : [];
  let cameraTravels = 0;
  for (let i = 1; i < camKeys.length; i++) {
    const a = camKeys[i - 1];
    const b = camKeys[i];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (dist >= 500 && b.frame - a.frame <= fps) cameraTravels += 1;
  }
  if (durationInFrames >= fps * 4 && transitions.length === 0 && cameraTravels < 3) {
    warnings.push(
      `Storyboard spans ${durationInFrames}f (>= 4s) without any sceneTransition graphics`
    );
  }
  for (let i = 1; i < transitions.length; i++) {
    if (transitions[i].variant === transitions[i - 1].variant) {
      warnings.push(
        `Consecutive sceneTransitions share variant "${transitions[i].variant}" (${transitions[i - 1].id} -> ${transitions[i].id})`
      );
    }
  }

  // 3. Unintended Text Collision
  // Words that share (almost) the same spot may only cross-fade briefly; words
  // that merely sit near each other get the longer tolerance.
  const maxAllowedOverlapFrames = Math.round(0.45 * fps);
  const maxSameSpotOverlapFrames = Math.round(0.25 * fps);
  const sameLayer = (a, b) =>
    Boolean(a.screenFixed) === Boolean(b.screenFixed) &&
    // Distinct background vs foreground depth layers can overlap intentionally.
    Math.abs((a.zIndex ?? 20) - (b.zIndex ?? 20)) < 12;
  const boxes = new Map(words.map((w) => [w.id, estimateWordBox(w)]));
  const boxesCollide = (a, b, factor) => {
    const boxA = boxes.get(a.id);
    const boxB = boxes.get(b.id);
    const dx = Math.abs(boxA.centerX - boxB.centerX);
    const dy = Math.abs(boxA.centerY - boxB.centerY);
    return {
      hit:
        dx < (boxA.width + boxB.width) * factor &&
        dy < (boxA.height + boxB.height) * (factor + 0.05),
      dx,
      dy,
    };
  };

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i];
      const b = words[j];
      if (!sameLayer(a, b)) continue;
      // A word that is already sliding or fading out is leaving, not colliding: count only the
      // part of its life before the exit really hides it (first 40% of the exit window).
      const effEnd = (w) =>
        w.exitStyle && w.exitStyle !== "cut" && w.exitDurationFrames
          ? w.endFrame - Math.round(0.6 * w.exitDurationFrames)
          : w.endFrame;
      const overlapFrames =
        Math.min(effEnd(a), effEnd(b)) - Math.max(a.startFrame, b.startFrame);
      if (overlapFrames <= maxSameSpotOverlapFrames) continue;

      const sameSpot = boxesCollide(a, b, 0.1);
      const limit = sameSpot.hit
        ? maxSameSpotOverlapFrames
        : maxAllowedOverlapFrames;
      if (overlapFrames <= limit) continue;
      const near = sameSpot.hit ? sameSpot : boxesCollide(a, b, 0.5);
      if (near.hit) {
        errors.push(
          `Text collision between "${a.id}" and "${b.id}" (${overlapFrames}f overlap > ${limit}f; dx=${near.dx.toFixed(
            0
          )}, dy=${near.dy.toFixed(0)})`
        );
      }
    }
  }

  // 3b. Pile-up: 3+ colliding words visible on the same frame.
  const pileReported = new Set();
  for (let f = 0; f < durationInFrames; f++) {
    const leavingEnd = (w) =>
      w.exitStyle && w.exitStyle !== "cut" && w.exitDurationFrames
        ? w.endFrame - Math.round(0.6 * w.exitDurationFrames)
        : w.endFrame;
    const active = words.filter((w) => w.startFrame <= f && f < leavingEnd(w));
    if (active.length < 3) continue;
    for (const a of active) {
      const mates = active.filter(
        (b) => b !== a && sameLayer(a, b) && boxesCollide(a, b, 0.5).hit
      );
      if (mates.length < 2) continue;
      const ids = [a.id, ...mates.map((m) => m.id)].sort().join(" + ");
      if (pileReported.has(ids)) continue;
      pileReported.add(ids);
      errors.push(`Text pile-up of ${mates.length + 1} words at f=${f}: ${ids}`);
    }
  }

  // 4. Screen-Fixed Safe-Area Overflow
  for (const w of words) {
    if (!w.screenFixed) continue;
    if (w.x < 40 || w.x > 1160 || w.y < 40 || w.y > 860) {
      errors.push(
        `Screen-fixed WordNode "${w.id}" at (${w.x}, ${w.y}) falls outside [40..1160, 40..860] safe area`
      );
    }
  }

  // 5. Pacing Spread
  const defaultEntFrames = Math.max(1, Math.round(6 * (fps / 24)));
  const entDurations = words.map(
    (w) => w.entranceDurationFrames ?? defaultEntFrames
  );
  const wordDurations = words.map((w) => Math.max(1, w.endFrame - w.startFrame));

  return {
    id: storyboard.id,
    stylePackId: storyboard.stylePackId,
    fps,
    durationInFrames,
    wordCount: words.length,
    granularityCounts,
    transitions: transitionVariants,
    entranceSpreadFrames: {
      min: entDurations.length ? Math.min(...entDurations) : 0,
      median: median(entDurations),
      max: entDurations.length ? Math.max(...entDurations) : 0,
    },
    durationSpreadFrames: {
      min: wordDurations.length ? Math.min(...wordDurations) : 0,
      median: median(wordDurations),
      max: wordDurations.length ? Math.max(...wordDurations) : 0,
    },
    errors,
    warnings,
  };
}

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printUsage();
    return;
  }
  if (!opts.storyboard) {
    printUsage();
    throw new Error("--storyboard <path> is required");
  }
  const targetPath = path.resolve(opts.storyboard);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Storyboard file not found: ${targetPath}`);
  }
  const parsed = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  const storyboard = parsed && parsed.storyboard ? parsed.storyboard : parsed;

  const report = runLint(storyboard);
  console.log(
    `Linted storyboard "${report.id}" (${report.stylePackId}, ${report.durationInFrames}f @ ${report.fps}fps, ${report.wordCount} words)`
  );
  console.log(
    `- granularity: char=${report.granularityCounts.char}, word=${report.granularityCounts.word}, sentence=${report.granularityCounts.sentence}, unspecified=${report.granularityCounts.unspecified}`
  );
  console.log(
    `- transitions (${report.transitions.length}): ${report.transitions.length > 0 ? report.transitions.join(", ") : "none"}`
  );
  console.log(
    `- entranceFrames: min=${report.entranceSpreadFrames.min}, median=${report.entranceSpreadFrames.median}, max=${report.entranceSpreadFrames.max}`
  );
  console.log(
    `- activeSpanFrames: min=${report.durationSpreadFrames.min}, median=${report.durationSpreadFrames.median}, max=${report.durationSpreadFrames.max}`
  );

  for (const w of report.warnings) {
    console.log(`[WARN] ${w}`);
  }
  for (const e of report.errors) {
    console.error(`[ERROR] ${e}`);
  }

  console.log(
    `Summary: ${report.errors.length} error(s), ${report.warnings.length} warning(s)`
  );

  if (report.errors.length > 0 || (opts.strict && report.warnings.length > 0)) {
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
