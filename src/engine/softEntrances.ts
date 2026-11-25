import type { Storyboard, WordEntrance, WordNode, WordRevealDir } from "./types";

const HARD: WordEntrance[] = [
  "pop",
  "slam",
  "spring-pop",
  "slide-up",
  "mask-wipe",
  "tracking-expand",
  "glitch-reveal",
  "flip-spin",
];
const DIRS: WordRevealDir[] = ["ltr", "rtl", "btt", "ttb"];

/**
 * Mograph elements rarely appear instantly: they blur in from one side (or the top/bottom) and
 * sharpen while moving a little. Convert hard entrances to `slide-blur` with a direction picked
 * per word, but keep true one-frame hits (entranceDurationFrames <= 1) hard.
 */
export function softenEntrances(sb: Storyboard): Storyboard {
  const words = sb.words.map((w: WordNode, i): WordNode => {
    if (!HARD.includes(w.entrance)) return w;
    if ((w.entranceDurationFrames ?? 99) <= 1) return w;
    if (w.endFrame - w.startFrame < 4) return w;
    const h =
      Math.abs(Math.sin((w.startFrame * 31 + i * 17 + w.fontSize) * 12.9898) * 43758.5453) % 1;
    const leaves =
      w.exitStyle === undefined || w.exitStyle === "cut"
        ? { exitStyle: "slide-out" as const, exitDurationFrames: Math.max(4, Math.round(sb.fps * 0.2)) }
        : {};
    return {
      ...w,
      ...leaves,
      entrance: "slide-blur",
      revealDir: DIRS[Math.floor(h * 4) % 4],
      entranceDurationFrames: Math.max(6, Math.round(sb.fps * 0.3)),
    };
  });
  return { ...sb, words };
}
