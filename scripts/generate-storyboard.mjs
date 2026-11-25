import fs from "node:fs";
import path from "node:path";

const ALLOWED_FPS = [24, 30, 60];
const STYLE_DEFAULT_FPS = {
  "hk-1999-halftone": 24,
  "pop-collage-light": 30,
  "dreamy-glow-dark": 30,
  "neon-plexus-dark": 30,
  "pastel-editorial-light": 30,
};
const STYLE_IDS = Object.keys(STYLE_DEFAULT_FPS);

const SOLO_RIBBON_ANGLES = [-16, 14, -50, 34, -58];
const POP_STICKER_COLORS = ["#6C28FF", "#FF4518", "#8FD99F"];
const POP_STICKER_TILTS = [-6, 4, -3, 5];

function printUsage() {
  console.log(`Usage:
  pnpm run gen:storyboard -- --align <align.json> [options]

Options:
  --align <path>        Reviewed alignment JSON from align:lyrics (required)
  --energy <path>       Optional energy JSON from prep:audio
  --style <id>          hk-1999-halftone (24fps) | pop-collage-light (30fps) | dreamy-glow-dark (30fps) | neon-plexus-dark (30fps) | pastel-editorial-light (30fps)
  --fps <24|30|60>      Target FPS override (retime words from seconds cleanly; 120fps disabled)
  --title "<title>"     Storyboard title (default: derived from --align name)
  --audio-src <path>    Audio src relative to public/ (e.g. audio/song.mp3)
  --out <path>          Storyboard JSON path (default: src/storyboards/<slug>.storyboard.json)
  --props-out <path>    Remotion props JSON path (default: src/storyboards/<slug>.props.json)
  --allow-unreviewed    Bypass mandatory reviewed=true check (not recommended)
  -h, --help            Show this help message`);
}

function parseCliArgs(rawArgs) {
  const argv = [...rawArgs];
  if (argv[0] === "--") {
    argv.shift();
  }

  const opts = {
    align: undefined,
    energy: undefined,
    style: "hk-1999-halftone",
    fps: undefined,
    title: undefined,
    audioSrc: undefined,
    out: undefined,
    propsOut: undefined,
    allowUnreviewed: false,
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
    else if (arg === "--allow-unreviewed") opts.allowUnreviewed = true;
    else if (arg === "--align") opts.align = nextValue();
    else if (arg === "--energy") opts.energy = nextValue();
    else if (arg === "--style") opts.style = nextValue();
    else if (arg === "--fps") opts.fps = Number(nextValue());
    else if (arg === "--title") opts.title = nextValue();
    else if (arg === "--audio-src") opts.audioSrc = nextValue();
    else if (arg === "--out") opts.out = nextValue();
    else if (arg === "--props-out") opts.propsOut = nextValue();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function scaleFrames(baseAt24, targetFps) {
  return Math.max(1, Math.round(baseAt24 * (targetFps / 24)));
}

/**
 * Words that replace each other at the same screen position may only cross-fade
 * briefly. Two consecutive spans overlap by (exitOverlap + preReveal) frames, so
 * cap the exit overlap to keep that sum within 0.25s (the lint same-spot limit).
 * Without this, rapid solo hits pile up 3+ deep on the same coordinate.
 */
function capSameSpotOverlap(requestedFrames, fps, preRevealFrames = scaleFrames(2, fps)) {
  const budget = Math.round(0.25 * fps) - preRevealFrames;
  return Math.max(1, Math.min(requestedFrames, budget));
}

const ORGANIC_Y_OFFSETS = [0, 75, -28, 92, 18];

/** Compute varied horizontal spacing so connected word-maps avoid rigid grid repetition. */
function computeOrganicPositions(count, startX = 480, baseY = 405, minStep = 115) {
  const positions = [];
  let cursorX = startX;
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      cursorX += minStep + ((i * 37) % 52);
    }
    positions.push({
      x: cursorX,
      y: baseY + ORGANIC_Y_OFFSETS[i % ORGANIC_Y_OFFSETS.length],
    });
  }
  return positions;
}

const ACT1_REVEAL_DIRS = ["ltr", "btt", "rtl"];
const ACT1_EXIT_STYLES = ["mask-wipe-left", "mask-wipe-up", "char-peel"];
const ACT2_EXIT_STYLES = ["mask-wipe-up", "split-close", "char-peel"];

/** Expand [start, end] spans slightly so incoming reveals overlap outgoing exits. */
function computeCoupledSpan(
  wordStart,
  baseEnd,
  durationInFrames,
  preRevealFrames,
  exitOverlapFrames,
  minStart = 0
) {
  return {
    startFrame: Math.max(minStart, wordStart - preRevealFrames),
    endFrame: Math.min(durationInFrames, baseEnd + exitOverlapFrames),
  };
}

const LAYOUT_PRESETS = [
  "diagonal-staircase",
  "asymmetric-corner",
  "split-offset",
  "center-anchor",
];

/** Classify local pacing from word gap and beat proximity so bursts snap fast and holds ease gracefully. */
function classifyPacing(wordSlice, nextStartFrame, energyTrack, fps) {
  const items = Array.isArray(wordSlice) ? wordSlice : [wordSlice];
  const first = items[0];
  if (!first) {
    return { mode: "normal", entranceDurationFrames: scaleFrames(7, fps) };
  }
  const count = Math.max(1, items.length);
  const gapSec = Math.max(0, (nextStartFrame - first.startFrame) / Math.max(1, fps));
  const perWordGapSec = gapSec / count;
  const beatHit = items.some((w) => isNearBeat(energyTrack, w.startFrame, fps));

  if (perWordGapSec < 0.34 || (beatHit && perWordGapSec < 0.44)) {
    return { mode: "rapid", entranceDurationFrames: scaleFrames(4, fps) };
  }
  if (perWordGapSec >= 0.65 && !beatHit) {
    return { mode: "deliberate-hold", entranceDurationFrames: scaleFrames(10, fps) };
  }
  return { mode: "normal", entranceDurationFrames: scaleFrames(7, fps) };
}

/** Vary spatial coordinates & slight tilt across presets with uniform monotonic X spacing. */
function computeLayoutCoordinates(preset, index, baseX, baseY) {
  const x = baseX + index * 270;
  if (preset === "diagonal-staircase") {
    return {
      x,
      y: baseY - 72 + (index % 4) * 48,
      align: "center",
      tilt: index % 2 === 0 ? -3 : 3,
    };
  }
  if (preset === "asymmetric-corner") {
    return {
      x,
      y: baseY + (index % 2 === 0 ? -95 : 90),
      align: "center",
      tilt: index % 2 === 0 ? -5 : 4,
    };
  }
  if (preset === "split-offset") {
    const stepY = index % 3 === 0 ? -62 : index % 3 === 1 ? 70 : 0;
    return {
      x,
      y: baseY + stepY,
      align: "center",
      tilt: index % 2 === 0 ? 2.5 : -2.5,
    };
  }
  return {
    x,
    y: baseY + (index % 2 === 0 ? -24 : 26),
    align: "center",
    tilt: 0,
  };
}

const FREE_ROAM_VECTORS = [
  { dx: 380, dy: -220 },
  { dx: 0, dy: -260 },
  { dx: -360, dy: -200 },
  { dx: 440, dy: 35 },
  { dx: -390, dy: 210 },
  { dx: 30, dy: 270 },
  { dx: 370, dy: 230 },
  { dx: -440, dy: -30 },
  { dx: -250, dy: 250 },
];

/** Create an omnidirectional 2D walker that avoids collisions with still-active words. */
function createFreeRoamWalker(startX, startY) {
  let curX = startX;
  let curY = startY;
  const placed = [];

  return {
    record(x, y, endFrame) {
      placed.push({ x, y, endFrame });
    },
    next(startFrame, endFrame, idx, minDx = 410, minDy = 155) {
      const active = placed.filter((p) => p.endFrame > startFrame - 15);
      for (const mult of [1, 1.4, 1.9, 2.5]) {
        for (let offset = 0; offset < FREE_ROAM_VECTORS.length; offset += 1) {
          const vec =
            FREE_ROAM_VECTORS[(idx + offset) % FREE_ROAM_VECTORS.length];
          const nx = curX + Math.round(vec.dx * mult);
          const ny = curY + Math.round(vec.dy * mult);
          const clear = active.every(
            (p) => Math.abs(nx - p.x) >= minDx || Math.abs(ny - p.y) >= minDy
          );
          if (clear) {
            const dx = nx - curX;
            const dy = ny - curY;
            curX = nx;
            curY = ny;
            placed.push({ x: curX, y: curY, endFrame });
            return { x: curX, y: curY, dx, dy };
          }
        }
      }
      const fallback = FREE_ROAM_VECTORS[idx % FREE_ROAM_VECTORS.length];
      const dx = Math.round(fallback.dx * 3);
      const dy = Math.round(fallback.dy * 3);
      curX += dx;
      curY += dy;
      placed.push({ x: curX, y: curY, endFrame });
      return { x: curX, y: curY, dx, dy };
    },
  };
}

/** Partition a word array into irregular solo/duo/trio/quartet groupings. */
function partitionVariableGroups(wordList) {
  const pattern = [1, 3, 2, 4, 1, 3, 1, 2, 3];
  const groups = [];
  let cursor = 0;
  let p = 0;
  while (cursor < wordList.length) {
    const take = Math.min(
      pattern[p % pattern.length],
      wordList.length - cursor
    );
    groups.push(wordList.slice(cursor, cursor + take));
    cursor += take;
    p += 1;
  }
  return groups;
}

/** Pick a mask-glide reveal direction aligned with the 2D displacement vector. */
function pickVectorRevealDir(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "ltr" : "rtl";
  }
  return dy >= 0 ? "ttb" : "btt";
}

/** Pick an exit wipe or peel aligned with travel direction (with periodic split/peel variety). */
function pickVectorExitStyle(dx, dy, idx) {
  if (idx % 5 === 4) {
    return idx % 10 === 4 ? "split-close" : "char-peel";
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "mask-wipe-right" : "mask-wipe-left";
  }
  return dy >= 0 ? "mask-wipe-down" : "mask-wipe-up";
}

/** Insert a screen-fixed scene transition graphic straddling an Act boundary. */
function pushActTransition(
  graphics,
  id,
  cutFrame,
  fps,
  variant,
  direction,
  color,
  accentColor,
  durationInFrames
) {
  if (!Number.isFinite(cutFrame) || cutFrame <= 0 || cutFrame >= durationInFrames) {
    return;
  }
  const lead = variant === "inverted-flash" ? 1 : scaleFrames(3, fps);
  const trail =
    variant === "inverted-flash"
      ? Math.max(2, scaleFrames(2, fps))
      : scaleFrames(3, fps);
  graphics.push({
    kind: "sceneTransition",
    id,
    startFrame: Math.max(0, cutFrame - lead),
    endFrame: Math.min(durationInFrames, cutFrame + trail),
    variant,
    ...(direction ? { direction } : {}),
    ...(color ? { color } : {}),
    ...(accentColor ? { accentColor } : {}),
    screenFixed: true,
    zIndex: 42,
  });
}

function deriveSlug(alignPath) {
  const base = path.basename(alignPath);
  if (base.endsWith(".align.json")) {
    return base.slice(0, -".align.json".length);
  }
  return path.basename(alignPath, path.extname(alignPath));
}

function normalizeAudioSrc(alignAudio, overrideAudioSrc) {
  const raw = overrideAudioSrc ?? alignAudio;
  if (!raw) {
    return undefined;
  }
  const slash = String(raw).replace(/\\/g, "/");
  return slash.startsWith("public/") ? slash.slice("public/".length) : slash;
}

function isNearBeat(energyTrack, frame, targetFps) {
  if (!energyTrack || !Array.isArray(energyTrack.frames) || energyTrack.frames.length === 0) {
    return false;
  }
  const trackFps = Number(energyTrack.fps) || targetFps;
  const centerIdx = Math.round((frame / Math.max(1, targetFps)) * trackFps);
  for (let offset = -1; offset <= 1; offset++) {
    const idx = centerIdx + offset;
    if (idx >= 0 && idx < energyTrack.frames.length) {
      const sample = energyTrack.frames[idx];
      if (sample && sample.isBeat) {
        return true;
      }
    }
  }
  return false;
}

/** Build per-word timing cues inside a cohesive sentence and highlight the key punch word. */
function buildWordTimingCues(wordSlice, emphasisColor, preRevealFrames = 0) {
  if (!Array.isArray(wordSlice) || wordSlice.length === 0) {
    return [];
  }
  let heroIdx = wordSlice.length - 1;
  let maxLen = 0;
  wordSlice.forEach((w, idx) => {
    const cleanLen = String(w.text).trim().length;
    if (cleanLen >= maxLen) {
      maxLen = cleanLen;
      heroIdx = idx;
    }
  });
  return wordSlice.map((w, idx) => {
    const isHero = idx === heroIdx;
    return {
      text: w.text,
      startFrame: Math.max(0, w.startFrame - preRevealFrames),
      endFrame: w.endFrame,
      ...(isHero ? { emphasis: true, color: emphasisColor } : {}),
    };
  });
}

/** Insert a balanced line break when a sentence spans 4 or more words. */
function formatSentenceLines(text) {
  const parts = String(text).trim().split(/\s+/).filter(Boolean);
  if (parts.length < 4) {
    return parts.join(" ");
  }
  const mid = Math.ceil(parts.length / 2);
  return `${parts.slice(0, mid).join(" ")}\n${parts.slice(mid).join(" ")}`;
}

/** Group words into short display phrases (2-4 words) keeping tight frame spans. */
function groupPhrases(actWords, actEndFrame, targetFps, wordsPerPhrase = 3) {
  const phrases = [];
  const minSpan = scaleFrames(2, targetFps);
  for (let i = 0; i < actWords.length; i += wordsPerPhrase) {
    const chunk = actWords.slice(i, i + wordsPerPhrase);
    if (chunk.length === 0) continue;
    const nextChunkStart =
      i + wordsPerPhrase < actWords.length
        ? actWords[i + wordsPerPhrase].startFrame
        : actEndFrame;
    const startFrame = chunk[0].startFrame;
    const endFrame = Math.max(
      startFrame + minSpan,
      nextChunkStart,
      chunk[chunk.length - 1].endFrame
    );
    phrases.push({
      text: chunk.map((w) => w.text).join(" "),
      words: chunk,
      startFrame,
      endFrame,
    });
  }
  return phrases;
}

/** Normalize and retime word boundaries directly from seconds into targetFps frames. */
function normalizeTimeline(alignData, energyTrack, targetFps) {
  const alignFps = Number(alignData.fps) || 24;
  const rawWords = Array.isArray(alignData.words) ? alignData.words : [];
  if (rawWords.length === 0) {
    throw new Error("Alignment file contains zero words.");
  }

  const minWordFrames = scaleFrames(2, targetFps);
  const toTargetFrame = (w, secKey, frameKey, fallback) => {
    if (typeof w[secKey] === "number" && Number.isFinite(w[secKey])) {
      return Math.round(w[secKey] * targetFps);
    }
    if (typeof w[frameKey] === "number" && Number.isFinite(w[frameKey])) {
      return Math.round(w[frameKey] * (targetFps / alignFps));
    }
    return fallback;
  };

  const words = rawWords.map((w, idx) => {
    const startFrame = Math.max(0, toTargetFrame(w, "startSec", "startFrame", 0));
    const nextRaw = rawWords[idx + 1];
    const minEnd = Math.max(
      startFrame + minWordFrames,
      toTargetFrame(w, "endSec", "endFrame", startFrame + minWordFrames)
    );
    const nextStart = nextRaw
      ? toTargetFrame(nextRaw, "startSec", "startFrame", minEnd)
      : minEnd;
    const sungSec =
      typeof w.startSec === "number" && typeof w.endSec === "number"
        ? w.endSec - w.startSec
        : (minEnd - startFrame) / targetFps;
    return {
      text: String(w.text).trim(),
      startFrame,
      endFrame: Math.max(minEnd, nextStart),
      sungSec,
      ...(w.phraseEnd ? { phraseEnd: true } : {}),
    };
  });

  const lastWordEnd = words[words.length - 1].endFrame;
  const energyDurationSec =
    energyTrack && energyTrack.durationInFrames && energyTrack.fps
      ? Number(energyTrack.durationInFrames) / Number(energyTrack.fps)
      : 0;
  const durationSec = Number(alignData.durationSec) || energyDurationSec || 0;
  const durationInFrames = Math.max(
    lastWordEnd + targetFps,
    durationSec > 0 ? Math.round(durationSec * targetFps) : lastWordEnd + targetFps
  );

  return { fps: targetFps, words, lastWordEnd, durationInFrames };
}

function splitFourActs(words) {
  const count = words.length;
  const cut1 = Math.max(1, Math.round(count * 0.35));
  const cut2 = count >= 8 ? Math.max(cut1 + 1, Math.round(count * 0.62)) : count;
  const cut3 = count >= 8 ? Math.max(cut2 + 1, Math.round(count * 0.76)) : count;
  return {
    act1Words: words.slice(0, cut1),
    act2Words: words.slice(cut1, cut2),
    act3Words: words.slice(cut2, cut3),
    act4Words: words.slice(cut3),
  };
}

function pushSilenceIntro(cameraKeyframes, firstStart) {
  if (firstStart > 0) {
    cameraKeyframes.push(
      { frame: 0, x: 600, y: 450, zoom: 1.0, rotateDeg: 0, easing: "hold" },
      { frame: firstStart - 1, x: 600, y: 450, zoom: 1.0, rotateDeg: 0, easing: "hold" }
    );
  }
}

/** Build Style #1 (HK1999 Halftone): crimson halftone ribbons, cyan censor, panoramic chorus. */
function buildHk1999Storyboard({ alignData, energyTrack, targetFps, title, slug, audioSrc }) {
  const { fps, words: normWords, lastWordEnd, durationInFrames } =
    normalizeTimeline(alignData, energyTrack, targetFps);
  const { act1Words, act2Words, act3Words, act4Words } = splitFourActs(normWords);

  const act2Start = act2Words[0]?.startFrame ?? durationInFrames;
  const act3Start = act3Words[0]?.startFrame ?? durationInFrames;
  const act4Start = act4Words[0]?.startFrame ?? durationInFrames;

  const cameraKeyframes = [];
  const graphics = [];
  const words = [];

  const firstStart = act1Words[0].startFrame;
  pushSilenceIntro(cameraKeyframes, firstStart);

  // Act 1: Connected panning word-map
  const act1End = Math.min(act2Start, act3Start, durationInFrames);
  if (act1Words.length > 0) {
    const spanEnd = act2Words.length > 0 ? act2Start : durationInFrames;
    graphics.push({
      kind: "ribbon",
      id: "hk-act1-diag",
      startFrame: firstStart,
      endFrame: spanEnd,
      x: 720,
      y: 510,
      width: 215,
      height: 2800,
      rotateDeg: 22,
      color: "#F21B14",
      halftone: true,
      fireTexture: true,
      wipeDirection: "ttb",
      zIndex: 5,
    });
  }

  const preReveal = scaleFrames(2, fps);
  const act1Overlap = scaleFrames(6, fps);
  let act1LastPos = { x: 480, y: 400 };

  if (act1Words.length >= 4) {
    const clauseWords = act1Words.slice(0, 3);
    const tailWords = act1Words.slice(3);
    const clausePos = { x: 560, y: 405 };
    const clausePacing = classifyPacing(
      clauseWords,
      tailWords[0].startFrame,
      energyTrack,
      fps
    );
    const clauseSpan = computeCoupledSpan(
      clauseWords[0].startFrame,
      tailWords[0].startFrame,
      durationInFrames,
      preReveal,
      act1Overlap
    );

    cameraKeyframes.push(
      {
        frame: clauseWords[0].startFrame,
        x: clausePos.x,
        y: clausePos.y,
        zoom: 1.0,
        rotateDeg: 0,
        easing: "hold",
      },
      {
        frame: clauseWords[clauseWords.length - 1].startFrame,
        x: clausePos.x + 24,
        y: clausePos.y - 6,
        zoom: 1.07,
        rotateDeg: -1.5,
        easing: "cubicOut",
      }
    );

    graphics.push({
      kind: "starburst",
      id: "hk-a1-clause-star",
      startFrame: clauseSpan.startFrame,
      endFrame: clauseSpan.endFrame,
      x: clausePos.x - 120,
      y: clausePos.y - 45,
      radius: 132,
      points: 14,
      innerRatio: 0.66,
      fill: "transparent",
      stroke: "#00F0FF",
      strokeWidth: 3,
      chromatic: true,
      spinDegPerSec: 26,
      zIndex: 8,
    });

    words.push({
      id: "hk-a1-clause-0",
      text: clauseWords.map((item) => item.text).join(" "),
      granularity: "word",
      wordTimings: buildWordTimingCues(clauseWords, "#FFE64D", preReveal),
      maxWidthPx: 760,
      startFrame: clauseSpan.startFrame,
      endFrame: clauseSpan.endFrame,
      x: clausePos.x,
      y: clausePos.y,
      fontSize: 72,
      fontRole: "serif",
      fontWeight: 700,
      variant: "solid",
      color: "#FFFFFF",
      entrance: "mask-glide",
      entranceDurationFrames: clausePacing.entranceDurationFrames,
      revealDir: "ltr",
      exitStyle: "mask-wipe-left",
      sweepReveal: { direction: "ltr", color: "#FFE64D", thicknessPx: 7 },
      kineticPush: {
        dx: -52,
        dy: -10,
        triggerFrame: Math.max(0, tailWords[0].startFrame - preReveal),
      },
      chromatic: 1.5,
      beatReactive: isNearBeat(energyTrack, clauseWords[0].startFrame, fps),
      zIndex: 24,
    });

    tailWords.forEach((w, idx) => {
      const preset = LAYOUT_PRESETS[idx % LAYOUT_PRESETS.length];
      const layout = computeLayoutCoordinates(preset, idx, 980, 410);
      const posX = layout.x;
      const posY = layout.y;
      act1LastPos = { x: posX, y: posY };
      const beatHit = isNearBeat(energyTrack, w.startFrame, fps);
      const nextOnset =
        idx + 1 < tailWords.length
          ? tailWords[idx + 1].startFrame
          : act2Words.length > 0
          ? act2Start
          : durationInFrames;
      const pacing = classifyPacing(w, nextOnset, energyTrack, fps);

      cameraKeyframes.push({
        frame: w.startFrame,
        x: posX,
        y: posY,
        zoom: idx % 2 === 0 ? 1.1 : 1.03,
        rotateDeg: layout.tilt,
        easing: "whipSnap",
      });

      const holdUntil =
        idx + 2 < tailWords.length
          ? tailWords[idx + 2].startFrame
          : act2Words.length > 0
          ? act2Start
          : durationInFrames;
      const { startFrame: wStart, endFrame: wEnd } = computeCoupledSpan(
        w.startFrame,
        holdUntil,
        durationInFrames,
        preReveal,
        act1Overlap
      );

      if (idx % 2 === 0) {
        graphics.push({
          kind: "starburst",
          id: `hk-a1-star-${idx}`,
          startFrame: wStart,
          endFrame: wEnd,
          x: posX,
          y: posY,
          radius: beatHit ? 148 : 122,
          points: 14,
          innerRatio: 0.66,
          fill: "transparent",
          stroke: "#F21B14",
          strokeWidth: 3.2,
          chromatic: true,
          spinDegPerSec: 28,
          zIndex: 8,
        });
      }

      words.push({
        id: `hk-a1-w-${idx}`,
        text: w.text.toUpperCase(),
        granularity: "char",
        startFrame: wStart,
        endFrame: wEnd,
        x: posX,
        y: posY,
        align: layout.align,
        fontSize: 102,
        fontRole: "display",
        useNarrowDisplay: true,
        variant: "solid",
        color: "#FFFFFF",
        entrance: "char-wave",
        entranceDurationFrames: pacing.entranceDurationFrames,
        exitStyle: idx % 2 === 0 ? "char-peel" : "mask-wipe-up",
        rotateDeg: layout.tilt,
        chromatic: true,
        beatReactive: beatHit,
        zIndex: 24,
      });
    });
  } else {
    act1Words.forEach((w, idx) => {
      const preset = LAYOUT_PRESETS[idx % LAYOUT_PRESETS.length];
      const layout = computeLayoutCoordinates(preset, idx, 480, 405);
      const posX = layout.x;
      const posY = layout.y;
      act1LastPos = { x: posX, y: posY };
      const zoom = idx % 3 === 1 ? 1.1 : 1.02;
      cameraKeyframes.push({
        frame: w.startFrame,
        x: posX,
        y: posY,
        zoom,
        rotateDeg: idx === 0 ? 0 : layout.tilt,
        easing: idx === 0 ? "hold" : "whipSnap",
      });

      const beatHit = isNearBeat(energyTrack, w.startFrame, fps);
      const nextOnset =
        idx + 1 < act1Words.length
          ? act1Words[idx + 1].startFrame
          : act2Words.length > 0
          ? act2Start
          : durationInFrames;
      const pacing = classifyPacing(w, nextOnset, energyTrack, fps);
      const holdUntil =
        idx + 2 < act1Words.length
          ? act1Words[idx + 2].startFrame
          : act2Words.length > 0
          ? act2Start
          : durationInFrames;
      const { startFrame: wStart, endFrame: wEnd } = computeCoupledSpan(
        w.startFrame,
        holdUntil,
        durationInFrames,
        preReveal,
        act1Overlap
      );

      words.push({
        id: `hk-a1-w-${idx}`,
        text: w.text.toUpperCase(),
        granularity: "char",
        startFrame: wStart,
        endFrame: wEnd,
        x: posX,
        y: posY,
        align: idx === 0 ? "center" : layout.align,
        fontSize: 96,
        fontRole: "display",
        useNarrowDisplay: true,
        variant: "solid",
        color: "#FFFFFF",
        entrance: "char-wave",
        entranceDurationFrames: pacing.entranceDurationFrames,
        exitStyle: ACT1_EXIT_STYLES[idx % ACT1_EXIT_STYLES.length],
        chromatic: true,
        beatReactive: beatHit,
        zIndex: 24,
      });
    });
  }

  if (act2Words.length > 0 && act1End > act1Words[act1Words.length - 1].startFrame) {
    cameraKeyframes.push({
      frame: act1End - 1,
      x: act1LastPos.x,
      y: act1LastPos.y,
      zoom: 1.0,
      rotateDeg: 0,
      easing: "linear",
    });
  }

  // Act 2: Rapid-fire solo beat hits centered at (2400, 450)
  if (act2Words.length > 0) {
    const act2End = act3Words.length > 0 ? act3Start : durationInFrames;
    pushActTransition(
      graphics,
      "hk-tr-a1-a2",
      act2Start,
      fps,
      "curtain-wipe",
      "ltr",
      "#F21B14",
      "#00F0FF",
      durationInFrames
    );
    cameraKeyframes.push(
      { frame: act2Start, x: 2400, y: 450, zoom: 1.06, rotateDeg: 0, easing: "hold" },
      { frame: act2End - 1, x: 2400, y: 450, zoom: 1.06, rotateDeg: 0, easing: "hold" }
    );

    const act2Overlap = capSameSpotOverlap(scaleFrames(8, fps), fps);
    act2Words.forEach((w, idx) => {
      const baseEnd =
        idx + 1 < act2Words.length ? act2Words[idx + 1].startFrame : act2End;
      const pacing = classifyPacing(w, baseEnd, energyTrack, fps);
      const coupledSpan = computeCoupledSpan(
        w.startFrame,
        baseEnd,
        durationInFrames,
        preReveal,
        act2Overlap
      );
      const wStart = coupledSpan.startFrame;
      // Never stay visible once the word after next starts: keeps stacks at 2 deep.
      const wEnd = Math.max(
        wStart + 1,
        Math.min(
          coupledSpan.endFrame,
          idx + 2 < act2Words.length
            ? Math.max(0, act2Words[idx + 2].startFrame - preReveal)
            : coupledSpan.endFrame
        )
      );
      const angle = SOLO_RIBBON_ANGLES[idx % SOLO_RIBBON_ANGLES.length];
      const useWhiteSlash = idx % 2 === 1;
      const useFireWord = idx % 3 === 1;

      graphics.push({
        kind: "ribbon",
        id: `hk-a2-rib-${idx}`,
        startFrame: wStart,
        endFrame: wEnd,
        x: 2400,
        y: 450,
        width: useWhiteSlash ? 210 : 145,
        height: 2800,
        rotateDeg: angle,
        color: useWhiteSlash ? "#FFFFFF" : "#F21B14",
        halftone: !useWhiteSlash,
        fireTexture: !useWhiteSlash,
        wipeDirection: idx % 2 === 0 ? "ttb" : "ltr",
        zIndex: 7,
      });

      if (idx % 2 === 0) {
        graphics.push({
          kind: "starburst",
          id: `hk-a2-star-${idx}`,
          startFrame: wStart,
          endFrame: wEnd,
          x: 2360,
          y: 410,
          radius: 155,
          points: 14,
          innerRatio: 0.64,
          fill: "transparent",
          stroke: "#00F0FF",
          strokeWidth: 3,
          chromatic: true,
          spinDegPerSec: 32,
          zIndex: 8,
        });
      }

      words.push({
        id: `hk-a2-w-${idx}`,
        text: idx % 2 === 0 ? w.text.toUpperCase() : w.text,
        granularity: "char",
        startFrame: wStart,
        endFrame: wEnd,
        x: 2400,
        y: 450,
        fontSize: useFireWord ? 185 : 155,
        scaleY: 1.38,
        fontRole: "display",
        useNarrowDisplay: true,
        variant: useFireWord ? "fire-masked" : "solid",
        color: useWhiteSlash && !useFireWord ? "#080808" : "#FFFFFF",
        rotateDeg: idx % 3 === 0 ? -8 : 6,
        chromatic: !useFireWord,
        entrance: "char-wave",
        entranceDurationFrames: pacing.entranceDurationFrames,
        exitStyle: ACT2_EXIT_STYLES[idx % ACT2_EXIT_STYLES.length],
        beatReactive: true,
        zIndex: 25,
      });
    });
  }

  // Act 3: Dual-layer giant serif BG + sweeping condensed FG
  if (act3Words.length > 0) {
    const act3End = act4Words.length > 0 ? act4Start : durationInFrames;
    pushActTransition(
      graphics,
      "hk-tr-a2-a3",
      act3Start,
      fps,
      "inverted-flash",
      undefined,
      "#FFFFFF",
      "#00F0FF",
      durationInFrames
    );
    cameraKeyframes.push(
      { frame: act3Start, x: 3600, y: 450, zoom: 1.02, rotateDeg: 0, easing: "hold" },
      { frame: act3End - 1, x: 3600, y: 450, zoom: 1.02, rotateDeg: 0, easing: "hold" }
    );

    graphics.push(
      {
        kind: "ribbon",
        id: "hk-a3-stripe",
        startFrame: act3Start,
        endFrame: act3End,
        x: 3570,
        y: 450,
        width: 88,
        height: 2800,
        rotateDeg: -10,
        color: "#F21B14",
        halftone: true,
        wipeDirection: "ttb",
        zIndex: 8,
      },
      {
        kind: "radialRays",
        id: "hk-a3-rays",
        startFrame: act3Start,
        endFrame: act3End,
        x: 3600,
        y: 520,
        radius: 235,
        rayCount: 14,
        color: "#00F0FF",
        spinDegPerSec: 18,
        zIndex: 7,
      }
    );

    const act3Overlap = capSameSpotOverlap(scaleFrames(5, fps), fps);
    const act3Phrases = groupPhrases(act3Words, act3End, fps, 3);
    act3Phrases.forEach((phrase, idx) => {
      const pacing = classifyPacing(phrase.words, phrase.endFrame, energyTrack, fps);
      const { startFrame: wStart, endFrame: wEnd } = computeCoupledSpan(
        phrase.startFrame,
        phrase.endFrame,
        durationInFrames,
        preReveal,
        act3Overlap
      );
      const leadBgWord = phrase.words[0]?.text ?? phrase.text;

      words.push(
        {
          id: `hk-a3-bg-${idx}`,
          text: leadBgWord.toUpperCase(),
          granularity: "char",
          startFrame: wStart,
          endFrame: wEnd,
          x: 3600,
          y: 430,
          fontSize: 215,
          fontRole: "serif",
          variant: "solid",
          color: "#F21B14",
          entrance: "char-wave",
          entranceDurationFrames: pacing.entranceDurationFrames,
          exitStyle: idx % 2 === 0 ? "mask-wipe-up" : "split-close",
          zIndex: 6,
        },
        {
          id: `hk-a3-fg-${idx}`,
          text: formatSentenceLines(phrase.text),
          granularity: "sentence",
          maxWidthPx: 780,
          startFrame: wStart,
          endFrame: wEnd,
          x: 3600,
          y: 485,
          fontSize: 82,
          fontRole: "display",
          useNarrowDisplay: true,
          variant: "solid",
          color: "#FFFFFF",
          rotateDeg: idx % 2 === 0 ? -5 : 4,
          chromatic: true,
          entrance: "mask-glide",
          entranceDurationFrames: pacing.entranceDurationFrames,
          revealDir: idx % 2 === 0 ? "btt" : "center",
          exitStyle: idx % 2 === 0 ? "split-close" : "mask-wipe-up",
          sweepReveal: {
            direction: idx % 2 === 0 ? "ltr" : "btt",
            color: "#00F0FF",
            thicknessPx: 5,
          },
          sweepExit: { direction: "ltr", color: "#00F0FF", thicknessPx: 5 },
          beatReactive: true,
          zIndex: 25,
        }
      );
    });
  }

  // Act 4: Breather + Panoramic Collage Chorus
  if (act4Words.length > 0) {
    const hasBreather = act4Words.length >= 3;
    const chorusStartWord = hasBreather ? act4Words[1] : act4Words[0];
    const chorusStart = chorusStartWord.startFrame;
    pushActTransition(
      graphics,
      "hk-tr-a3-a4",
      act4Start,
      fps,
      "split-shutter",
      "ttb",
      "#080808",
      "#F21B14",
      durationInFrames
    );

    if (hasBreather) {
      const lead = act4Words[0];
      const breatherPacing = classifyPacing(lead, chorusStart, energyTrack, fps);
      cameraKeyframes.push(
        { frame: act4Start, x: 600, y: 450, zoom: 1.55, rotateDeg: 0, easing: "hold" },
        {
          frame: Math.max(act4Start + 1, chorusStart - 1),
          x: 600,
          y: 450,
          zoom: 0.9,
          rotateDeg: 0,
          easing: "cubicOut",
        }
      );
      words.push({
        id: "hk-a4-breather",
        text: lead.text.toUpperCase(),
        startFrame: Math.max(0, lead.startFrame - preReveal),
        endFrame: Math.min(durationInFrames, chorusStart + scaleFrames(4, fps)),
        x: 600,
        y: 455,
        fontSize: 320,
        scaleY: 1.38,
        fontRole: "display",
        useNarrowDisplay: true,
        variant: "hollow-outline",
        strokeColor: "#F21B14",
        strokeWidth: 3.5,
        chromatic: 2,
        entrance: "mask-glide",
        entranceDurationFrames: breatherPacing.entranceDurationFrames,
        revealDir: "center",
        exitStyle: "split-close",
        beatReactive: true,
        zIndex: 25,
      });
    }

    cameraKeyframes.push(
      { frame: chorusStart, x: 580, y: 455, zoom: 1.02, rotateDeg: 0, easing: "hold" },
      { frame: durationInFrames, x: 1180, y: 455, zoom: 0.92, rotateDeg: 0, easing: "linear" }
    );

    graphics.push(
      {
        kind: "mediaCard",
        id: "hk-a4-card-main",
        startFrame: chorusStart,
        endFrame: durationInFrames,
        x: 200,
        y: 545,
        width: 220,
        height: 145,
        rotateDeg: -14,
        variant: "hk-ticket",
        label: "3",
        parallaxFactor: -0.04,
        zIndex: 9,
      },
      {
        kind: "mediaCard",
        id: "hk-a4-card-sec",
        startFrame: chorusStart,
        endFrame: durationInFrames,
        x: 1380,
        y: 230,
        width: 310,
        height: 210,
        rotateDeg: -16,
        variant: "hk-neon-sign",
        label: title.toUpperCase(),
        parallaxFactor: 0.06,
        zIndex: 8,
      },
      {
        kind: "zigzag",
        id: "hk-a4-zigzag",
        startFrame: chorusStart,
        endFrame: durationInFrames,
        points: [
          [120, 560],
          [320, 520],
          [520, 480],
          [760, 440],
          [1020, 495],
          [1320, 435],
          [1640, 480],
        ],
        stroke: "#F21B14",
        strokeWidth: 4.5,
        chromatic: true,
        drawDurationFrames: scaleFrames(24, fps),
        zIndex: 11,
      },
      {
        kind: "ribbon",
        id: "hk-a4-pivoting-ribbon",
        startFrame: chorusStart,
        endFrame: durationInFrames,
        x: 760,
        y: 450,
        endX: 330,
        endY: 540,
        width: 165,
        height: 2800,
        rotateDeg: 20,
        endRotateDeg: -38,
        color: "#F21B14",
        halftone: true,
        fireTexture: true,
        wipeDirection: "ttb",
        screenFixed: true,
        zIndex: 6,
      },
      {
        kind: "progressBar",
        id: "hk-a4-glow-bar",
        startFrame: chorusStart,
        endFrame: Math.min(durationInFrames, lastWordEnd + Math.round(fps * 0.5)),
        x: 560,
        y: 472,
        width: 300,
        height: 15,
        startColor: "#8BFF2E",
        endColor: "#FFE64D",
        glowColor: "#7CFF2E",
        screenFixed: true,
        zIndex: 15,
      }
    );

    words.push({
      id: "hk-a4-title-tag",
      text: title,
      startFrame: chorusStart,
      endFrame: durationInFrames,
      x: 280,
      y: 200,
      fontSize: 66,
      fontRole: "serif",
      fontWeight: 700,
      variant: "solid",
      color: "#F21B14",
      chromatic: 1.5,
      entrance: "tracking-expand",
      zIndex: 18,
    });

    const chorusFeed = hasBreather ? act4Words.slice(1) : act4Words;
    const phrases = groupPhrases(chorusFeed, lastWordEnd, fps, 3);
    const chorusOverlap = capSameSpotOverlap(scaleFrames(5, fps), fps);
    phrases.forEach((phrase, idx) => {
      const pacing = classifyPacing(phrase.words, phrase.endFrame, energyTrack, fps);
      const { startFrame: pStart, endFrame: pEnd } = computeCoupledSpan(
        phrase.startFrame,
        phrase.endFrame,
        durationInFrames,
        preReveal,
        idx === phrases.length - 1 ? 0 : chorusOverlap,
        chorusStart
      );
      const isWordMode = idx % 2 === 0;
      words.push({
        id: `hk-a4-phrase-${idx}`,
        text: isWordMode ? phrase.text : formatSentenceLines(phrase.text),
        granularity: isWordMode ? "word" : "sentence",
        ...(isWordMode
          ? { wordTimings: buildWordTimingCues(phrase.words, "#FFE64D", preReveal) }
          : {}),
        maxWidthPx: 820,
        startFrame: pStart,
        endFrame: pEnd,
        x: 600,
        y: 535,
        fontSize: 62,
        fontRole: "serif",
        fontWeight: 700,
        variant: "solid",
        color: "#FFFFFF",
        chromatic: 1.8,
        entrance: "mask-glide",
        entranceDurationFrames: pacing.entranceDurationFrames,
        revealDir: isWordMode ? "ltr" : "btt",
        deepGlow: true,
        exitStyle:
          idx === phrases.length - 1
            ? "split-close"
            : isWordMode
            ? "char-peel"
            : "mask-wipe-up",
        exitFadeFrames:
          idx === phrases.length - 1 ? scaleFrames(8, fps) : undefined,
        beatReactive: true,
        screenFixed: true,
        zIndex: 35,
      });
    });
  }

  return {
    id: slug,
    title,
    stylePackId: "hk-1999-halftone",
    fps,
    durationInFrames,
    ...(audioSrc ? { audioSrc } : {}),
    cameraKeyframes,
    graphics,
    words,
  };
}

/* ------------------------------------------------------------------------- */
/* Style #3 (Dreamy Glow Dark) - scene based typographic compositions         */
/* ------------------------------------------------------------------------- */

const DREAMY_COLOR = {
  white: "#FFFFFF",
  yellow: "#FFF066",
  purple: "#9B5CFF",
  pink: "#FF5C8A",
  dim: "#B9AEC9",
  echo: "rgba(176, 140, 255, 0.55)",
};

const DREAMY_ENTRANCES = [
  ["mask-glide", "ltr"],
  ["slam", undefined],
  ["char-wave", undefined],
  ["baseline-mask", "btt"],
  ["spring-pop", undefined],
  ["mask-glide", "rtl"],
  ["slide-up", undefined],
  ["tracking-expand", undefined],
];

const DREAMY_ENTRY_ZOOM = [1.22, 0.86, 1.14, 1.3, 0.9];
const DREAMY_ENTRY_ROT = [0, 5, -4, 0, 3, -6];
const DREAMY_DRIFT = [
  { dx: 36, dy: -14 },
  { dx: -30, dy: 18 },
  { dx: 20, dy: 26 },
  { dx: -40, dy: -10 },
];

const DREAMY_CELL_W = 1500;
const DREAMY_CELL_H = 1100;
const DREAMY_COLS = 4;

/** Width cap based font size: giant condensed caps that may deliberately kiss the frame edge. */
function dreamyGiantFs(text, maxWidth, cap) {
  return Math.min(cap, maxWidth / (Math.max(1, text.length) * 0.5));
}

function dreamyLongestIdx(texts) {
  let best = 0;
  texts.forEach((t, i) => {
    if (t.length >= texts[best].length) best = i;
  });
  return best;
}

/** Longest phrase kept as one scene; longer lyric lines are split near the middle. */
const DREAMY_MAX_SCENE_WORDS = 8;

/**
 * Group aligned words into scenes that follow the sung phrases.
 * Line ends come from `phraseEnd` marks in the align file when present. Without marks they are
 * guessed: a word held clearly longer than the words before it, or followed by real silence,
 * closes a line. Lines longer than DREAMY_MAX_SCENE_WORDS are split where the singer
 * leaves the widest onset gap near the middle, and lone trailing words rejoin their line.
 */
function dreamyGroupScenes(words, fps) {
  const hasMarks = words.some((w) => w.phraseEnd);
  const median = (xs) => {
    const sorted = [...xs].sort((a, b) => a - b);
    return sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];
  };

  let phrases = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    let closes = !next;
    if (next) {
      if (hasMarks) {
        closes = Boolean(w.phraseEnd);
      } else {
        const recent = words.slice(Math.max(0, i - 4), i).map((x) => x.sungSec ?? 0);
        const heldLong =
          (w.sungSec ?? 0) >= 0.4 && (w.sungSec ?? 0) >= 1.35 * median(recent);
        const silence = next.startFrame - (w.startFrame + (w.sungSec ?? 0) * fps);
        closes = heldLong || silence >= 0.3 * fps;
      }
    }
    if (closes) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length > 0) phrases.push(cur);

  if (!hasMarks) {
    // A lone word rejoins the previous line unless it sits alone after a real pause.
    const merged = [];
    for (const ph of phrases) {
      const prev = merged[merged.length - 1];
      const gap = prev ? ph[0].startFrame - prev[prev.length - 1].startFrame : Infinity;
      if (ph.length === 1 && prev && prev.length < DREAMY_MAX_SCENE_WORDS && gap < 1.0 * fps) {
        prev.push(ph[0]);
      } else {
        merged.push([...ph]);
      }
    }
    phrases = merged;
  }

  const scenes = [];
  const split = (ph) => {
    if (ph.length <= DREAMY_MAX_SCENE_WORDS) {
      scenes.push(ph);
      return;
    }
    const mid = Math.round(ph.length / 2);
    let bestK = mid;
    let bestGap = -1;
    for (let k = mid - 1; k <= mid + 1; k++) {
      const gap = ph[k].startFrame - ph[k - 1].startFrame;
      if (gap > bestGap) {
        bestGap = gap;
        bestK = k;
      }
    }
    split(ph.slice(0, bestK));
    split(ph.slice(bestK));
  };
  phrases.forEach(split);
  return scenes;
}

function dreamyMeanInterval(ws) {
  if (ws.length < 2) return 0;
  return (ws[ws.length - 1].startFrame - ws[0].startFrame) / (ws.length - 1);
}

/** Template 1: 1-4 enormous stacked lines, interlocking and cropped by the frame. */
function dreamyLayoutGiantStack(ws, si, pal = DREAMY_COLOR) {
  const texts = ws.map((w) => w.text.toUpperCase());
  let fs = texts.map((t) => dreamyGiantFs(t, 1080, 430));
  const total = fs.reduce((a, f) => a + f * 1.0, 0);
  const k = total > 780 ? 780 / total : 1;
  fs = fs.map((f) => f * k);
  const hero = dreamyLongestIdx(texts);
  let y = -(total * k) / 2;
  const items = texts.map((text, i) => {
    const h = fs[i] * 1.0;
    const cy = y + h / 2;
    y += h;
    return {
      text,
      x: (i % 2 === 0 ? -1 : 1) * 55,
      y: cy,
      fs: fs[i],
      rot: [-3, 2, -2, 3][(i + si) % 4],
      color:
        i === hero
          ? pal.yellow
          : i % 2 === 0
          ? pal.white
          : si % 2 === 0
          ? pal.pink
          : pal.purple,
      z: 14 + i,
      gran: "char",
      glow: i === hero,
      push: i < texts.length - 1,
    };
  });
  return { items, decor: [] };
}

/** Template 2: one giant hero word with small satellite words, ring or starburst behind. */
function dreamyLayoutHeroSat(ws, si, pal = DREAMY_COLOR) {
  const upper = ws.map((w) => w.text.toUpperCase());
  const hero = dreamyLongestIdx(upper);
  const heroFs = dreamyGiantFs(upper[hero], 900, 400);
  const heroX = si % 2 === 0 ? -70 : 70;
  const heroY = -30;
  // Words sung before the hero sit in a row above it, words sung after it in a row below,
  // each row read left to right, so the lyric still reads in order.
  const rowSlots = (count, y) => {
    const xs =
      count === 1
        ? [si % 2 === 0 ? -320 : 320]
        : count === 2
        ? [-340, 340]
        : count === 3
        ? [-420, 0, 420]
        : [-480, -160, 160, 480];
    return xs.slice(0, count).map((x, k) => ({
      x,
      y: y + (k % 2 === 0 ? -16 : 16),
      rot: k % 2 === 0 ? -7 : 6,
    }));
  };
  const topSlots = rowSlots(hero, -335);
  const botSlots = rowSlots(ws.length - 1 - hero, 340);
  const sats = [pal.white, pal.dim, pal.pink, pal.white];
  const items = ws.map((w, i) => {
    if (i === hero) {
      return {
        text: upper[i],
        x: heroX,
        y: heroY,
        fs: heroFs,
        rot: si % 2 === 0 ? -4 : 4,
        color: si % 3 === 0 ? pal.yellow : si % 3 === 1 ? pal.purple : pal.white,
        z: 25,
        gran: "char",
        glow: true,
      };
    }
    const slot = i < hero ? topSlots[i] : botSlots[i - hero - 1];
    return {
      text: w.text,
      x: slot.x,
      y: slot.y,
      fs: 78 + ((i * 17) % 30),
      rot: slot.rot,
      color: sats[i % sats.length],
      z: 25,
      role: "body",
      weight: 700,
      gran: "word",
    };
  });
  const cx = heroX;
  const cy = heroY;
  const decor =
    si % 2 === 0
      ? [
          {
            kind: "orbitRing",
            x: cx,
            y: cy,
            radius: Math.min(430, heroFs * 1.05),
            stroke: pal.yellow,
            strokeWidth: 3,
            dashArray: "5 12",
            spinDegPerSec: 10,
            glow: true,
            zIndex: 8,
          },
        ]
      : [
          {
            kind: "starburst",
            x: cx,
            y: cy,
            radius: 340,
            points: 14,
            innerRatio: 0.7,
            fill: "transparent",
            stroke: si % 3 === 1 ? pal.yellow : pal.purple,
            strokeWidth: 4,
            spinDegPerSec: -14,
            zIndex: 6,
          },
        ];
  return { items, decor };
}

/** Template 3: diagonal staircase of shrinking tilted words, one hollow outline. */
function dreamyLayoutCascade(ws, si, pal = DREAMY_COLOR) {
  const n = ws.length;
  const texts = ws.map((w) => w.text.toUpperCase());
  const base = n <= 3 ? 250 : 215;
  let fs = texts.map((t, i) =>
    Math.min(dreamyGiantFs(t, 760, base * Math.pow(0.84, i)), base * Math.pow(0.84, i))
  );
  const total = fs.reduce((a, f) => a + f * 1.0, 0);
  const k = total > 780 ? 780 / total : 1;
  fs = fs.map((f) => f * k);
  let y = -(total * k) / 2;
  const palette = [pal.white, pal.yellow, pal.purple, pal.pink, pal.white];
  const hollowIdx = si % 2 === 0 ? 0 : Math.min(2, n - 1);
  const items = texts.map((text, i) => {
    const h = fs[i] * 1.0;
    const cy = y + h / 2;
    y += h;
    const t = n > 1 ? i / (n - 1) : 0.5;
    const hollow = i === hollowIdx;
    return {
      text,
      x: -240 + t * 480,
      y: cy,
      fs: fs[i],
      rot: si % 2 === 0 ? -9 : 8,
      color: palette[(i + si) % palette.length],
      z: 14 + i,
      gran: i % 2 === 0 ? "char" : "word",
      hollow,
      push: i < n - 1,
    };
  });
  return { items, decor: [] };
}

/** Template 4: one giant rotated word against the edge, horizontal lines on the other side. */
function dreamyLayoutColumn(ws, si, pal = DREAMY_COLOR) {
  const upper = ws.map((w) => w.text.toUpperCase());
  const hero = dreamyLongestIdx(upper);
  const heroFs = Math.min(340, 840 / (upper[hero].length * 0.5));
  // Rotated hero sits on the side where it falls in reading order (early words left, late right).
  const dir = hero * 2 <= upper.length - 1 ? -1 : 1;
  const rest = upper.map((t, i) => ({ t, i })).filter((o) => o.i !== hero);
  const restFs = rest.map((o, j) => {
    const cap = Math.max(110, 210 - j * 45);
    return Math.min(dreamyGiantFs(o.t, 560, cap), cap);
  });
  const restTotal = restFs.reduce((a, f) => a + f * 1.0, 0);
  let y = -restTotal / 2;
  const items = [];
  items[hero] = {
    text: upper[hero],
    x: dir * 300,
    y: 0,
    fs: heroFs,
    // Tops of the letters point toward the centre so accents never run off the frame edge.
    rot: -dir * 90,
    color: pal.purple,
    z: 1,
    gran: "char",
    glow: true,
  };
  rest.forEach((o, j) => {
    const h = restFs[j] * 1.0;
    items[o.i] = {
      text: o.t,
      x: -dir * 150,
      y: y + h / 2,
      fs: restFs[j],
      rot: j % 2 === 0 ? -2 : 2,
      color: j === 0 ? pal.yellow : pal.white,
      z: 14 + j,
      gran: j === 0 ? "char" : "word",
    };
    y += h;
  });
  return { items, decor: [] };
}

/** Template 5: 5-6 line wall with a giant translucent echo of the hero word behind it. */
function dreamyLayoutWall(ws, si, pal = DREAMY_COLOR) {
  const n = ws.length;
  const texts = ws.map((w) => w.text.toUpperCase());
  let fs = texts.map((t, i) => Math.min(dreamyGiantFs(t, 900, 250 - (i % 3) * 38), 250 - (i % 3) * 38));
  const total = fs.reduce((a, f) => a + f * 1.0, 0);
  const k = total > 780 ? 780 / total : 1;
  fs = fs.map((f) => f * k);
  const hero = dreamyLongestIdx(texts);
  let y = -(total * k) / 2;
  const palette = [pal.white, pal.purple, pal.yellow, pal.pink];
  const items = texts.map((text, i) => {
    const h = fs[i] * 1.0;
    const cy = y + h / 2;
    y += h;
    return {
      text,
      x: ((i * 3) % 5 - 2) * 62,
      y: cy,
      fs: fs[i],
      rot: [0, -3, 2, -2, 3][(i + si) % 5],
      color: i === hero ? pal.yellow : palette[(i + si) % palette.length],
      z: 14 + i,
      gran: i % 2 === 0 ? "char" : "word",
      push: i < n - 1,
    };
  });
  items.push({
    text: texts[hero],
    x: 0,
    y: 20,
    fs: dreamyGiantFs(texts[hero], 1300, 560),
    rot: -6,
    color: pal.echo,
    z: 1,
    gran: "word",
    hollow: true,
    echo: true,
    echoOf: hero,
  });
  return { items, decor: [] };
}

/** Template 6: quiet small line for a breath between loud scenes. */
function dreamyLayoutBreather(ws, si, pal = DREAMY_COLOR) {
  return {
    items: [
      {
        text: ws.map((w) => w.text).join(" "),
        x: 0,
        y: 0,
        fs: 50,
        rot: 0,
        color: pal.dim,
        z: 25,
        role: "body",
        weight: 500,
        gran: "sentence",
        sentence: true,
      },
    ],
    decor: [],
  };
}

function dreamyPickTemplates(scenes) {
  let breatherIdx = -1;
  let bestInterval = 0;
  scenes.forEach((ws, i) => {
    if (i === 0 || i === scenes.length - 1) return;
    if (ws.length < 2 || ws.length > 6) return;
    const mean = dreamyMeanInterval(ws);
    if (mean > bestInterval) {
      bestInterval = mean;
      breatherIdx = i;
    }
  });
  const minBreather = 0.38 * 24; // frames at 24fps scale; compared after fps scaling below
  const kinds = [];
  let prev = "";
  scenes.forEach((ws, i) => {
    const n = ws.length;
    let pool;
    if (i === breatherIdx && bestInterval >= minBreather * 0.9) {
      kinds.push("breather");
      prev = "breather";
      return;
    }
    if (i === scenes.length - 1) pool = n >= 4 ? ["wall"] : ["giant"];
    else if (n === 1) pool = ["giant"];
    else if (n === 2) pool = ["giant", "column", "hero"];
    else if (n === 3) pool = ["giant", "hero", "cascade", "column"];
    else if (n >= 7) pool = ["wall"];
    else pool = ["hero", "cascade", "wall", "column"];
    const rotated = pool.map((_, k) => pool[(k + Math.floor(dreamyHash(i * 7 + 3) * pool.length)) % pool.length]);
    const pick = rotated.find((p) => p !== prev) ?? rotated[0];
    kinds.push(pick);
    prev = pick;
  });
  return kinds;
}

/** Deterministic 0..1 hash used for layout randomness (same input, same result). */
function dreamyHash(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Per-item random scatter so no two scenes (or two words) are laid out alike. */
function jitterLayout(layout, si, j) {
  layout.items.forEach((it, k) => {
    if (it.echo || it.sentence) return;
    const r1 = dreamyHash(si * 101 + k * 17 + 1);
    const r2 = dreamyHash(si * 101 + k * 17 + 2);
    const r3 = dreamyHash(si * 101 + k * 17 + 3);
    const r4 = dreamyHash(si * 101 + k * 17 + 4);
    it.x = Math.round(it.x + (r1 - 0.5) * j.pos);
    it.y = Math.round(it.y + (r2 - 0.5) * j.pos * 0.7);
    it.rot = Math.round(((it.rot ?? 0) + (r3 - 0.5) * j.rot) * 10) / 10;
    it.fs = Math.round(it.fs * (1 + (r4 - 0.5) * j.size));
  });
  return layout;
}

/** Estimated rotated bounding box of one layout item, centred on its position. */
function dreamyItemBox(it) {
  const chars = Math.max(1, String(it.text).length);
  const w = chars * it.fs * (it.role === "body" ? 0.56 : 0.5);
  const h = it.fs * 0.95;
  const r = ((it.rot ?? 0) * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const sn = Math.abs(Math.sin(r));
  return { hw: (w * c + h * sn) / 2, hh: (w * sn + h * c) / 2 };
}

/**
 * Push overlapping readable words apart (random scatter and tight templates both create
 * collisions). Boxes are slightly inflated so the lint's wider estimate also stays clear.
 */
function separateLayout(layout) {
  const solid = layout.items.filter((it) => !it.echo);
  const box = (it) => {
    const b = dreamyItemBox(it);
    return { hw: b.hw * 1.12, hh: b.hh * 1.06 };
  };
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let i = 0; i < solid.length; i++) {
      for (let j = i + 1; j < solid.length; j++) {
        const a = solid[i];
        const b = solid[j];
        const ba = box(a);
        const bb = box(b);
        const ox = ba.hw + bb.hw - Math.abs(a.x - b.x);
        const oy = ba.hh + bb.hh - Math.abs(a.y - b.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (oy <= ox) {
          const push = (oy / 2 + 2) * (a.y <= b.y ? 1 : -1);
          a.y -= push;
          b.y += push;
        } else {
          const push = (ox / 2 + 2) * (a.x <= b.x ? 1 : -1);
          a.x -= push;
          b.x += push;
        }
      }
    }
    if (!moved) break;
  }
  for (const it of solid) {
    it.x = Math.round(it.x);
    it.y = Math.round(it.y);
  }
  return layout;
}

/**
 * Keep every readable word inside the visible frame for the whole scene: the camera sways, so
 * text must stay clear of the edges even at its extremes. Scales the layout down uniformly when
 * it is too big (ghost echo words are background and may overflow), then nudges it back in.
 */
function fitLayout(layout, halfW, halfH) {
  const solid = layout.items.filter((it) => !it.echo);
  if (solid.length === 0) return layout;
  const bounds = () => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const it of solid) {
      const b = dreamyItemBox(it);
      minX = Math.min(minX, it.x - b.hw);
      maxX = Math.max(maxX, it.x + b.hw);
      minY = Math.min(minY, it.y - b.hh);
      maxY = Math.max(maxY, it.y + b.hh);
    }
    return { minX, maxX, minY, maxY };
  };
  let b = bounds();
  const k = Math.min(1, (2 * halfW) / (b.maxX - b.minX), (2 * halfH) / (b.maxY - b.minY));
  if (k < 1) {
    for (const it of solid) {
      it.fs = Math.round(it.fs * k);
      it.x = Math.round(it.x * k);
      it.y = Math.round(it.y * k);
    }
    b = bounds();
  }
  let dx = 0;
  let dy = 0;
  if (b.minX < -halfW) dx = -halfW - b.minX;
  else if (b.maxX > halfW) dx = halfW - b.maxX;
  if (b.minY < -halfH) dy = -halfH - b.minY;
  else if (b.maxY > halfH) dy = halfH - b.maxY;
  if (dx !== 0 || dy !== 0) {
    for (const it of solid) {
      it.x = Math.round(it.x + dx);
      it.y = Math.round(it.y + dy);
    }
  }
  return layout;
}

function dreamyBuildLayout(kind, ws, si, pal) {
  switch (kind) {
    case "giant":
      return dreamyLayoutGiantStack(ws, si, pal);
    case "hero":
      return dreamyLayoutHeroSat(ws, si, pal);
    case "cascade":
      return dreamyLayoutCascade(ws, si, pal);
    case "column":
      return dreamyLayoutColumn(ws, si, pal);
    case "wall":
      return dreamyLayoutWall(ws, si, pal);
    default:
      return dreamyLayoutBreather(ws, si, pal);
  }
}

/** Scene based typographic storyboard shared by the dreamy and pop-collage style packs. */
function buildSceneStoryboard({ alignData, energyTrack, targetFps, title, slug, audioSrc, theme }) {
  const { fps, words: normWords, lastWordEnd, durationInFrames } =
    normalizeTimeline(alignData, energyTrack, targetFps);

  // Words must land on the sung onset, so they start ~120ms early and snap in within ~4 frames.
  const preReveal = Math.max(2, Math.round(0.12 * fps));
  const maxEntranceFrames = Math.max(3, Math.round(0.14 * fps));
  const whipFrames = scaleFrames(6, fps);
  const whipGap = scaleFrames(14, fps);

  const sceneWords = dreamyGroupScenes(normWords, fps);
  const kinds = dreamyPickTemplates(
    sceneWords.map((ws) => ws.map((w) => ({ ...w, startFrame: (w.startFrame * 24) / fps })))
  );

  // Scene geometry: serpentine grid of world cells so every cut or whip travels somewhere new.
  const scenes = sceneWords.map((ws, i) => {
    const cell = theme.cell ?? { w: DREAMY_CELL_W, h: DREAMY_CELL_H };
    const row = Math.floor(i / DREAMY_COLS);
    const colRaw = i % DREAMY_COLS;
    const col = row % 2 === 0 ? colRaw : DREAMY_COLS - 1 - colRaw;
    const prevScene = i > 0 ? sceneWords[i - 1] : null;
    const start = Math.max(0, ws[0].startFrame - preReveal);
    const whip =
      i > 0 && ws[0].startFrame - prevScene[prevScene.length - 1].startFrame >= whipGap;
    const dark = theme.isDark(i, sceneWords.length);
    const pal = theme.palette(dark);
    const CONT_OFFSETS = [[0, 0], [150, -80], [-120, 70], [140, 90], [-150, -70], [90, -100], [-80, 100], [130, 60]];
    const off = theme.continuous ? CONT_OFFSETS[i % CONT_OFFSETS.length] : null;
    return {
      words: ws,
      kind: kinds[i],
      cx: off ? 600 + Math.round(off[0] * 0.7) : 600 + col * cell.w,
      cy: off ? 450 + Math.round(off[1] * 0.7) : 450 + row * cell.h,
      start,
      whip,
      dark,
      pal,
      layout: (() => {
        const built = dreamyBuildLayout(kinds[i], ws, i, pal);
        if (theme.jitter) {
          jitterLayout(built, i, theme.jitter);
          separateLayout(built);
        }
        return theme.fit ? fitLayout(built, theme.fit.halfW, theme.fit.halfH) : built;
      })(),
    };
  });
  const glideMode = theme.cameraMode === "glide";
  const glideFrames = Math.round((theme.glideSeconds ?? 0.5) * fps);
  // The camera lands a few frames after the first word is revealed, so the new lyric is already
  // visible while the camera is still travelling (the reference never shows an empty stage).
  const glideLag = Math.round(0.2 * fps);
  const softExitFrames = theme.softExitFrames ?? scaleFrames(6, fps);
  scenes.forEach((sc, i) => {
    const next = scenes[i + 1];
    sc.end = next ? next.start + (glideMode ? softExitFrames : 2) : durationInFrames;
    // Pop (hardExit) scenes in continuous mode still need a visible crossfade, not a cut.
    if (next && theme.continuous) sc.end = next.start + 3;
    // How long the camera glides into the next scene (0 means a hard cut or whip).
    sc.glide =
      glideMode && i > 0
        ? Math.max(5, Math.min(glideFrames, sc.start + glideLag - scenes[i - 1].start - 8))
        : 0;
    sc.arrive = sc.glide ? sc.start + glideLag : sc.start;
  });
  // The closing scene lets go before the end so the title can breathe alone.
  const outroFrames = Math.round(fps * 1.0);
  const lastScene = scenes[scenes.length - 1];
  lastScene.end = Math.min(durationInFrames, Math.max(lastScene.start + fps, lastWordEnd + outroFrames));

  const cameraKeyframes = [];
  const graphics = [];
  const words = [];

  if (theme.bokeh) {
    graphics.push({
      kind: "bokehField",
      id: `${theme.idPrefix}-ambient-bokeh`,
      startFrame: 0,
      endFrame: durationInFrames,
      count: 16,
      color: DREAMY_COLOR.yellow,
      sparkleColor: "#D6B4FF",
      seed: 1999,
      screenFixed: true,
      zIndex: 4,
    });
  }
  if (theme.plexus) {
    graphics.push({
      kind: "plexusField",
      id: `${theme.idPrefix}-ambient-plexus`,
      startFrame: 0,
      endFrame: durationInFrames,
      count: theme.plexus.count ?? 28,
      color: theme.plexus.color ?? "#D6F8FF",
      lineColor: theme.plexus.lineColor ?? "#89C9FF",
      maxLinkDist: theme.plexus.maxLinkDist ?? 215,
      opacity: theme.plexus.opacity ?? 0.36,
      seed: theme.plexus.seed ?? 4141,
      screenFixed: true,
      zIndex: 2,
    });
  }
  scenes.forEach((sc, i) => {
    if (sc.dark && theme.darkBg) {
      graphics.push({
        kind: "bgOverride",
        id: `${theme.idPrefix}-dark-${i}`,
        startFrame: sc.start,
        endFrame: sc.end,
        color: theme.darkBg,
      });
    }
  });

  pushSilenceIntro(cameraKeyframes, scenes[0].start);

  // Camera: hard cut + zoom/tilt slam, or a whip pan when the lyric leaves room for one.
  scenes.forEach((sc, i) => {
    const next = scenes[i + 1];
    const isLast = !next;
    const endLimit = next
      ? next.glide
        ? next.arrive - next.glide
        : next.whip
        ? next.start - whipFrames
        : next.start - 1
      : Math.min(durationInFrames - 1, lastScene.end + fps * 2);
    if (theme.continuous) {
      const Z = [1.02, 0.97, 1.03, 0.99, 1.02, 0.98];
      const R = [2, -1.6, 2.4, -2, 1.2, -2.4];
      const z = Z[i % Z.length];
      const r = R[i % R.length];
      const sideSign = i % 2 === 0 ? 1 : -1;
      const sceneEnd = next ? next.start : sc.end;
      cameraKeyframes.push({
        frame: sc.start,
        x: sc.cx,
        y: sc.cy,
        zoom: z,
        rotateDeg: r,
        easing: "cubicOut",
      });
      const mid = Math.round((sc.start + sceneEnd) / 2);
      if (mid > sc.start + 6) {
        cameraKeyframes.push({
          frame: mid,
          x: sc.cx - sideSign * 46,
          y: sc.cy + sideSign * 24,
          zoom: z * 1.02,
          rotateDeg: -r * 0.6,
          easing: "cubicOut",
        });
      }
      if (!next) {
        cameraKeyframes.push({
          frame: Math.min(durationInFrames - 1, lastScene.end + fps),
          x: sc.cx + 60,
          y: sc.cy - 30,
          zoom: 1.12,
          rotateDeg: 0,
          easing: "cubicOut",
        });
      }
      return;
    }
    const zoomList = theme.entryZoom ?? DREAMY_ENTRY_ZOOM;
    const zIn = zoomList[i % zoomList.length];
    const rIn = DREAMY_ENTRY_ROT[i % DREAMY_ENTRY_ROT.length];
    if (sc.glide) {
      // Continuous glide: tilt and pull back mid-way, then arrive tight and ease out, so the
      // next lyric lands while the camera is still travelling.
      const prev = scenes[i - 1];
      const side = i % 2 === 0 ? 1 : -1;
      cameraKeyframes.push(
        {
          frame: sc.arrive - Math.round(sc.glide / 2),
          x: (prev.cx + sc.cx) / 2,
          y: (prev.cy + sc.cy) / 2,
          zoom: theme.glideDip?.zoom ?? 0.8,
          rotateDeg: side * (theme.glideDip?.rot ?? 13),
          easing: "cubicOut",
        },
        {
          frame: sc.arrive,
          x: sc.cx,
          y: sc.cy,
          zoom: 1.28,
          rotateDeg: -side * 3,
          easing: "cubicOut",
        }
      );
      const settle = Math.min(scaleFrames(14, fps), endLimit - sc.arrive - 2);
      if (settle >= 3) {
        cameraKeyframes.push({
          frame: sc.arrive + settle,
          x: sc.cx,
          y: sc.cy,
          zoom: 1,
          rotateDeg: 0,
          easing: "cubicOut",
        });
      }
    } else if (sc.whip) {
      cameraKeyframes.push({
        frame: sc.start,
        x: sc.cx,
        y: sc.cy,
        zoom: 1,
        rotateDeg: 0,
        easing: "whipSnap",
      });
    } else {
      cameraKeyframes.push({
        frame: sc.start,
        x: sc.cx,
        y: sc.cy,
        zoom: zIn,
        rotateDeg: rIn,
        easing: "hold",
        cut: true,
      });
      const settle = Math.min(scaleFrames(theme.entrySettle ?? 9, fps), endLimit - sc.start - 2);
      if (settle >= 3) {
        cameraKeyframes.push({
          frame: sc.start + settle,
          x: sc.cx,
          y: sc.cy,
          zoom: 1,
          rotateDeg: 0,
          easing: "expoOut",
        });
      }
    }
    // Punch the camera toward every word that lands, then let it settle back.
    const kick = theme.kick ?? { zoom: 1.11, pos: 0.09, rot: 1.6, settle: 7, soft: 1.05 };
    const kickSettle = scaleFrames(kick.settle, fps);
    let cursor = cameraKeyframes[cameraKeyframes.length - 1].frame;
    const kicks = sc.layout.items
      .map((it, idx) => ({ it, src: sc.words[Math.min(idx, sc.words.length - 1)] }))
      .filter(({ it }) => !it.echo && !it.sentence)
      .slice(1)
      .map(({ it, src }, k) => {
        const frame = Math.max(sc.start, src.startFrame - preReveal);
        // Deterministic 0..1 hash so amplitudes differ from kick to kick.
        const h = Math.abs(Math.sin(frame * 12.9898 + k * 78.233) * 43758.5453) % 1;
        const amp = 0.7 + 0.6 * h;
        return {
          frame,
          dx: it.x * kick.pos * amp,
          dy: it.y * kick.pos * amp,
          rot: (k % 2 === 0 ? kick.rot : -kick.rot) * amp,
          zoom: 1 + (kick.zoom - 1) * amp,
          strong: true,
          hero: Boolean(it.glow) || it.fs >= 200,
          k,
        };
      })
      .filter((kk) => !theme.sparseKicks || kk.hero || kk.k % 3 === 0);
    // Softer kicks on the beats between word landings keep the frame breathing.
    if (energyTrack && Array.isArray(energyTrack.frames)) {
      const trackFps = Number(energyTrack.fps) || fps;
      let wasBeat = false;
      for (let f = sc.start + 4; f < endLimit - kickSettle; f++) {
        const idx = Math.round((f / fps) * trackFps);
        const beat = Boolean(energyTrack.frames[idx]?.isBeat);
        if (beat && !wasBeat && !kicks.some((k) => Math.abs(k.frame - f) < kickSettle)) {
          const side = kicks.length % 2 === 0 ? 1 : -1;
          kicks.push({
            frame: f,
            dx: side * 14,
            dy: -side * 9,
            rot: side * 0.9,
            zoom: kick.soft,
            strong: false,
          });
        }
        wasBeat = beat;
      }
    }
    kicks.sort((a, b) => a.frame - b.frame);
    // Each kick settles before the next one lands, so fast passages become a run of
    // quick punches (like the reference's cut bursts) instead of dropping most kicks.
    for (let ki = 0; ki < kicks.length; ki++) {
      const k = kicks[ki];
      const nextFrame = ki + 1 < kicks.length ? kicks[ki + 1].frame : Infinity;
      const settle = Math.max(4, Math.min(kickSettle, nextFrame - k.frame - 1));
      if (k.frame <= cursor + 2 || k.frame + settle >= endLimit - 2) continue;
      cameraKeyframes.push(
        {
          frame: k.frame,
          x: sc.cx + k.dx,
          y: sc.cy + k.dy,
          zoom: k.zoom,
          rotateDeg: k.rot,
          easing: "hold",
        },
        {
          frame: k.frame + settle,
          x: sc.cx,
          y: sc.cy,
          zoom: 1,
          rotateDeg: 0,
          easing: "expoOut",
        }
      );
      cursor = k.frame + settle;
    }
    const lastFrame = cameraKeyframes[cameraKeyframes.length - 1].frame;
    if (endLimit > lastFrame + 1) {
      const drift = DREAMY_DRIFT[i % DREAMY_DRIFT.length];
      const driftK = theme.driftScale ?? 1;
      cameraKeyframes.push({
        frame: endLimit,
        x: sc.cx + drift.dx * driftK * (isLast ? 2 : 1),
        y: sc.cy + drift.dy * driftK * (isLast ? 2 : 1),
        zoom: isLast ? 1.18 : 1.09,
        rotateDeg: 0,
        easing: "linear",
      });
    }
  });

  // Scene transitions only run during whip travel (the empty gap between scenes), ending on the
  // first frame of the next scene, so they can never cover a word that is being sung.
  // Glide mode needs no overlay: the camera glide is the transition and nothing may cover a word.
  const whipScenes = glideMode ? [] : scenes.filter((sc) => sc.whip && sc.start - whipFrames > 0 && (!sc.glide || sc.start - scenes[scenes.indexOf(sc) - 1].words[scenes[scenes.indexOf(sc) - 1].words.length - 1].startFrame >= sc.glide + scaleFrames(10, fps)));
  const transitionVariants = ["curtain-wipe", "iris-pulse", "split-shutter"];
  const transitionPicks = [0.2, 0.55, 0.9]
    .map((p) => whipScenes[Math.min(whipScenes.length - 1, Math.floor(whipScenes.length * p))])
    .filter(Boolean)
    .filter((sc, idx, arr) => arr.indexOf(sc) === idx);
  transitionPicks.forEach((sc, idx) => {
    graphics.push({
      kind: "sceneTransition",
      id: `${theme.idPrefix}-tr-${idx}`,
      // In glide mode the overlay sits in the travel gap, before the new lyric is revealed.
      startFrame: sc.glide ? sc.start - Math.round(0.27 * fps) : sc.start - whipFrames,
      endFrame: sc.glide ? sc.start - 1 : sc.start,
      variant: transitionVariants[idx % transitionVariants.length],
      direction: idx % 2 === 0 ? "rtl" : "ttb",
      color: theme.transitionColors[0],
      accentColor: theme.transitionColors[1],
      screenFixed: true,
      zIndex: 42,
    });
  });

  let entranceCounter = 0;
  let heroCounter = 0;
  scenes.forEach((sc, si) => {
    const layout = sc.layout;
    const nextWordStart = (idx) =>
      idx + 1 < sc.words.length ? sc.words[idx + 1].startFrame : sc.end;

    layout.items.forEach((it, idx) => {
      const srcIdx = it.echo ? it.echoOf ?? sc.words.length - 1 : idx;
      const src = sc.words[Math.min(srcIdx, sc.words.length - 1)];
      const wStart = Math.max(sc.start, src.startFrame - preReveal);
      const pacing = classifyPacing(src, nextWordStart(Math.min(srcIdx, sc.words.length - 1)), energyTrack, fps);
      const isHero = Boolean(it.glow) || it.fs >= 200;
      const [entrance, revealDir] = it.sentence
        ? theme.sentenceEntrance ?? ["mask-glide", "ltr"]
        : it.echo
        ? theme.echoEntrance ?? ["mask-glide", "btt"]
        : isHero && theme.heroEntrances
        ? theme.heroEntrances[heroCounter++ % theme.heroEntrances.length]
        : (theme.entrances ?? DREAMY_ENTRANCES)[
            entranceCounter++ % (theme.entrances ?? DREAMY_ENTRANCES).length
          ];
      const isLastScene = si === scenes.length - 1;
      const pushTarget = sc.words[Math.min(srcIdx + 1, sc.words.length - 1)];
      words.push({
        id: `${theme.idPrefix}-s${si}-w${idx}`,
        text: it.text,
        // "sentence" without a line break renders as plain text: no per-word or per-letter clipping.
        granularity: theme.plainGranularity ? "sentence" : it.gran,
        startFrame: wStart,
        endFrame: sc.end,
        x: sc.cx + it.x,
        y: sc.cy + it.y,
        fontSize: Math.round(it.fs),
        fontRole: it.role ?? "display",
        useNarrowDisplay: false,
        ...(it.weight ? { fontWeight: it.weight } : {}),
        variant: it.hollow && !(it.echo && theme.ghostEcho) ? "hollow-outline" : "solid",
        ...(it.echo && theme.ghostEcho
          ? { color: sc.pal.purple, baseOpacity: 0.3, blurPx: 6 }
          : it.hollow
          ? { strokeColor: it.color, strokeWidth: theme.hollowStroke, color: "transparent" }
          : { color: it.color }),
        rotateDeg: it.rot,
        entrance,
        ...(revealDir ? { revealDir } : {}),
        entranceDurationFrames: theme.entranceFrames?.[entrance] ??
          Math.min(pacing.entranceDurationFrames, theme.maxEntranceFrames ?? maxEntranceFrames),
        ...(isLastScene && !it.echo
          ? { exitStyle: "split-close", exitDurationFrames: scaleFrames(8, fps) }
          : !glideMode && theme.hardExit
          ? { exitStyle: "slide-out", exitDurationFrames: scaleFrames(7, fps) }
          : glideMode
          ? {
              exitStyle: theme.exitStyle ?? "ease-in-pop",
              exitDurationFrames: softExitFrames,
              ...(theme.exitOpacityFloor !== undefined ? { exitOpacityFloor: theme.exitOpacityFloor } : {}),
            }
          : {}),
        ...(it.glow && theme.glow ? { deepGlow: true } : {}),
        ...(theme.wordDrift ? { driftStrength: it.echo ? theme.wordDrift * 1.4 : theme.wordDrift } : {}),
        ...(theme.travel && !it.sentence
          ? (() => {
              // Deterministic per-word direction; heroes travel and grow more than small words.
              const h = Math.abs(Math.sin((wStart + idx * 31 + si * 17) * 12.9898) * 43758.5453) % 1;
              const away = Math.abs(it.x) + Math.abs(it.y) > 140;
              // Words off-centre drift back toward the middle of the frame, never outward.
              const ang = away
                ? Math.atan2(-it.y, -it.x) + (h - 0.5) * 1.6
                : h * Math.PI * 2;
              const life = Math.min(1.3, (sc.end - wStart) / 50);
              const mag = (isHero ? theme.travel.hero : theme.travel.small) * life;
              return {
                travel: {
                  dx: Math.round(Math.cos(ang) * mag),
                  dy: Math.round(Math.sin(ang) * mag * 0.8),
                  rot: Math.round((h - 0.5) * theme.travel.rot * 10) / 10,
                  scale: isHero ? theme.travel.heroGrow : theme.travel.smallGrow,
                },
              };
            })()
          : {}),
        ...(it.push && pushTarget && !it.echo
          ? {
              kineticPush: {
                dx: idx % 2 === 0 ? -14 : 14,
                dy: -20,
                triggerFrame: Math.max(wStart + 1, pushTarget.startFrame - preReveal),
                rotateDeg: idx % 2 === 0 ? -1.5 : 1.5,
              },
            }
          : {}),
        beatReactive: Boolean(it.glow) || isNearBeat(energyTrack, src.startFrame, fps),
        zIndex: it.z,
      });
    });

    if (theme.dense) {
      const DIR4 = ["ltr", "rtl", "btt", "ttb"];
      const solid = layout.items.filter((it) => !it.echo && !it.sentence && it.fs >= 60);
      solid.forEach((it, j) => {
        const idx = layout.items.indexOf(it);
        const src = sc.words[Math.min(idx, sc.words.length - 1)];
        const base = Math.max(sc.start, src.startFrame - preReveal);
        const nGhost = it.fs >= 120 ? 2 : 1;
        for (let g = 0; g < nGhost; g++) {
          const r = dreamyHash(si * 313 + j * 29 + g * 7 + 5);
          const ang = r * Math.PI * 2;
          const d = 46 + 42 * g + r * 30;
          words.push({
            id: `${theme.idPrefix}-s${si}-g${j}-${g}`,
            text: it.text,
            granularity: "sentence",
            // A trail never shows before its word is actually sung.
            startFrame: Math.min(sc.end - 4, Math.max(src.startFrame, base + 2 + g * 3)),
            endFrame: sc.end,
            x: sc.cx + it.x + Math.round(Math.cos(ang) * d),
            y: sc.cy + it.y + Math.round(Math.sin(ang) * d * 0.8),
            fontSize: Math.round(it.fs * (1 - 0.07 * g)),
            fontRole: it.role ?? "display",
            variant: "hollow-outline",
            strokeColor: it.color,
            strokeWidth: 2,
            color: "transparent",
            rotateDeg: Math.round(((it.rot ?? 0) + (r - 0.5) * 12) * 10) / 10,
            entrance: "slide-blur",
            revealDir: DIR4[Math.floor(r * 4) % 4],
            entranceDurationFrames: 8,
            exitStyle: "slide-out",
            exitDurationFrames: softExitFrames,
            ambient: true,
            baseOpacity: 0.6 - 0.22 * g,
            driftStrength: 3,
            travel: { dx: Math.round(Math.cos(ang) * 46), dy: Math.round(Math.sin(ang) * 36), rot: Math.round((r - 0.5) * 14) / 2, scale: 0.08 },
            zIndex: 3 + g * 12,
          });
        }
      });
      // Small captions repeating words from the line, popping in rapid succession around the frame.
      const nMicro = 3 + Math.floor(dreamyHash(si * 41 + 9) * 4);
      const taken = (theme.reserved ? theme.reserved(si, sc) : []).map((c) => ({ x: c.x, y: c.y, hw: c.r, hh: c.r }));
      const solidBoxes = layout.items
        .filter((it) => !it.echo)
        .map((it) => {
          const b = dreamyItemBox(it);
          if (it.sentence) {
            const sentenceHw = Math.max(b.hw, (it.text.length * it.fs * 0.56) / 2);
            return { x: it.x, y: it.y, hw: sentenceHw + 24, hh: Math.max(b.hh, it.fs * 0.85) + 18 };
          }
          return { x: it.x, y: it.y, hw: b.hw * 1.15 + 18, hh: b.hh * 1.1 + 14 };
        });
      for (let k = 0; k < nMicro; k++) {
        const r = dreamyHash(si * 577 + k * 53 + 11);
        let r2 = dreamyHash(si * 577 + k * 53 + 12);
        const wsrc = sc.words[Math.floor(r * sc.words.length) % sc.words.length];
        // Captions must sit in empty space: never on top of a readable word or another caption.
        const mfs = 30 + Math.round(r2 * 16);
        const mhw = (wsrc.text.length * mfs * 0.56) / 2 + 10;
        let mx = 0;
        let my = 0;
        let placed = false;
        for (let attempt = 0; attempt < 14 && !placed; attempt++) {
          const a = dreamyHash(si * 577 + k * 53 + 20 + attempt);
          const b = dreamyHash(si * 577 + k * 53 + 40 + attempt);
          mx = Math.round((a - 0.5) * 2 * 400);
          my = Math.round((b - 0.5) * 2 * 285);
          const clear = [...solidBoxes, ...taken].every(
            (o) => Math.abs(mx - o.x) > o.hw + mhw || Math.abs(my - o.y) > o.hh + mfs * 0.6
          );
          if (clear) {
            placed = true;
            taken.push({ x: mx, y: my, hw: mhw, hh: mfs * 0.6 });
          }
        }
        if (!placed) continue;
        words.push({
          id: `${theme.idPrefix}-s${si}-m${k}`,
          text: wsrc.text.toLowerCase(),
          granularity: "sentence",
          // A caption repeats a word only after that word has been sung.
          startFrame: Math.min(sc.end - 6, Math.max(wsrc.startFrame + 2, sc.start + 3 + k * 5) + Math.floor(r2 * 6)),
          endFrame: sc.end,
          x: sc.cx + mx,
          y: sc.cy + my,
          fontSize: mfs,
          fontRole: "body",
          fontWeight: 700,
          variant: "solid",
          color: sc.pal.dim,
          rotateDeg: Math.round((r - 0.5) * 24),
          entrance: "slide-blur",
          revealDir: DIR4[Math.floor(r2 * 4) % 4],
          entranceDurationFrames: 7,
          exitStyle: "slide-out",
          exitDurationFrames: softExitFrames,
          ambient: true,
          driftStrength: 3,
          travel: { dx: Math.round((r2 - 0.5) * 90), dy: Math.round((r - 0.5) * 70), rot: Math.round((r - 0.5) * 8), scale: 0.1 },
          zIndex: 40 + k * 12,
        });
      }
    }

    const decorStart = graphics.length;
    // Decor appears with the hero word so a bare ring never sits alone on screen.
    const heroIdx = Math.max(0, layout.items.findIndex((it) => it.glow));
    const heroSrc = sc.words[Math.min(heroIdx, sc.words.length - 1)];
    layout.decor.forEach((d, di) => {
      graphics.push({
        ...d,
        id: `${theme.idPrefix}-s${si}-decor${di}`,
        startFrame: Math.max(sc.start, heroSrc.startFrame - preReveal),
        endFrame: sc.end,
        x: sc.cx + d.x,
        y: sc.cy + d.y,
      });
    });

    if (theme.decorate) {
      theme.decorate({ sc, si, scenes, graphics, words, fps, preReveal, prefix: theme.idPrefix });
    }
    if (theme.decorOverlap) {
      for (let gi = decorStart; gi < graphics.length; gi++) {
        // Sticker backings belong to their word and must leave with it, not linger behind new text.
        if (graphics[gi].kind === "stickerBlock" && /-stk\d/.test(graphics[gi].id)) continue;
        graphics[gi].endFrame = Math.min(durationInFrames, graphics[gi].endFrame + theme.decorOverlap);
      }
    }
  });

  // One polaroid in the first scene, tucked in a corner like the reference opener.
  if (theme.polaroid) graphics.push({
    kind: "mediaCard",
    id: `${theme.idPrefix}-s0-polaroid`,
    startFrame: scenes[0].start,
    endFrame: scenes[0].end,
    x: scenes[0].cx + 430,
    y: scenes[0].cy - 290,
    width: 150,
    height: 170,
    rotateDeg: 8,
    variant: "polaroid-frame",
    label: scenes[0].words[scenes[0].words.length - 1].text,
    parallaxFactor: 0.04,
    zIndex: 7,
  });

  // Closing title card, alone on the dark with bokeh.
  const titleStart = Math.min(durationInFrames - 1, lastScene.end - Math.round(fps * 0.3));
  if (titleStart < durationInFrames - fps) {
    words.push({
      id: `${theme.idPrefix}-outro-title`,
      text: title,
      granularity: "sentence",
      startFrame: titleStart,
      endFrame: durationInFrames,
      x: 600,
      y: 450,
      fontSize: theme.title.fontSize,
      fontRole: theme.title.fontRole,
      fontWeight: theme.title.fontWeight,
      variant: "solid",
      color: theme.title.color,
      entrance: "tracking-expand",
      exitStyle: "split-close",
      screenFixed: true,
      zIndex: 30,
    });
  }

  return {
    id: slug,
    title,
    stylePackId: theme.stylePackId,
    fps,
    durationInFrames,
    ...(audioSrc ? { audioSrc } : {}),
    cameraKeyframes,
    ...(theme.cameraWobble ? { cameraWobble: theme.cameraWobble } : {}),
    ...(theme.cameraSmoothing ? { cameraSmoothing: theme.cameraSmoothing } : {}),
    graphics,
    words,
  };
}

/**
 * Dense dreamy stage dressing, after the reference: soft stars, glowing moons, outline
 * starbursts, a cream swirl, a butterfly, a lime tab with a ghost rectangle, one rose.
 * Everything sits on layers below the words (z < 14) and near the frame corners.
 */
function dreamyDecorate({ sc, si, graphics, prefix }) {
  if (sc.kind === "breather") {
    // Keep the quiet line quiet: one soft moon and one star only.
    graphics.push(
      {
        kind: "doodle",
        id: `${prefix}-s${si}-dd-moon`,
        shape: "moon",
        startFrame: sc.start,
        endFrame: sc.end,
        x: sc.cx + 380,
        y: sc.cy + 330,
        size: 300,
        color: "rgba(255, 246, 168, 0.55)",
        blurPx: 10,
        glow: false,
        zIndex: 0,
      },
      {
        kind: "doodle",
        id: `${prefix}-s${si}-dd-star`,
        shape: "star",
        startFrame: sc.start,
        endFrame: sc.end,
        x: sc.cx - 420,
        y: sc.cy - 260,
        size: 90,
        color: "#FFF066",
        spinDegPerSec: 10,
        opacity: 0.8,
        zIndex: 0,
      }
    );
    return;
  }

  const rnd = (k) => {
    const x = Math.sin((si * 131 + k * 17 + 7) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const corners = [
    { x: -480, y: -300 },
    { x: 490, y: -290 },
    { x: -490, y: 300 },
    { x: 480, y: 310 },
  ];
  const corner = (k) => corners[(si + k) % corners.length];
  const start = sc.start + 2;
  const add = (node) => graphics.push({ startFrame: start, endFrame: sc.end, ...node });
  const at = (c, dx = 0, dy = 0) => ({ x: sc.cx + c.x + dx, y: sc.cy + c.y + dy });

  // Big out-of-focus star and a small crisp one.
  add({
    kind: "doodle",
    id: `${prefix}-s${si}-dd-star-a`,
    shape: "star",
    ...at(corner(0)),
    size: 200 + Math.round(rnd(1) * 70),
    color: "#FFF066",
    blurPx: 5,
    opacity: 0.55,
    spinDegPerSec: si % 2 === 0 ? 18 : -18,
    phase: rnd(2),
    zIndex: 0,
  });
  add({
    kind: "doodle",
    id: `${prefix}-s${si}-dd-star-b`,
    shape: "star",
    ...at(corner(2), 40 * (rnd(3) - 0.5), 30 * (rnd(4) - 0.5)),
    size: 62 + Math.round(rnd(5) * 30),
    color: si % 3 === 0 ? "#D6B4FF" : "#FFF066",
    spinDegPerSec: si % 2 === 0 ? -28 : 28,
    phase: rnd(6),
    zIndex: 0,
  });

  // Moon glow on alternating scenes.
  if (si % 2 === 0) {
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-dd-moon`,
      shape: "moon",
      ...at({ x: (rnd(7) - 0.5) * 520, y: 360 }),
      size: 260,
      color: "rgba(255, 246, 168, 0.7)",
      blurPx: 8,
      glow: false,
      driftPx: 16,
      phase: rnd(8),
      zIndex: 0,
    });
  }

  // Outline starburst, every scene.
  add({
    kind: "starburst",
    id: `${prefix}-s${si}-dd-burst`,
    ...at(corner(1), 20 * (rnd(9) - 0.5), 20 * (rnd(10) - 0.5)),
    radius: 80 + Math.round(rnd(11) * 70),
    points: 12 + (si % 3) * 2,
    innerRatio: 0.62,
    fill: "transparent",
    stroke: si % 2 === 0 ? "#9B5CFF" : "#FFF066",
    strokeWidth: 3,
    spinDegPerSec: si % 2 === 0 ? 30 : -30,
    zIndex: 0,
  });

  // Cream swirl that draws itself on.
  if (si % 3 === 0) {
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-dd-swirl`,
      shape: "swirl",
      ...at({ x: (si % 2 === 0 ? 1 : -1) * 250, y: 330 }),
      size: 360,
      color: "#EFE3C8",
      rotateDeg: (rnd(12) - 0.5) * 24,
      zIndex: 0,
    });
  }

  // Butterfly.
  if (si % 4 === 2) {
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-dd-butterfly`,
      shape: "butterfly",
      ...at({ x: (rnd(13) > 0.5 ? 1 : -1) * 400, y: -140 }),
      size: 96,
      color: "#FFE15A",
      secondaryColor: "#8A6A00",
      rotateDeg: (rnd(14) - 0.5) * 50,
      driftPx: 24,
      phase: rnd(15),
      zIndex: 0,
    });
  }

  // Lime tab with a ghost rectangle, like the small cards in the reference.
  if (si % 3 === 1) {
    const c = corner(3);
    graphics.push(
      {
        kind: "stickerBlock",
        id: `${prefix}-s${si}-dd-lime`,
        startFrame: start,
        endFrame: sc.end,
        ...at(c, 0, -10),
        width: 78,
        height: 78,
        rotateDeg: 0,
        color: "#E6F25A",
        shadow: false,
        zIndex: 0,
      },
      {
        kind: "stickerBlock",
        id: `${prefix}-s${si}-dd-ghost`,
        startFrame: start,
        endFrame: sc.end,
        ...at(c, 70, 34),
        width: 150,
        height: 74,
        rotateDeg: 0,
        color: "rgba(255, 255, 255, 0.14)",
        shadow: false,
        zIndex: 0,
      }
    );
  }

  // One rose, once, with its own halo.
  if (si === 3) {
    graphics.push(
      {
        kind: "doodle",
        id: `${prefix}-s${si}-dd-rosehalo`,
        shape: "moon",
        startFrame: start,
        endFrame: sc.end,
        ...at({ x: -430, y: 250 }),
        size: 330,
        color: "rgba(255, 120, 150, 0.45)",
        blurPx: 12,
        glow: false,
        zIndex: 0,
      },
      {
        kind: "flower",
        id: `${prefix}-s${si}-dd-rose`,
        startFrame: start,
        endFrame: sc.end,
        ...at({ x: -430, y: 250 }),
        radius: 110,
        petals: 9,
        color: "#C2183F",
        rimColor: "#5E0A20",
        tipColor: "#F0557A",
        coreColor: "#FFD54A",
        spinDegPerSec: 3,
        zIndex: 0,
      }
    );
  }
}

const DREAMY_THEME = {
  stylePackId: "dreamy-glow-dark",
  idPrefix: "dream",
  palette: () => DREAMY_COLOR,
  isDark: () => true,
  darkBg: undefined,
  bokeh: true,
  polaroid: true,
  glow: true,
  hollowStroke: 4,
  cameraMode: "glide",
  continuous: true,
  fit: { halfW: 400, halfH: 300 },
  jitter: { pos: 140, rot: 10, size: 0.3 },
  dense: true,
  decorOverlap: 22,
  cell: { w: 1100, h: 800 },
  ghostEcho: true,
  // After the reference: 90% of words ghost in (15% -> 100% opacity over ~10 frames while a blur
  // clears); hero words slam in fully opaque with a tilt/scale settle or rise from the bottom.
  // revealDir is ignored by fade-focus; it only keeps neighbouring words' signatures distinct.
  entrances: [
    ["slide-blur", "ltr"],
    ["slide-blur", "btt"],
    ["slide-blur", "rtl"],
    ["slide-blur", "ttb"],
    ["slide-blur", "ltr"],
    ["slide-blur", "rtl"],
    ["slide-blur", "btt"],
  ],
  heroEntrances: [
    ["char-spring", undefined],
    ["slide-blur", "btt"],
    ["char-spring", undefined],
    ["slide-blur", "rtl"],
  ],
  entranceFrames: { "fade-focus": 10, "rise-fade": 8, "blur-pop": 6, "hero-rise": 4, "spring-pop": 6, "char-spring": 12, "slide-blur": 9 },
  exitStyle: "slide-out",
  // Words keep travelling, tilting and growing while they live (px, degrees, extra scale).
  travel: { hero: 55, small: 40, rot: 8, heroGrow: 0.1, smallGrow: 0.06 },
  echoEntrance: ["fade-focus", undefined],
  sentenceEntrance: ["fade-focus", undefined],
  // Words dim to ~28% and the camera carries them off, instead of fading to nothing.
  softExitFrames: 10,
  exitOpacityFloor: 0,
  // Roll bursts (60-80 degrees over ~25 frames) between compositions, and a held scroll.
  glideSeconds: 0.8,
  driftScale: 3.5,
  plainGranularity: true,
  maxEntranceFrames: 6,
  // Always-on movement: the reference is almost never still, ours was static 60% of the time.
  cameraWobble: { rotDeg: 2, zoomPct: 0.02, panPx: 22, periodSec: 2.6 },
  kick: { zoom: 1.14, pos: 0.12, rot: 3, settle: 9, soft: 1.07 },
  glideDip: { zoom: 0.66, rot: 48 },
  cameraSmoothing: { omega: 0.2, zeta: 0.85 },
  sparseKicks: true,
  wordDrift: 4,
  transitionColors: [DREAMY_COLOR.purple, DREAMY_COLOR.yellow],
  title: { color: "#E2D9F3", fontRole: "serif", fontSize: 54, fontWeight: 400 },
  decorate: dreamyDecorate,
};

function buildDreamyGlowStoryboard(args) {
  return buildSceneStoryboard({ ...args, theme: DREAMY_THEME });
}

const POP_COLOR_LIGHT = {
  white: "#111114",
  yellow: "#FF4518",
  purple: "#6C28FF",
  pink: "#3A66FF",
  dim: "#8A8A99",
  echo: "rgba(17, 17, 20, 0.8)",
};

const POP_COLOR_DARK = {
  white: "#FFFFFF",
  yellow: "#FF4518",
  purple: "#9B6BFF",
  pink: "#8FD99F",
  dim: "#B9B9C9",
  echo: "rgba(255, 255, 255, 0.75)",
};

const POP_STICKER_FILLS = ["#6C28FF", "#FF4518", "#8FD99F"];
const POP_FLOWER_SPOTS = [
  { x: -470, y: -260 },
  { x: 480, y: 250 },
  { x: -500, y: 270 },
  { x: 470, y: -290 },
];

/** Pop collage extras: tilted sticker backings, paper-cut flowers, hollow echo trail. */
function popDecorate({ sc, si, scenes, graphics, words, prefix }) {
  sc.layout.items.forEach((it, idx) => {
    if (it.echo || it.sentence || it.hollow || it.role === "body") return;
    if (it.fs > 300 || (idx + si) % 3 !== 1) return;
    // A sticker is a label backing: skip rotated words (their box is wrong) and anything wide.
    if (Math.abs(it.rot ?? 0) > 30 || it.text.length * it.fs * 0.5 + 80 > 460) return;
    const word = words.find((w) => w.id === `${prefix}-s${si}-w${idx}`);
    if (!word) return;
    // Pick a fill that none of the nearby words is drawn in, so no word vanishes into a sticker.
    const family = (c) =>
      /^#FF4518/i.test(c)
        ? "orange"
        : /^#(6C28FF|9B6BFF|3A66FF)/i.test(c)
        ? "violet"
        : /^#8FD99F/i.test(c)
        ? "mint"
        : String(c);
    const nearby = words
      .filter(
        (w) =>
          w.id.startsWith(`${prefix}-s${si}-w`) &&
          w.id !== word.id &&
          Math.abs(w.y - word.y) < it.fs * 1.15
      )
      .map((w) => family(w.strokeColor ?? w.color));
    const rotated = POP_STICKER_FILLS.map(
      (_, k) => POP_STICKER_FILLS[(k + idx + si) % POP_STICKER_FILLS.length]
    );
    const fill = rotated.find((f) => !nearby.includes(family(f))) ?? rotated[0];
    word.color = fill === "#8FD99F" ? "#111114" : "#FFFFFF";
    // Keep sticker-backed words seated inside their block so stacked Vietnamese diacritics never drift onto the light canvas.
    if (word.travel) {
      word.travel = {
        ...word.travel,
        dx: Math.round(Math.max(-10, Math.min(10, word.travel.dx))),
        dy: Math.round(Math.max(-6, Math.min(8, word.travel.dy))),
      };
    }
    if (word.kineticPush) {
      word.kineticPush = {
        ...word.kineticPush,
        dx: Math.round(word.kineticPush.dx * 0.5),
        dy: Math.round(Math.max(-8, word.kineticPush.dy * 0.4)),
      };
    }
    graphics.push({
      kind: "stickerBlock",
      id: `${prefix}-s${si}-stk${idx}`,
      startFrame: word.startFrame,
      endFrame: word.endFrame,
      x: word.x,
      y: Math.round(word.y - it.fs * 0.14),
      width: Math.round(it.text.length * it.fs * 0.54 + 88),
      // Tall enough that stacked Vietnamese accents stay on the sticker, not white-on-white.
      height: Math.round(it.fs * 1.44),
      rotateDeg: it.rot,
      color: fill,
      shadow: true,
      zIndex: 12,
    });
  });

  if (sc.kind !== "breather" && si % 2 === 1) {
    const spot = POP_FLOWER_SPOTS[(si >> 1) % POP_FLOWER_SPOTS.length];
    graphics.push({
      kind: "flower",
      id: `${prefix}-s${si}-flower`,
      startFrame: sc.start,
      endFrame: sc.end,
      x: sc.cx + spot.x,
      y: sc.cy + spot.y,
      radius: 250 + ((si * 37) % 80),
      petals: 7 + (si % 3),
      color: sc.dark ? "#C2315F" : "#B3224F",
      rimColor: "#6E0F2E",
      tipColor: "#E86A8F",
      rotateDeg: si * 29,
      spinDegPerSec: si % 2 === 0 ? 4 : -4,
      opacity: sc.dark ? 0.8 : 0.95,
      zIndex: 0,
    });
  }

  const firstGiant = scenes.findIndex((o) => o.kind === "giant");
  if (sc.kind === "giant" && (si === firstGiant || si === scenes.length - 1)) {
    const heroIdx = Math.max(0, sc.layout.items.findIndex((it) => it.glow));
    const hero = sc.layout.items[heroIdx];
    const heroWord = words.find((w) => w.id === `${prefix}-s${si}-w${heroIdx}`);
    if (hero && heroWord && hero.text.length >= 2) {
      graphics.push({
        kind: "hollowEcho",
        id: `${prefix}-s${si}-echo`,
        startFrame: heroWord.startFrame,
        endFrame: sc.end,
        x: sc.cx + hero.x,
        y: sc.cy + hero.y,
        text: hero.text,
        fontSize: Math.round(hero.fs * 0.92),
        count: 6,
        stepX: Math.round(hero.fs * 0.22),
        strokeColor: sc.pal.white,
        strokeWidth: 2,
        driftX: 28,
        zIndex: 6,
      });
    }
  }
}

const POP_THEME = {
  stylePackId: "pop-collage-light",
  idPrefix: "pop",
  palette: (dark) => (dark ? POP_COLOR_DARK : POP_COLOR_LIGHT),
  isDark: (i, total) => total >= 6 && i / total >= 0.42 && i / total < 0.62,
  darkBg: "#0D0D0F",
  bokeh: false,
  polaroid: false,
  glow: false,
  hollowStroke: 3,
  cameraMode: "glide",
  continuous: true,
  fit: { halfW: 400, halfH: 300 },
  jitter: { pos: 140, rot: 10, size: 0.3 },
  dense: true,
  decorOverlap: 18,
  hardExit: true,
  ghostEcho: false,
  // Typewriter and roll-settle for big words, hard pops for the rest, like the reference.
  entrances: [
    ["slide-blur", "rtl"],
    ["slide-blur", "btt"],
    ["slide-blur", "ltr"],
    ["slide-blur", "ttb"],
  ],
  heroEntrances: [
    ["slide-blur", "ltr"],
    ["roll-settle", undefined],
    ["slide-blur", "btt"],
    ["slide-blur", "rtl"],
  ],
  entranceFrames: { "roll-settle": 18, typewriter: 4, "slide-blur": 7 },
  travel: { hero: 50, small: 38, rot: 7, heroGrow: 0.1, smallGrow: 0.06 },
  echoEntrance: ["pop", undefined],
  sentenceEntrance: ["typewriter", undefined],
  // Cuts jump into ~2x crops or out to ~0.55x and settle in 4-5 frames.
  entryZoom: [1.9, 0.62, 1.6, 0.55, 2.1],
  entrySettle: 5,
  plainGranularity: true,
  maxEntranceFrames: 4,
  cameraWobble: { rotDeg: 1.8, zoomPct: 0.02, panPx: 20, periodSec: 2.4 },
  kick: { zoom: 1.16, pos: 0.14, rot: 2.5, settle: 8, soft: 1.06 },
  cameraSmoothing: { omega: 0.24, zeta: 0.85 },
  sparseKicks: true,
  wordDrift: 3.4,
  transitionColors: ["#6C28FF", "#8FD99F"],
  title: { color: "#111114", fontRole: "display", fontSize: 64, fontWeight: 400 },
  decorate: popDecorate,
  // Where popDecorate drops flowers: captions and trails keep out of those circles.
  reserved: (si, sc) => {
    if (sc.kind === "breather" || si % 2 !== 1) return [];
    const spot = POP_FLOWER_SPOTS[(si >> 1) % POP_FLOWER_SPOTS.length];
    return [{ x: spot.x, y: spot.y, r: 260 + ((si * 37) % 80) }];
  },
};

function buildPopCollageStoryboard(args) {
  return buildSceneStoryboard({ ...args, theme: POP_THEME });
}

const NEON_PLEXUS_COLOR = {
  white: "#FFFFFF",
  yellow: "#4EFFB2",
  purple: "#FFF59E",
  pink: "#FF6B5B",
  dim: "#B8D0E8",
  echo: "rgba(91, 124, 255, 0.24)",
};

/**
 * Neon Plexus stage dressing inspired by m1hl4m dark edits (Vu tru co anh / 2 phut hon):
 * 3D perspective neon tilted hoops, glowing 4-point diamond sparkles, and soft electric corner bursts.
 */
function neonPlexusDecorate({ sc, si, graphics, words, prefix }) {
  const start = sc.start + 1;
  const add = (node) => graphics.push({ startFrame: start, endFrame: sc.end, ...node });
  const at = (x, y) => ({ x: sc.cx + x, y: sc.cy + y });
  const rnd = (k) => {
    const x = Math.sin((si * 173 + k * 29 + 11) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  if (sc.kind === "breather") {
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-np-spark-b`,
      shape: "sparkle4",
      ...at(-420, -240),
      size: 110,
      color: "#FFF59E",
      spinDegPerSec: 12,
      opacity: 0.9,
      zIndex: 0,
    });
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-np-ring-b`,
      shape: "tiltedRing",
      ...at(380, 250),
      size: 320,
      color: "#4EFFB2",
      rotateDeg: -10,
      opacity: 0.52,
      driftPx: 14,
      zIndex: 0,
    });
    return;
  }

  const corners = [
    { x: -485, y: -295 },
    { x: 495, y: -280 },
    { x: -495, y: 295 },
    { x: 485, y: 290 },
  ];
  const corner = (k) => corners[(si + k) % corners.length];
  const ringColors = ["#4EFFB2", "#FFF59E", "#FF6B5B", "#5B7CFF"];

  // Perspective neon hoop framing behind the composition.
  add({
    kind: "doodle",
    id: `${prefix}-s${si}-np-hoop`,
    shape: "tiltedRing",
    ...at((rnd(1) - 0.5) * 120, (si % 2 === 0 ? 1 : -1) * 110),
    size: 470 + Math.round(rnd(2) * 90),
    color: ringColors[si % ringColors.length],
    secondaryColor: si % 2 === 0 ? "#FFF59E" : "#FFFFFF",
    rotateDeg: (rnd(3) - 0.5) * 26,
    spinDegPerSec: si % 2 === 0 ? 4 : -4,
    driftPx: 16,
    opacity: 0.72,
    phase: rnd(4),
    zIndex: 1,
  });

  // Large glowing 4-point diamond star (2 phut hon / Vu tru co anh).
  const c0 = corner(0);
  add({
    kind: "doodle",
    id: `${prefix}-s${si}-np-spark-lg`,
    shape: "sparkle4",
    ...at(c0.x, c0.y),
    size: 130 + Math.round(rnd(5) * 55),
    color: si % 3 === 0 ? "#4EFFB2" : "#FFF59E",
    spinDegPerSec: si % 2 === 0 ? 16 : -16,
    opacity: 0.92,
    phase: rnd(6),
    zIndex: 0,
  });

  // Secondary smaller crisp 4-point sparkle.
  const c2 = corner(2);
  add({
    kind: "doodle",
    id: `${prefix}-s${si}-np-spark-sm`,
    shape: "sparkle4",
    ...at(c2.x, c2.y),
    size: 62 + Math.round(rnd(7) * 28),
    color: "#FFFFFF",
    spinDegPerSec: si % 2 === 0 ? -24 : 24,
    opacity: 0.85,
    phase: rnd(8),
    zIndex: 0,
  });

  // Soft electric blue / violet corner starburst orb.
  const c1 = corner(1);
  add({
    kind: "starburst",
    id: `${prefix}-s${si}-np-orb`,
    ...at(c1.x, c1.y),
    radius: 78 + Math.round(rnd(9) * 34),
    points: 14,
    innerRatio: 0.78,
    fill: si % 2 === 0 ? "#5B7CFF" : "#8A6BFF",
    spinDegPerSec: si % 2 === 0 ? 22 : -22,
    zIndex: 0,
  });

  // Alternating dashed neon orbit ring or 360-degree orbiting circular lyric text ring (Vu tru co anh).
  if (si % 3 === 1) {
    const phraseText = sc.words.slice(0, 4).map((w) => w.text.toUpperCase()).join(" ");
    add({
      kind: "circularText",
      id: `${prefix}-s${si}-np-circtext`,
      ...at(0, 0),
      radius: 265,
      text: phraseText,
      fontSize: 32,
      fontRole: "display",
      color: si % 2 === 1 ? "#4EFFB2" : "#FFF59E",
      ringStroke: si % 2 === 1 ? "rgba(78, 255, 178, 0.35)" : "rgba(255, 245, 158, 0.3)",
      ringStrokeWidth: 26,
      spinDegPerSec: si % 2 === 1 ? 52 : -52,
      tiltXDeg: si % 2 === 1 ? 0 : 48,
      opacity: 0.78,
      zIndex: 2,
    });
  } else if (si % 2 === 1) {
    const c3 = corner(3);
    add({
      kind: "orbitRing",
      id: `${prefix}-s${si}-np-orbit`,
      ...at(c3.x, c3.y),
      radius: 135,
      stroke: "#4EFFB2",
      strokeWidth: 2.5,
      dashArray: "12 10",
      spinDegPerSec: -20,
      glow: true,
      zIndex: 0,
    });
  }

  // Mid-life 360-degree Y-axis coin-flip spin on long-held hero words (like ANH -> HNA -> ANH).
  const sceneHero = words.find(
    (w) =>
      w.id.startsWith(`${prefix}-s${si}-w`) &&
      !w.ambient &&
      w.endFrame - w.startFrame >= 36 &&
      w.fontSize >= 105 &&
      Math.abs(w.rotateDeg ?? 0) < 35
  );
  if (sceneHero && si % 2 === 0) {
    sceneHero.spin360 = {
      axis: "y",
      turns: 1,
      triggerFrame: sceneHero.startFrame + Math.round((sceneHero.endFrame - sceneHero.startFrame) * 0.42),
      durationFrames: 15,
    };
  }
}

const NEON_PLEXUS_THEME = {
  stylePackId: "neon-plexus-dark",
  idPrefix: "npx",
  palette: () => NEON_PLEXUS_COLOR,
  isDark: () => true,
  darkBg: undefined,
  bokeh: false,
  plexus: { count: 30, color: "#D6F8FF", lineColor: "#78B8FF", maxLinkDist: 220, opacity: 0.36, seed: 4141 },
  polaroid: false,
  glow: true,
  hollowStroke: 3,
  cameraMode: "glide",
  continuous: true,
  fit: { halfW: 400, halfH: 300 },
  jitter: { pos: 135, rot: 10, size: 0.28 },
  dense: true,
  decorOverlap: 18,
  cell: { w: 1100, h: 800 },
  ghostEcho: true,
  entrances: [
    ["spin-360-y", undefined],
    ["slide-blur", "btt"],
    ["slide-blur", "rtl"],
    ["spin-360-x", undefined],
  ],
  heroEntrances: [
    ["spin-360-y", undefined],
    ["spin-360-x", undefined],
    ["spin-360-z", undefined],
    ["char-spring", undefined],
  ],
  entranceFrames: {
    "fade-focus": 8,
    "rise-fade": 7,
    "blur-pop": 5,
    "hero-rise": 4,
    "spring-pop": 5,
    "char-spring": 10,
    "slide-blur": 7,
    "roll-settle": 14,
    "spin-360-y": 15,
    "spin-360-x": 13,
    "spin-360-z": 13,
  },
  exitStyle: "slide-out",
  travel: { hero: 52, small: 38, rot: 7, heroGrow: 0.1, smallGrow: 0.06 },
  echoEntrance: ["fade-focus", undefined],
  sentenceEntrance: ["fade-focus", undefined],
  softExitFrames: 9,
  exitOpacityFloor: 0,
  glideSeconds: 0.65,
  driftScale: 3.4,
  plainGranularity: true,
  maxEntranceFrames: 5,
  cameraWobble: { rotDeg: 2.1, zoomPct: 0.024, panPx: 20, periodSec: 2.2 },
  kick: { zoom: 1.16, pos: 0.14, rot: 3.2, settle: 8, soft: 1.07 },
  glideDip: { zoom: 0.68, rot: 42 },
  cameraSmoothing: { omega: 0.26, zeta: 0.82 },
  sparseKicks: true,
  wordDrift: 3.8,
  transitionColors: ["#4EFFB2", "#5B7CFF"],
  title: { color: "#D6F8FF", fontRole: "display", fontSize: 58, fontWeight: 400 },
  decorate: neonPlexusDecorate,
};

function buildNeonPlexusStoryboard(args) {
  return buildSceneStoryboard({ ...args, theme: NEON_PLEXUS_THEME });
}

const PASTEL_ED_LIGHT = {
  white: "#14151A",
  yellow: "#6E6BF5",
  purple: "#FF5A5F",
  pink: "#2D8A68",
  dim: "#76798C",
  echo: "rgba(20, 21, 26, 0.14)",
};

const PASTEL_ED_DARK = {
  white: "#FFFFFF",
  yellow: "#8EF0B0",
  purple: "#FFE46B",
  pink: "#FF785A",
  dim: "#B8BCCB",
  echo: "rgba(255, 255, 255, 0.2)",
};

const PASTEL_ED_STICKERS = [
  { bg: "#6E6BF5", fg: "#FFE46B" },
  { bg: "#FF6347", fg: "#FFFFFF" },
  { bg: "#8EF0B0", fg: "#14151A" },
  { bg: "#FFE46B", fg: "#14151A" },
];
const PASTEL_ED_BURST_COLORS = ["#8EF0B0", "#FFE46B", "#FF785A", "#6E6BF5", "#4DE3E8"];
const PASTEL_ED_SPOTS = [
  { x: -475, y: -270 },
  { x: 485, y: 265 },
  { x: -485, y: 270 },
  { x: 475, y: -275 },
];

/**
 * Pastel Editorial stage dressing inspired by m1hl4m light edits (Falling tears VN / Doi 52hz):
 * pastel bar labels, hairline radial spokes, organic coral bezier threads, concentric rings,
 * pastel scalloped bursts, depth-blurred crosses, and rotating pink clock hands.
 */
function pastelEditorialDecorate({ sc, si, graphics, words, prefix }) {
  const start = sc.start;
  const add = (node) => graphics.push({ startFrame: start, endFrame: sc.end, ...node });
  const at = (x, y) => ({ x: sc.cx + x, y: sc.cy + y });
  const rnd = (k) => {
    const x = Math.sin((si * 199 + k * 31 + 13) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  if (sc.kind === "breather") {
    // Clean studio breather with subtle foreground blurred crosses like Doi 52hz.
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-pe-x1`,
      shape: "crossMark",
      ...at(-470, -270),
      size: 92,
      color: "#FF5A5F",
      blurPx: 4,
      opacity: 0.72,
      rotateDeg: 14,
      zIndex: 0,
    });
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-pe-x2`,
      shape: "crossMark",
      ...at(480, 260),
      size: 64,
      color: "#6E6BF5",
      blurPx: 3,
      opacity: 0.62,
      rotateDeg: -18,
      zIndex: 0,
    });
    return;
  }

  // Pastel sticker backing bars with Vietnamese diacritic-safe height & dampened drift.
  sc.layout.items.forEach((it, idx) => {
    if (it.echo || it.sentence || it.hollow || it.role === "body") return;
    if (it.fs > 300 || (idx + si) % 3 !== 1) return;
    if (Math.abs(it.rot ?? 0) > 28 || it.text.length * it.fs * 0.54 + 88 > 470) return;
    const word = words.find((w) => w.id === `${prefix}-s${si}-w${idx}`);
    if (!word) return;
    const pair = PASTEL_ED_STICKERS[(si + idx) % PASTEL_ED_STICKERS.length];
    word.color = pair.fg;
    if (word.travel) {
      word.travel = {
        ...word.travel,
        dx: Math.round(Math.max(-10, Math.min(10, word.travel.dx))),
        dy: Math.round(Math.max(-6, Math.min(8, word.travel.dy))),
      };
    }
    if (word.kineticPush) {
      word.kineticPush = {
        ...word.kineticPush,
        dx: Math.round(word.kineticPush.dx * 0.5),
        dy: Math.round(Math.max(-8, word.kineticPush.dy * 0.4)),
      };
    }
    graphics.push({
      kind: "stickerBlock",
      id: `${prefix}-s${si}-stk${idx}`,
      startFrame: word.startFrame,
      endFrame: word.endFrame,
      x: word.x,
      y: Math.round(word.y - it.fs * 0.14),
      width: Math.round(it.text.length * it.fs * 0.54 + 88),
      height: Math.round(it.fs * 1.44),
      rotateDeg: it.rot,
      color: pair.bg,
      shadow: false,
      zIndex: 12,
    });
  });

  // Pastel filled scalloped starburst in outer corner.
  const spot = PASTEL_ED_SPOTS[si % PASTEL_ED_SPOTS.length];
  add({
    kind: "starburst",
    id: `${prefix}-s${si}-pe-burst`,
    ...at(spot.x, spot.y),
    radius: 105 + Math.round(rnd(1) * 32),
    points: 12,
    innerRatio: 0.74,
    fill: PASTEL_ED_BURST_COLORS[si % PASTEL_ED_BURST_COLORS.length],
    spinDegPerSec: si % 2 === 0 ? 14 : -14,
    zIndex: 0,
  });

  // Organic thin coral/red bezier thread weaving across an open edge.
  add({
    kind: "doodle",
    id: `${prefix}-s${si}-pe-thread`,
    shape: "bezierThread",
    ...at((si % 2 === 0 ? 1 : -1) * 260, (si % 3 === 0 ? -1 : 1) * 255),
    size: 380,
    color: sc.dark ? "#FF785A" : "#E63946",
    rotateDeg: (rnd(2) - 0.5) * 30,
    opacity: 0.85,
    zIndex: 1,
  });

  // Alternate between delicate hairline radial spokes and bold geometric concentric ring.
  const opp = PASTEL_ED_SPOTS[(si + 2) % PASTEL_ED_SPOTS.length];
  if (si % 2 === 0) {
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-pe-spokes`,
      shape: "fineSpokes",
      ...at(opp.x * 0.85, opp.y * 0.82),
      size: 270,
      color: sc.dark ? "#FFFFFF" : "#14151A",
      spinDegPerSec: 8,
      opacity: 0.55,
      zIndex: 0,
    });
  } else {
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-pe-ring`,
      shape: "concentricRing",
      ...at(opp.x * 0.72, opp.y * 0.72),
      size: 390,
      color: "#FFE46B",
      secondaryColor: "#E07A5F",
      spinDegPerSec: -5,
      opacity: 0.75,
      zIndex: 0,
    });
  }

  // Depth-of-field blurred corner X mark (Doi 52hz) on every 3rd scene.
  if (si % 3 === 0) {
    const c3 = PASTEL_ED_SPOTS[(si + 1) % PASTEL_ED_SPOTS.length];
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-pe-cross`,
      shape: "crossMark",
      ...at(c3.x, c3.y),
      size: 84,
      color: "#FF5A5F",
      blurPx: 4,
      opacity: 0.72,
      rotateDeg: (rnd(3) - 0.5) * 40,
      zIndex: 0,
    });
  }

  // Rotating hot-pink clock hands accent (Doi 52hz) on mid-song scenes.
  if (si % 5 === 2) {
    const c4 = PASTEL_ED_SPOTS[(si + 3) % PASTEL_ED_SPOTS.length];
    add({
      kind: "doodle",
      id: `${prefix}-s${si}-pe-clock`,
      shape: "clockHands",
      ...at(c4.x * 0.88, c4.y * 0.86),
      size: 230,
      color: "#FF2E63",
      secondaryColor: "#E03A68",
      phase: rnd(4),
      opacity: 0.9,
      glow: false,
      zIndex: 1,
    });
  }
  // Subtle 360-degree rotating editorial circular text ring around the concentric circle on select scenes.
  if (si % 4 === 1) {
    const opp = PASTEL_ED_SPOTS[(si + 2) % PASTEL_ED_SPOTS.length];
    const phraseText = sc.words.slice(0, 4).map((w) => w.text.toUpperCase()).join(" ");
    add({
      kind: "circularText",
      id: `${prefix}-s${si}-pe-circtext`,
      ...at(opp.x * 0.72, opp.y * 0.72),
      radius: 175,
      text: phraseText,
      fontSize: 22,
      fontRole: "body",
      color: sc.dark ? "#FFE46B" : "#6E6BF5",
      spinDegPerSec: 36,
      opacity: 0.68,
      glow: false,
      zIndex: 1,
    });
  }
}

const PASTEL_EDITORIAL_THEME = {
  stylePackId: "pastel-editorial-light",
  idPrefix: "ped",
  palette: (dark) => (dark ? PASTEL_ED_DARK : PASTEL_ED_LIGHT),
  isDark: (i, total) => total >= 6 && i / total >= 0.45 && i / total < 0.62,
  darkBg: "#121318",
  bokeh: false,
  polaroid: false,
  glow: false,
  hollowStroke: 2.5,
  cameraMode: "glide",
  continuous: true,
  fit: { halfW: 400, halfH: 300 },
  jitter: { pos: 135, rot: 9, size: 0.28 },
  dense: true,
  decorOverlap: 18,
  hardExit: true,
  ghostEcho: false,
  entrances: [
    ["slide-blur", "ltr"],
    ["slide-blur", "btt"],
    ["spin-360-y", undefined],
    ["slide-blur", "ttb"],
  ],
  heroEntrances: [
    ["spin-360-z", undefined],
    ["spin-360-y", undefined],
    ["roll-settle", undefined],
    ["char-spring", undefined],
  ],
  entranceFrames: {
    "roll-settle": 16,
    typewriter: 4,
    "slide-blur": 7,
    "char-spring": 11,
    "spin-360-y": 14,
    "spin-360-z": 13,
  },
  travel: { hero: 48, small: 36, rot: 6, heroGrow: 0.09, smallGrow: 0.06 },
  echoEntrance: ["pop", undefined],
  sentenceEntrance: ["typewriter", undefined],
  entryZoom: [1.75, 0.68, 1.5, 0.6, 1.85],
  entrySettle: 5,
  plainGranularity: true,
  maxEntranceFrames: 4,
  cameraWobble: { rotDeg: 1.6, zoomPct: 0.018, panPx: 18, periodSec: 2.5 },
  kick: { zoom: 1.14, pos: 0.12, rot: 2.4, settle: 8, soft: 1.05 },
  cameraSmoothing: { omega: 0.24, zeta: 0.86 },
  sparseKicks: true,
  wordDrift: 3.2,
  transitionColors: ["#6E6BF5", "#8EF0B0"],
  title: { color: "#14151A", fontRole: "display", fontSize: 60, fontWeight: 400 },
  decorate: pastelEditorialDecorate,
  reserved: (si, sc) => {
    if (sc.kind === "breather") return [];
    const spot = PASTEL_ED_SPOTS[si % PASTEL_ED_SPOTS.length];
    const out = [{ x: spot.x, y: spot.y, r: 155 }];
    if (si % 5 === 2) {
      const c4 = PASTEL_ED_SPOTS[(si + 3) % PASTEL_ED_SPOTS.length];
      out.push({ x: c4.x * 0.88, y: c4.y * 0.86, r: 130 });
    }
    return out;
  },
};

function buildPastelEditorialStoryboard(args) {
  return buildSceneStoryboard({ ...args, theme: PASTEL_EDITORIAL_THEME });
}

const STYLE_BUILDERS = {
  "hk-1999-halftone": buildHk1999Storyboard,
  "pop-collage-light": buildPopCollageStoryboard,
  "dreamy-glow-dark": buildDreamyGlowStoryboard,
  "neon-plexus-dark": buildNeonPlexusStoryboard,
  "pastel-editorial-light": buildPastelEditorialStoryboard,
};

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printUsage();
    return;
  }

  if (!opts.align) {
    printUsage();
    throw new Error("--align <path> is required");
  }
  if (!STYLE_IDS.includes(opts.style)) {
    throw new Error(
      `Unsupported --style "${opts.style}". Expected one of: ${STYLE_IDS.join(", ")}`
    );
  }
  if (opts.fps !== undefined && !ALLOWED_FPS.includes(opts.fps)) {
    throw new Error(
      `Unsupported --fps "${opts.fps}". Choose 24, 30, or 60 (120fps is excluded for social/Remotion delivery).`
    );
  }

  const targetFps = opts.fps ?? STYLE_DEFAULT_FPS[opts.style];

  const alignPath = path.resolve(opts.align);
  if (!fs.existsSync(alignPath)) {
    throw new Error(`Alignment file not found: ${alignPath}`);
  }
  const alignData = JSON.parse(fs.readFileSync(alignPath, "utf8"));

  if (!opts.allowUnreviewed && alignData.reviewed !== true) {
    const reviewGuess = alignPath.endsWith(".align.json")
      ? `${alignPath.slice(0, -".align.json".length)}.review.md`
      : `${alignPath}.review.md`;
    throw new Error(
      `Alignment file is not reviewed yet (reviewed !== true). Inspect "${reviewGuess}" and run \`pnpm run align:lyrics -- --apply-review "${reviewGuess}"\` first (or pass --allow-unreviewed to override).`
    );
  }

  let energyTrack;
  if (opts.energy) {
    const energyPath = path.resolve(opts.energy);
    if (!fs.existsSync(energyPath)) {
      throw new Error(`Energy file not found: ${energyPath}`);
    }
    energyTrack = JSON.parse(fs.readFileSync(energyPath, "utf8"));
  }

  const slug = deriveSlug(alignPath);
  const title = opts.title ?? slug.replace(/[-_]+/g, " ");
  const audioSrc = normalizeAudioSrc(alignData.audio, opts.audioSrc);

  const builder = STYLE_BUILDERS[opts.style];
  const storyboard = builder({
    alignData,
    energyTrack,
    targetFps,
    title,
    slug,
    audioSrc,
  });

  const outPath = path.resolve(
    opts.out ?? path.join("src", "storyboards", `${slug}.storyboard.json`)
  );
  const propsOutPath = path.resolve(
    opts.propsOut ?? path.join("src", "storyboards", `${slug}.props.json`)
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(path.dirname(propsOutPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(storyboard, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    propsOutPath,
    `${JSON.stringify(
      {
        storyboard,
        ...(energyTrack ? { energyTrack } : {}),
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `Generated ${opts.style} storyboard (${storyboard.words.length} word nodes, ${storyboard.graphics.length} graphics, ${storyboard.durationInFrames}f @ ${storyboard.fps}fps)`
  );
  console.log(`- storyboard: ${outPath}`);
  console.log(`- props:      ${propsOutPath}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
