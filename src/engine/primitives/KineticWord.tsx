import type { CSSProperties } from "react";
import { spring } from "remotion";
import { applyEasing, lerp } from "../easing";
import type { StylePackConfig, WordNode, WordTimingCue } from "../types";

interface KineticWordProps {
  node: WordNode;
  stylePack: StylePackConfig;
  frame: number;
  fps?: number;
  bassEnergy: number;
  isBeat: boolean;
}

function resolveFontFamily(
  node: WordNode,
  stylePack: StylePackConfig
): string {
  if (node.fontRole === "display") {
    return node.useNarrowDisplay
      ? stylePack.fonts.displayNarrow
      : stylePack.fonts.display;
  }
  if (node.fontRole === "serif") {
    return stylePack.fonts.serif;
  }
  return stylePack.fonts.body;
}

function resolveDefaultWeight(node: WordNode): number {
  if (node.fontWeight !== undefined) {
    return node.fontWeight;
  }
  if (node.fontRole === "display") {
    return node.useNarrowDisplay ? 700 : 400;
  }
  if (node.fontRole === "serif") {
    return 700;
  }
  return 700;
}

function splitGraphemes(text: string): string[] {
  const SegmenterCtor = (
    Intl as unknown as {
      Segmenter?: new (
        locales?: string | string[],
        options?: { granularity: "grapheme" | "word" | "sentence" }
      ) => { segment(input: string): Iterable<{ segment: string }> };
    }
  ).Segmenter;

  if (typeof SegmenterCtor === "function") {
    const segmenter = new SegmenterCtor(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (item) => item.segment);
  }
  return [...text];
}

function computeStaggeredPeel(
  idx: number,
  total: number,
  exitElapsed: number,
  exitFrames: number
): { peelPct: number; peelOpacity: number } {
  const rawStep = Math.max(0.6, (exitFrames * 0.45) / Math.max(1, total));
  const maxTotalStagger = exitFrames * 0.55;
  const step =
    total > 1 ? Math.min(rawStep, maxTotalStagger / (total - 1)) : 0;
  const span = Math.max(1.2, exitFrames - (total - 1) * step);
  const t = Math.min(1, Math.max(0, (exitElapsed - idx * step) / span));
  const ease = t * t * (0.5 + 0.5 * t);
  return {
    peelPct: -115 * ease,
    peelOpacity: Math.max(0, 1 - ease * 1.15),
  };
}

function buildSweepMaskClip(
  mode: "reveal" | "exit",
  dir: "ltr" | "rtl" | "ttb" | "btt",
  t: number
): string | undefined {
  if (mode === "reveal" && t >= 0.999) {
    return undefined;
  }
  const pct = mode === "reveal" ? (1 - t) * 100 : t * 100;
  const edge =
    mode === "reveal"
      ? dir
      : dir === "ltr"
      ? "rtl"
      : dir === "rtl"
      ? "ltr"
      : dir === "ttb"
      ? "btt"
      : "ttb";
  if (edge === "ltr") return `inset(-60% ${pct.toFixed(1)}% -60% -12%)`;
  if (edge === "rtl") return `inset(-60% -12% -60% ${pct.toFixed(1)}%)`;
  if (edge === "ttb") return `inset(-60% -12% ${pct.toFixed(1)}% -12%)`;
  return `inset(${pct.toFixed(1)}% -12% -60% -12%)`;
}

function buildSweepBarNode(
  dir: "ltr" | "rtl" | "ttb" | "btt",
  t: number,
  thicknessPx: number,
  barColor: string,
  barOpacity: number
): React.ReactNode {
  if (barOpacity <= 0.02) {
    return null;
  }
  const posPct =
    dir === "ltr" || dir === "ttb" ? t * 100 : (1 - t) * 100;
  const isHorizontal = dir === "ltr" || dir === "rtl";
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        ...(isHorizontal
          ? {
              left: `${posPct.toFixed(1)}%`,
              top: "-6%",
              bottom: "-6%",
              width: thicknessPx,
              transform: "translateX(-50%)",
            }
          : {
              top: `${posPct.toFixed(1)}%`,
              left: "-4%",
              right: "-4%",
              height: thicknessPx,
              transform: "translateY(-50%)",
            }),
        backgroundColor: barColor,
        boxShadow: `0 0 14px ${barColor}`,
        borderRadius: thicknessPx,
        opacity: barOpacity,
        pointerEvents: "none",
      }}
    />
  );
}

export const KineticWord = ({
  node,
  stylePack,
  frame,
  fps = 24,
  bassEnergy,
  isBeat,
}: KineticWordProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const totalFrames = Math.max(1, node.endFrame - node.startFrame);
  const defaultEntFrames =
    node.entrance === "mask-glide"
      ? Math.round(8 * fpsScale)
      : Math.round(6 * fpsScale);
  const entFrames = Math.max(1, node.entranceDurationFrames ?? defaultEntFrames);
  const rawT = Math.min(1, localFrame / entFrames);

  let opacity = 1;
  let extraScaleX = 1;
  let extraScaleY = 1;
  let extraTranslateX = 0;
  let extraTranslateY = 0;
  let extraRotateDeg = 0;
  let extraRotateX = 0;
  let extraRotateY = 0;
  let clipPath: string | undefined;
  let extraLetterSpacingEm = 0;
  let enterBlurPx = 0;
  let exitBlurPx = 0;

  switch (node.entrance) {
    case "pop": {
      const t = Math.min(1, (localFrame + 1.2 * fpsScale) / entFrames);
      const e = applyEasing(t, "backOut");
      const s = lerp(0.55, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      opacity = Math.min(1, (localFrame + 2 * fpsScale) / (3 * fpsScale));
      break;
    }
    case "slam": {
      const t = Math.min(1, (localFrame + 0.8 * fpsScale) / entFrames);
      const e = applyEasing(t, "expoOut");
      const s = lerp(1.42, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      extraTranslateY = lerp(-14, 0, e);
      opacity = localFrame < fpsScale ? 0.85 : 1;
      break;
    }
    case "slide-up": {
      const t = Math.min(1, (localFrame + 1 * fpsScale) / entFrames);
      const e = applyEasing(t, "expoOut");
      extraTranslateY = lerp(48, 0, e);
      opacity = Math.min(1, (localFrame + 2 * fpsScale) / (3 * fpsScale));
      break;
    }
    case "blur-pop": {
      // Clean entrance after the reference: lands slightly oversize and out of focus, then
      // settles sharp. No clipping, so no chopped letters and no lost diacritics.
      const t = Math.min(1, (localFrame + 1 * fpsScale) / entFrames);
      const e = applyEasing(t, "expoOut");
      // Two hero settles seen in the reference: tilt +18deg with 1.15x, or a straight 1.45x.
      const variantSeed = Math.floor(Math.abs(node.x * 0.37 + node.y * 0.11)) % 3;
      const startScale = variantSeed === 0 ? 1.45 : 1.15;
      const startTilt = variantSeed === 0 ? 0 : variantSeed === 1 ? 18 : -18;
      const s = lerp(startScale, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      extraRotateDeg = lerp(startTilt, 0, e);
      opacity = 1;
      enterBlurPx = (1 - e) * 8;
      break;
    }
    case "fade-focus": {
      // The reference's default word: 15% -> 100% opacity while a ~5px blur clears. No slide.
      const t = Math.min(1, (localFrame + 1) / entFrames);
      const e = applyEasing(t, "cubicOut");
      opacity = lerp(0.15, 1, e);
      enterBlurPx = (1 - e) * 5;
      extraScaleX = lerp(1.04, 1, e);
      extraScaleY = lerp(1.04, 1, e);
      break;
    }
    case "hero-rise": {
      // Giant word rises from ~30% of the frame height in 4 frames, fully opaque, motion blurred.
      const t = Math.min(1, (localFrame + 1) / entFrames);
      const e = applyEasing(t, "expoOut");
      extraTranslateY = lerp(270, 0, e);
      opacity = 1;
      enterBlurPx = (1 - e) * 5;
      break;
    }
    case "typewriter": {
      // Letters appear instantly, no fade; drawn by the per-letter branch below.
      opacity = 1;
      break;
    }
    case "char-spring": {
      // Every letter has its own spring; drawn by the per-letter branch below.
      opacity = 1;
      break;
    }
    case "slide-blur": {
      // Blurs in from one side (or top/bottom), stretched along the travel axis, then sharpens
      // while settling a short distance later. Never an instant appearance.
      const t = Math.min(1, (localFrame + 0.5) / entFrames);
      const e = applyEasing(t, "expoOut");
      const dir = node.revealDir ?? "ltr";
      const dist = (1 - e) * 130;
      const stretch = 1 + (1 - e) * 0.3;
      const squash = 1 - (1 - e) * 0.08;
      if (dir === "ltr" || dir === "rtl") {
        extraTranslateX = dir === "ltr" ? -dist : dist;
        extraScaleX = stretch;
        extraScaleY = squash;
      } else {
        extraTranslateY = dir === "ttb" ? -dist : dist;
        extraScaleY = stretch;
        extraScaleX = squash;
      }
      opacity = lerp(0, 1, Math.min(1, e * 1.5));
      enterBlurPx = (1 - e) * 18;
      break;
    }
    case "spin-360-y": {
      // 360-degree 3D Y-axis coin-flip spin (Vu tru co anh / Tai che con tim):
      // briefly reveals the mirrored back face at -180deg with edge-on blur peaking at 90/270deg.
      const t = Math.min(1, (localFrame + 0.8) / entFrames);
      const e = applyEasing(t, "expoOut");
      const deg = lerp(-360, 0, e);
      extraRotateY = deg;
      const s = lerp(0.76, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      opacity = Math.min(1, (localFrame + 1.5) / 3);
      enterBlurPx = Math.abs(Math.sin((deg * Math.PI) / 180)) * 5.2 * (1 - e * 0.35);
      break;
    }
    case "spin-360-x": {
      // 360-degree 3D X-axis pitch-up tumble from flat perspective to upright.
      const t = Math.min(1, (localFrame + 0.8) / entFrames);
      const e = applyEasing(t, "expoOut");
      const deg = lerp(-360, 0, e);
      extraRotateX = deg;
      const s = lerp(0.8, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      opacity = Math.min(1, (localFrame + 1.5) / 3);
      enterBlurPx = Math.abs(Math.sin((deg * Math.PI) / 180)) * 4.8 * (1 - e * 0.35);
      break;
    }
    case "spin-360-z": {
      // Full 360-degree Z-axis whip-spin into place with radial motion blur.
      const t = Math.min(1, (localFrame + 0.8) / entFrames);
      const e = applyEasing(t, "expoOut");
      extraRotateDeg = lerp(-360, 0, e);
      const s = lerp(0.62, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      opacity = Math.min(1, (localFrame + 1.5) / 3);
      enterBlurPx = (1 - e) * 6.5;
      break;
    }
    case "tilt-in": {
      // Enters rotated about -28deg at 0.9x and unwinds to upright, ease-out with no overshoot.
      const t = Math.min(1, (localFrame + 1) / entFrames);
      const e = applyEasing(t, "expoOut");
      extraRotateDeg = lerp(-28, 0, e);
      extraScaleX = lerp(0.9, 1, e);
      extraScaleY = lerp(0.9, 1, e);
      opacity = Math.min(1, (localFrame + 1) / 2);
      break;
    }
    case "unfold": {
      // Pure vertical unfold: a thin bar opens to full height in a couple of frames.
      const t = Math.min(1, (localFrame + 1) / entFrames);
      extraScaleY = lerp(0.1, 1, applyEasing(t, "cubicOut"));
      opacity = 1;
      break;
    }
    case "roll-settle": {
      // Rolls from a tilt to rest while shrinking from 1.7x, like the reference's HAY?
      const t = Math.min(1, (localFrame + 1) / entFrames);
      const e = applyEasing(t, "expoOut");
      const tilt = (Math.floor(Math.abs(node.x * 0.21 + node.y * 0.07)) % 2 === 0 ? -1 : 1) * 32;
      const s = lerp(1.7, 1, e);
      extraScaleX = s;
      extraScaleY = s;
      extraRotateDeg = lerp(tilt, 0, e);
      opacity = Math.min(1, (localFrame + 1) / 2);
      break;
    }
    case "rise-fade": {
      // Slides up from just below its spot while fading and focusing in.
      const t = Math.min(1, (localFrame + 1 * fpsScale) / entFrames);
      const e = applyEasing(t, "expoOut");
      extraTranslateY = lerp(54, 0, e);
      opacity = Math.min(1, (localFrame + 1.5 * fpsScale) / (3 * fpsScale));
      enterBlurPx = (1 - e) * 5;
      break;
    }
    case "mask-wipe": {
      const t = Math.min(1, (localFrame + 1.4 * fpsScale) / entFrames);
      const e = applyEasing(t, "expoOut");
      if (e < 0.999) {
        const rightPct = (1 - e) * 100;
        clipPath = `inset(-60% ${rightPct.toFixed(1)}% -60% -10%)`;
      }
      extraTranslateX = lerp(-22, 0, e);
      opacity = localFrame < fpsScale ? 0.82 : 1;
      break;
    }
    case "flip-spin": {
      const t = Math.min(1, (localFrame + 1 * fpsScale) / entFrames);
      const e = applyEasing(t, "backOut");
      extraRotateDeg = lerp(-48, 0, e);
      extraScaleX = lerp(0.45, 1, e);
      extraScaleY = lerp(0.65, 1, e);
      opacity = Math.min(1, (localFrame + 2 * fpsScale) / (3 * fpsScale));
      break;
    }
    case "glitch-reveal": {
      if (rawT < 1) {
        const step = Math.floor(localFrame / fpsScale);
        const jitter = Math.sin(step * 11.7) * (1 - rawT) * 18;
        extraTranslateX = jitter;
        extraTranslateY = Math.cos(step * 7.3) * (1 - rawT) * 7;
        opacity = step % 2 === 0 ? 0.68 : 1;
      }
      break;
    }
    case "tracking-expand": {
      const t = Math.min(1, (localFrame + 1.5 * fpsScale) / entFrames);
      const e = applyEasing(t, "cubicOut");
      extraLetterSpacingEm = lerp(0.28, 0, e);
      opacity = Math.min(1, 0.75 + e * 0.25);
      break;
    }
    case "spring-pop": {
      const sp = spring({
        frame: localFrame + Math.max(1, Math.round(fpsScale)),
        fps,
        config: { damping: 12, stiffness: 210, mass: 0.72 },
      });
      const s = lerp(0.62, 1, sp);
      extraScaleX = s;
      extraScaleY = s;
      opacity = Math.min(1, 0.78 + sp * 0.22);
      break;
    }
    case "baseline-mask": {
      if (node.variant !== "solid") {
        const sp = spring({
          frame: localFrame + Math.max(1, Math.round(fpsScale)),
          fps,
          config: { damping: 16, stiffness: 220, mass: 0.7 },
        });
        extraTranslateY = lerp(28, 0, sp);
      }
      opacity = Math.min(1, 0.85 + localFrame * 0.15);
      break;
    }
    case "mask-glide": {
      const t = Math.min(1, (localFrame + 1 * fpsScale) / entFrames);
      const e = applyEasing(t, "expoOut");
      const dir = node.revealDir ?? "ltr";
      if (dir === "ltr") {
        if (e < 0.999) {
          clipPath = `inset(-60% ${((1 - e) * 100).toFixed(1)}% -60% -12%)`;
        }
        extraTranslateX = lerp(-44, 0, e);
      } else if (dir === "rtl") {
        if (e < 0.999) {
          clipPath = `inset(-60% -12% -60% ${((1 - e) * 100).toFixed(1)}%)`;
        }
        extraTranslateX = lerp(44, 0, e);
      } else if (dir === "btt") {
        if (e < 0.999) {
          clipPath = `inset(-60% -12% ${((1 - e) * 100).toFixed(1)}% -12%)`;
        }
        extraTranslateY = lerp(44, 0, e);
      } else if (dir === "ttb") {
        if (e < 0.999) {
          clipPath = `inset(${((1 - e) * 100).toFixed(1)}% -12% -60% -12%)`;
        }
        extraTranslateY = lerp(-44, 0, e);
      } else {
        if (e < 0.999) {
          const half = ((1 - e) * 50).toFixed(1);
          clipPath = `inset(-60% ${half}% -60% ${half}%)`;
        }
        extraScaleX = lerp(0.88, 1, e);
        extraLetterSpacingEm = lerp(0.16, 0, e);
      }
      opacity = lerp(0.2, 1, Math.min(1, e * 1.25));
      enterBlurPx = (1 - e) * 3.2;
      break;
    }
    case "char-wave": {
      if (node.variant !== "solid") {
        const sp = spring({
          frame: localFrame + Math.max(1, Math.round(fpsScale)),
          fps,
          config: { damping: 15, stiffness: 230, mass: 0.68 },
        });
        extraTranslateY = lerp(34, 0, sp);
        opacity = Math.min(1, 0.25 + sp * 0.75);
        enterBlurPx = Math.max(0, (1 - sp) * 2.4);
      }
      break;
    }
  }

  // Living drift keeps held typography organically alive instead of static.
  if (node.livingDrift !== false && totalFrames > 1) {
    const lifeProgress = Math.min(1, localFrame / totalFrames);
    const strength = node.driftStrength ?? 1;
    const driftScale = 1 + lifeProgress * 0.025 * strength;
    extraScaleX *= driftScale;
    extraScaleY *= driftScale;
    extraTranslateY -= lifeProgress * 4 * strength;
    if (strength > 1) {
      // Gentle sway so a held word keeps moving: tilt and float, phase set by position.
      const tSec = frame / Math.max(1, fps);
      const seed = (node.x * 0.013 + node.y * 0.007) % (Math.PI * 2);
      extraRotateDeg += Math.sin((tSec * Math.PI * 2) / 1.9 + seed) * 0.7 * (strength - 1);
      extraTranslateX += Math.sin((tSec * Math.PI * 2) / 2.4 + seed * 1.7) * 5 * (strength - 1);
      extraTranslateY += Math.cos((tSec * Math.PI * 2) / 2.1 + seed) * 4 * (strength - 1);
    }
  }

  // Travel: the word keeps moving for its whole life (drift, tilt and growth), eased so it
  // coasts to a stop instead of sitting frozen.
  if (node.travel && totalFrames > 1) {
    const life = Math.min(1, localFrame / totalFrames);
    const eased = 1 - Math.pow(1 - life, 2.2);
    const p = 0.7 * eased + 0.3 * life;
    extraTranslateX += node.travel.dx * p;
    extraTranslateY += node.travel.dy * p;
    extraRotateDeg += node.travel.rot * p;
    const grow = 1 + node.travel.scale * p;
    extraScaleX *= grow;
    extraScaleY *= grow;
  }

  // Physical recoil when an adjacent word or graphic enters nearby.
  if (node.kineticPush && frame >= node.kineticPush.triggerFrame) {
    const pushSp = spring({
      frame: frame - node.kineticPush.triggerFrame,
      fps,
      config: { damping: 14, stiffness: 200, mass: 0.75 },
    });
    extraTranslateX += node.kineticPush.dx * pushSp;
    extraTranslateY += node.kineticPush.dy * pushSp;
    const defaultPushRot =
      node.kineticPush.dx !== 0 ? (node.kineticPush.dx > 0 ? 1.5 : -1.5) : 0;
    extraRotateDeg += (node.kineticPush.rotateDeg ?? defaultPushRot) * pushSp;
  }

  // Optional ease-in or coupled directional wipe exit for smooth release before unmount.
  const exitStyle = node.exitStyle ?? "cut";
  const isMaskOrPeelExit =
    exitStyle === "mask-wipe-left" ||
    exitStyle === "mask-wipe-right" ||
    exitStyle === "mask-wipe-up" ||
    exitStyle === "mask-wipe-down" ||
    exitStyle === "split-close" ||
    exitStyle === "char-peel" ||
    exitStyle === "slide-out";
  const exitFrames =
    exitStyle !== "cut"
      ? node.exitDurationFrames ??
        (isMaskOrPeelExit
          ? Math.max(4, Math.round(0.22 * fps))
          : Math.max(2, Math.round(0.11 * fps)))
      : node.sweepExit
      ? node.exitDurationFrames ?? Math.max(4, Math.round(0.22 * fps))
      : 0;
  const remaining = node.endFrame - frame;
  if (exitStyle !== "cut" && remaining <= exitFrames) {
    const exitT = Math.min(
      1,
      Math.max(0, (exitFrames - remaining + 1) / Math.max(1, exitFrames))
    );
    const easeIn = exitT * exitT * (0.5 + 0.5 * exitT);
    const effectiveExitStyle =
      exitStyle === "char-peel" && node.variant !== "solid"
        ? "mask-wipe-up"
        : exitStyle;

    if (effectiveExitStyle === "ease-in-pop") {
      const s = lerp(1, 0.84, easeIn);
      extraScaleX *= s;
      extraScaleY *= s;
      exitBlurPx = easeIn * 4;
      opacity *= lerp(1, node.exitOpacityFloor ?? 0.05, easeIn);
    } else if (effectiveExitStyle === "ease-in-slide") {
      extraTranslateY += easeIn * 20;
      opacity *= lerp(1, 0.15, easeIn);
    } else if (effectiveExitStyle === "mask-wipe-left") {
      clipPath = `inset(-60% -12% -60% ${(easeIn * 100).toFixed(1)}%)`;
      extraTranslateX -= easeIn * 46;
      exitBlurPx = easeIn * 3.0;
      opacity *= lerp(1, 0.25, easeIn);
    } else if (effectiveExitStyle === "mask-wipe-right") {
      clipPath = `inset(-60% ${(easeIn * 100).toFixed(1)}% -60% -12%)`;
      extraTranslateX += easeIn * 46;
      exitBlurPx = easeIn * 3.0;
      opacity *= lerp(1, 0.25, easeIn);
    } else if (effectiveExitStyle === "mask-wipe-up") {
      clipPath = `inset(${(easeIn * 100).toFixed(1)}% -12% -60% -12%)`;
      extraTranslateY -= easeIn * 38;
      exitBlurPx = easeIn * 2.8;
      opacity *= lerp(1, 0.25, easeIn);
    } else if (effectiveExitStyle === "mask-wipe-down") {
      clipPath = `inset(-60% -12% ${(easeIn * 100).toFixed(1)}% -12%)`;
      extraTranslateY += easeIn * 38;
      exitBlurPx = easeIn * 2.8;
      opacity *= lerp(1, 0.25, easeIn);
    } else if (effectiveExitStyle === "split-close") {
      const half = (easeIn * 50).toFixed(1);
      clipPath = `inset(-60% ${half}% -60% ${half}%)`;
      extraScaleX *= lerp(1, 0.9, easeIn);
      exitBlurPx = easeIn * 2.8;
      opacity *= lerp(1, 0.2, easeIn);
    } else if (effectiveExitStyle === "slide-out") {
      // Mirror of slide-blur: leaves through the opposite side, stretching along the travel axis,
      // blurring and fading as it goes, accelerating away.
      const dir = node.revealDir ?? "ltr";
      const accel = easeIn * easeIn;
      const dist = accel * 150;
      const stretch = 1 + accel * 0.3;
      const squash = 1 - accel * 0.08;
      if (dir === "ltr" || dir === "rtl") {
        extraTranslateX += dir === "ltr" ? dist : -dist;
        extraScaleX *= stretch;
        extraScaleY *= squash;
      } else {
        extraTranslateY += dir === "ttb" ? dist : -dist;
        extraScaleY *= stretch;
        extraScaleX *= squash;
      }
      exitBlurPx = Math.max(exitBlurPx, accel * 16);
      opacity *= lerp(1, node.exitOpacityFloor ?? 0, easeIn);
    } else if (effectiveExitStyle === "fly-out") {
      // Leaves with acceleration along a per-word direction while tilting and softening,
      // like it was thrown, instead of fading in place.
      const ang = (Math.abs(node.x * 0.013 + node.y * 0.029) % 1) * Math.PI * 2;
      const accel = exitT * exitT;
      extraTranslateX += Math.cos(ang) * 240 * accel;
      extraTranslateY += Math.sin(ang) * 170 * accel - 30 * exitT;
      extraRotateDeg += (Math.cos(ang) >= 0 ? 1 : -1) * 14 * accel;
      const s = 1 + 0.16 * accel;
      extraScaleX *= s;
      extraScaleY *= s;
      exitBlurPx = accel * 5;
      opacity *= lerp(1, node.exitOpacityFloor ?? 0.05, easeIn);
    } else if (effectiveExitStyle === "char-peel") {
      exitBlurPx = easeIn * 1.4;
    }
  }

  if (node.exitFadeFrames && node.exitFadeFrames > 0) {
    if (remaining < node.exitFadeFrames) {
      opacity *= Math.max(0, remaining / node.exitFadeFrames);
    }
  }

  const beatScale = node.beatReactive
    ? 1 + (isBeat ? 0.055 : bassEnergy * 0.025)
    : 1;

  const baseScaleX = (node.scaleX ?? 1) * extraScaleX * beatScale;
  const baseScaleY = (node.scaleY ?? 1) * extraScaleY * beatScale;
  const rotateDeg = (node.rotateDeg ?? 0) + extraRotateDeg;
  const align = node.align ?? "center";
  const alignX = align === "left" ? "0%" : align === "right" ? "-100%" : "-50%";

  const fontFamily = resolveFontFamily(node, stylePack);
  const fontWeight = resolveDefaultWeight(node);

  const chromaticPx =
    typeof node.chromatic === "number"
      ? node.chromatic
      : node.chromatic
      ? stylePack.postFx.chromaticShiftPx
      : 0;

  const fillColor = node.color ?? stylePack.palette.textPrimary;
  const strokeColor = node.strokeColor ?? node.color ?? stylePack.palette.primary;
  const strokeWidth =
    node.strokeWidth ?? Math.max(1.8, Number((node.fontSize * 0.026).toFixed(1)));

  const glowShadow =
    stylePack.postFx.glowStrengthPx > 0
      ? `0 0 ${stylePack.postFx.glowStrengthPx}px ${stylePack.palette.glowColor}`
      : undefined;

  const chromaticTextShadow =
    chromaticPx > 0
      ? `${-chromaticPx}px 0 0 ${stylePack.palette.accent}, ${chromaticPx}px 0 0 ${stylePack.palette.primary}`
      : undefined;

  const deepGlowShadow = node.deepGlow
    ? `0 0 8px ${fillColor}, 0 0 28px ${stylePack.palette.glowColor}`
    : undefined;

  const combinedShadow = [chromaticTextShadow, glowShadow, deepGlowShadow]
    .filter(Boolean)
    .join(", ");

  const computedLetterSpacing =
    extraLetterSpacingEm > 0
      ? `calc(${node.letterSpacing ?? "0em"} + ${extraLetterSpacingEm.toFixed(3)}em)`
      : node.letterSpacing;

  const sharedTextStyle: CSSProperties = {
    fontFamily,
    fontWeight,
    fontSize: node.fontSize,
    lineHeight: 1.18,
    letterSpacing: computedLetterSpacing,
    whiteSpace: "nowrap",
    display: "inline-block",
    padding: "0.24em 0.14em",
    overflow: "visible",
    userSelect: "none",
    // Halo strokes are drawn outside the glyph so the letter shape is not eaten.
    ...(node.haloColor ? { paintOrder: "stroke fill" as const } : {}),
  };

  let content: React.ReactNode = null;

  const isWordSyncedMode =
    node.variant === "solid" &&
    (node.granularity === "word" ||
      (Array.isArray(node.wordTimings) && node.wordTimings.length > 0));
  const isCharMode =
    node.variant === "solid" &&
    !isWordSyncedMode &&
    (node.granularity === "char" ||
      node.entrance === "char-wave" ||
      exitStyle === "char-peel");
  const isSentenceLineMode =
    node.variant === "solid" &&
    !isWordSyncedMode &&
    !isCharMode &&
    node.granularity === "sentence" &&
    node.text.includes("\n");

  const flexAlign =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const leadFrames = Math.max(1, Math.round(fpsScale));
  const exitElapsed = exitFrames - remaining + 1;
  const strokeDecl =
    node.strokeWidth && node.strokeColor
      ? `${node.strokeWidth}px ${node.strokeColor}`
      : node.haloColor
      ? `${(node.haloWidth ?? 4) * 2}px ${node.haloColor}`
      : undefined;

  if (isWordSyncedMode) {
    const wordStepFallback = Math.max(1, Math.round(0.055 * fps));
    const cues: WordTimingCue[] =
      node.wordTimings && node.wordTimings.length > 0
        ? node.wordTimings
        : node.text.split(/\s+/).filter(Boolean).map((text, idx) => ({
            text,
            startFrame: node.startFrame + idx * wordStepFallback,
          }));
    const useWordExitPeel = exitStyle === "char-peel" && remaining <= exitFrames;

    content = (
      <span
        aria-label={node.text}
        style={{
          display: "inline-flex",
          flexWrap: node.maxWidthPx ? "wrap" : "nowrap",
          maxWidth: node.maxWidthPx,
          justifyContent: flexAlign,
          alignItems: "baseline",
          columnGap: "0.34em",
          rowGap: "0.08em",
          userSelect: "none",
        }}
      >
        {cues.map((item, idx) => {
          const wordLocal = frame - item.startFrame;
          let risePct = 115;
          let wordScale = 1;
          let wordOpacity = 0;

          if (wordLocal >= 0) {
            const sp = spring({
              frame: wordLocal + leadFrames,
              fps,
              config: { damping: 14, stiffness: 225, mass: 0.7 },
            });
            risePct = (1 - sp) * 112;
            wordScale = item.emphasis
              ? lerp(0.84, 1.08, sp)
              : lerp(0.92, 1, sp);
            wordOpacity = Math.min(1, sp * 1.45);
          }

          let peelPct = 0;
          let peelOpacity = 1;
          if (useWordExitPeel) {
            const peel = computeStaggeredPeel(
              idx,
              cues.length,
              exitElapsed,
              exitFrames
            );
            peelPct = peel.peelPct;
            peelOpacity = peel.peelOpacity;
          }

          const wordColor = item.emphasis
            ? item.color ?? stylePack.palette.highlight
            : item.color ?? fillColor;
          const wordShadow = item.emphasis
            ? [
                combinedShadow,
                `0 0 10px ${wordColor}, 0 0 26px ${stylePack.palette.glowColor}`,
              ]
                .filter(Boolean)
                .join(", ")
            : combinedShadow;

          return (
            <span
              key={idx}
              aria-hidden
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
                padding: "0.5em 0.04em",
                margin: "-0.5em 0",
              }}
            >
              <span
                style={{
                  ...sharedTextStyle,
                  padding: 0,
                  color: wordColor,
                  WebkitTextStroke: strokeDecl,
                  textShadow: wordShadow || undefined,
                  opacity: wordOpacity * peelOpacity,
                  transform: `translateY(${(risePct + peelPct).toFixed(
                    1
                  )}%) scale(${wordScale.toFixed(4)})`,
                  transformOrigin: "center bottom",
                }}
              >
                {item.text}
              </span>
            </span>
          );
        })}
      </span>
    );
  } else if (isCharMode) {
    const chars = splitGraphemes(node.text);
    const useCharEntrance =
      node.entrance === "char-wave" || node.granularity === "char";
    const useCharExit = exitStyle === "char-peel" && remaining <= exitFrames;
    const stepDelay = Math.max(1, Math.round(0.028 * fps));

    content = (
      <span
        aria-label={node.text}
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {chars.map((ch, idx) => {
          let risePct = 0;
          let charRotDeg = 0;
          let charOpacity = 1;

          if (useCharEntrance) {
            const sp = spring({
              frame: Math.max(0, localFrame + leadFrames - idx * stepDelay),
              fps,
              config: { damping: 15, stiffness: 230, mass: 0.68 },
            });
            risePct = (1 - sp) * 115;
            charRotDeg = (1 - sp) * 6;
            charOpacity = Math.min(1, sp * 1.4);
          }

          let peelPct = 0;
          let peelOpacity = 1;
          if (useCharExit) {
            const peel = computeStaggeredPeel(
              idx,
              chars.length,
              exitElapsed,
              exitFrames
            );
            peelPct = peel.peelPct;
            peelOpacity = peel.peelOpacity;
          }

          const combinedTranslateYPct = risePct + peelPct;
          const combinedOpacity = charOpacity * peelOpacity;

          return (
            <span
              key={idx}
              aria-hidden
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
                padding: "0.5em 0.03em",
                margin: "-0.5em -0.03em",
              }}
            >
              <span
                style={{
                  ...sharedTextStyle,
                  padding: 0,
                  color: fillColor,
                  WebkitTextStroke: strokeDecl,
                  textShadow: combinedShadow || undefined,
                  opacity: combinedOpacity,
                  transform: `translateY(${combinedTranslateYPct.toFixed(
                    1
                  )}%) rotate(${charRotDeg.toFixed(2)}deg)`,
                  transformOrigin: "center bottom",
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            </span>
          );
        })}
      </span>
    );
  } else if (isSentenceLineMode) {
    const lines = node.text.split("\n");
    const lineStep = Math.max(1, Math.round(0.06 * fps));

    content = (
      <span
        aria-label={node.text}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: flexAlign,
          gap: "0.08em",
          maxWidth: node.maxWidthPx,
          userSelect: "none",
        }}
      >
        {lines.map((line, idx) => {
          const sp = spring({
            frame: Math.max(0, localFrame + leadFrames - idx * lineStep),
            fps,
            config: { damping: 16, stiffness: 215, mass: 0.72 },
          });
          const risePct = (1 - sp) * 112;
          const lineOpacity = Math.min(1, sp * 1.4);
          return (
            <span
              key={idx}
              aria-hidden
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
                padding: "0.5em 0.08em",
                margin: "-0.5em -0.08em",
                maxWidth: node.maxWidthPx,
              }}
            >
              <span
                style={{
                  ...sharedTextStyle,
                  padding: 0,
                  whiteSpace: node.maxWidthPx ? "normal" : "nowrap",
                  textAlign: align,
                  color: fillColor,
                  WebkitTextStroke: strokeDecl,
                  textShadow: combinedShadow || undefined,
                  opacity: lineOpacity,
                  transform: `translateY(${risePct.toFixed(1)}%)`,
                }}
              >
                {line}
              </span>
            </span>
          );
        })}
      </span>
    );
  } else if (node.variant === "solid" && node.entrance === "char-spring") {
    // Letters spring in one after another with overshoot, tilt and scale. No clipping box, so
    // accents and tall glyphs are never cut.
    const chars = splitGraphemes(node.text);
    const stagger = Math.max(1, Math.round(0.04 * fps));
    content = (
      <span
        aria-label={node.text}
        style={{
          ...sharedTextStyle,
          maxWidth: node.maxWidthPx,
          whiteSpace: node.maxWidthPx ? "normal" : "nowrap",
          textAlign: align,
          color: fillColor,
          WebkitTextStroke: strokeDecl,
          textShadow: combinedShadow || undefined,
        }}
      >
        {chars.map((ch, idx) => {
          const sp = spring({
            frame: Math.max(0, localFrame + 1 - idx * stagger),
            fps,
            config: { damping: 9, stiffness: 170, mass: 0.8 },
          });
          const tilt = (idx % 2 === 0 ? -1 : 1) * 14 * (1 - sp);
          return (
            <span
              key={idx}
              aria-hidden
              style={{
                display: "inline-block",
                opacity: Math.min(1, sp * 2),
                transform: `translateY(${((1 - sp) * 0.5).toFixed(3)}em) rotate(${tilt.toFixed(2)}deg) scale(${(0.5 + 0.5 * sp).toFixed(3)})`,
                transformOrigin: "50% 80%",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        })}
      </span>
    );
  } else if (node.variant === "solid" && node.entrance === "typewriter") {
    // Letters switch on one by one: ~1.2 frames per letter for big words, ~2.4 for small ones.
    const chars = splitGraphemes(node.text);
    const perChar = (node.fontSize > 160 ? 1.2 : node.fontSize > 80 ? 2 : 0.9) * fpsScale;
    const shown = Math.min(chars.length, Math.floor((localFrame + 1) / perChar) + 1);
    content = (
      <span
        aria-label={node.text}
        style={{
          ...sharedTextStyle,
          maxWidth: node.maxWidthPx,
          whiteSpace: node.maxWidthPx ? "normal" : "nowrap",
          textAlign: align,
          color: fillColor,
          WebkitTextStroke: strokeDecl,
          textShadow: combinedShadow || undefined,
        }}
      >
        {chars.map((ch, idx) => (
          <span key={idx} aria-hidden style={{ visibility: idx < shown ? "visible" : "hidden" }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    );
  } else if (node.variant === "solid" && node.entrance === "baseline-mask") {
    const parts = node.staggerWords ? node.text.split(/\s+/) : [node.text];
    const stepDelay = Math.max(1, Math.round(0.045 * fps));

    content = (
      <span
        aria-label={node.text}
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: "0.26em",
          userSelect: "none",
        }}
      >
        {parts.map((part, idx) => {
          const sp = spring({
            frame: Math.max(0, localFrame + leadFrames - idx * stepDelay),
            fps,
            config: { damping: 16, stiffness: 220, mass: 0.7 },
          });
          const risePct = (1 - sp) * 115;
          return (
            <span
              key={idx}
              aria-hidden
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
                padding: "0.5em 0.06em",
                margin: "-0.26em 0",
              }}
            >
              <span
                style={{
                  ...sharedTextStyle,
                  padding: 0,
                  color: fillColor,
                  WebkitTextStroke: strokeDecl,
                  textShadow: combinedShadow || undefined,
                  transform: `translateY(${risePct.toFixed(1)}%)`,
                }}
              >
                {part}
              </span>
            </span>
          );
        })}
      </span>
    );
  } else if (node.variant === "solid") {
    content = (
      <span
        style={{
          ...sharedTextStyle,
          maxWidth: node.maxWidthPx,
          whiteSpace: node.maxWidthPx ? "normal" : "nowrap",
          textAlign: align,
          color: fillColor,
          WebkitTextStroke: strokeDecl,
          textShadow: combinedShadow || undefined,
        }}
      >
        {node.text}
      </span>
    );
  } else if (node.variant === "hollow-outline") {
    content = (
      <span style={{ position: "relative", display: "inline-block" }}>
        {chromaticPx > 0 && (
          <>
            <span
              aria-hidden
              style={{
                ...sharedTextStyle,
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${-chromaticPx}px, 0)`,
                color: "transparent",
                WebkitTextStroke: `${Math.max(1.2, strokeWidth * 0.8)}px ${stylePack.palette.accent}`,
                opacity: 0.65,
                pointerEvents: "none",
              }}
            >
              {node.text}
            </span>
            <span
              aria-hidden
              style={{
                ...sharedTextStyle,
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${chromaticPx}px, 0)`,
                color: "transparent",
                WebkitTextStroke: `${Math.max(1.2, strokeWidth * 0.8)}px ${stylePack.palette.primary}`,
                opacity: 0.65,
                pointerEvents: "none",
              }}
            >
              {node.text}
            </span>
          </>
        )}
        <span
          style={{
            ...sharedTextStyle,
            position: "relative",
            color: "transparent",
            WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
          }}
        >
          {node.text}
        </span>
      </span>
    );
  } else if (node.variant === "boxed-label") {
    const bg = node.bgColor ?? stylePack.palette.primary;
    content = (
      <span
        style={{
          display: "inline-block",
          position: "relative",
          padding: "0.02em 0.18em",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "14%",
            bottom: "14%",
            backgroundColor: bg,
            boxShadow: "0 8px 22px rgba(0, 0, 0, 0.48)",
            zIndex: 0,
          }}
        />
        <span
          style={{
            ...sharedTextStyle,
            position: "relative",
            zIndex: 1,
            color: fillColor,
            textShadow: chromaticTextShadow,
          }}
        >
          {node.text}
        </span>
      </span>
    );
  } else if (node.variant === "fire-masked") {
    const shiftPct = ((localFrame / totalFrames) * 28).toFixed(1);
    content = (
      <span
        style={{
          ...sharedTextStyle,
          backgroundImage: `linear-gradient(160deg, #FFF57A 0%, #FF951C 28%, ${stylePack.palette.primary} 62%, #7D0606 100%)`,
          backgroundSize: "140% 140%",
          backgroundPosition: `${shiftPct}% 50%`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          filter: `drop-shadow(0 0 12px ${stylePack.palette.primary})`,
        }}
      >
        {node.text}
      </span>
    );
  } else {
    // censor-invert
    const barProgress = applyEasing(Math.min(1, localFrame / Math.max(1, entFrames + 1)), "expoOut");
    const barColor = node.censorColor ?? stylePack.palette.bg;
    const bandPct = Math.round((node.censorBandRatio ?? 0.24) * 100);
    content = (
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            ...sharedTextStyle,
            color: fillColor,
            textShadow: combinedShadow || undefined,
          }}
        >
          {node.text}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: "-6%",
            top: `${50 - bandPct / 2}%`,
            height: `${bandPct}%`,
            width: `${(barProgress * 112).toFixed(1)}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 0 2px ${stylePack.palette.primary}`,
            pointerEvents: "none",
          }}
        />
      </span>
    );
  }

  let sweepBarElement: React.ReactNode = null;
  let contentClipPath = clipPath;
  let hasSweepBar = false;

  if (node.sweepExit && exitFrames > 0 && remaining <= exitFrames) {
    const exitT = Math.min(
      1,
      Math.max(0, (exitFrames - remaining + 1) / Math.max(1, exitFrames))
    );
    const easeIn = exitT * exitT * (0.5 + 0.5 * exitT);
    const dir = node.sweepExit.direction ?? "ltr";
    const barColor = node.sweepExit.color ?? stylePack.palette.highlight;
    const thickness = node.sweepExit.thicknessPx ?? 7;
    const barOpacity =
      easeIn < 0.15
        ? easeIn / 0.15
        : Math.max(0, 1 - Math.max(0, (easeIn - 0.82) / 0.18));
    contentClipPath = buildSweepMaskClip("exit", dir, easeIn);
    sweepBarElement = buildSweepBarNode(dir, easeIn, thickness, barColor, barOpacity);
    hasSweepBar = sweepBarElement !== null;
  } else if (node.sweepReveal && localFrame < entFrames) {
    const t = Math.min(1, (localFrame + 1 * fpsScale) / entFrames);
    const e = applyEasing(t, "expoOut");
    const dir =
      node.sweepReveal.direction ??
      (node.revealDir === "rtl" ||
      node.revealDir === "ttb" ||
      node.revealDir === "btt"
        ? node.revealDir
        : "ltr");
    const barColor = node.sweepReveal.color ?? stylePack.palette.highlight;
    const thickness = node.sweepReveal.thicknessPx ?? 7;
    const barOpacity =
      e > 0.85 ? Math.max(0, (1 - e) / 0.15) : 0.95;
    contentClipPath = buildSweepMaskClip("reveal", dir, e);
    sweepBarElement = buildSweepBarNode(dir, e, thickness, barColor, barOpacity);
    hasSweepBar = sweepBarElement !== null;
  }

  // Optional mid-life 360-degree whip-spin (e.g. ANH -> HNA -> ANH Y-axis coin flip while held).
  let midSpinBlurPx = 0;
  let midSpinRotateZ = 0;
  if (node.spin360) {
    const dur = Math.max(6, node.spin360.durationFrames ?? Math.round(14 * fpsScale));
    const trigger =
      node.spin360.triggerFrame ??
      node.startFrame + Math.max(entFrames + 2, Math.floor((totalFrames - dur) * 0.48));
    const elapsed = frame - trigger;
    if (elapsed >= 0 && elapsed <= dur) {
      const raw = Math.min(1, elapsed / dur);
      const ease = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      const deg = 360 * (node.spin360.turns ?? 1) * ease;
      if (node.spin360.axis === "y") {
        extraRotateY += deg;
        midSpinBlurPx = Math.abs(Math.sin((deg * Math.PI) / 180)) * 4.8;
      } else if (node.spin360.axis === "x") {
        extraRotateX += deg;
        midSpinBlurPx = Math.abs(Math.sin((deg * Math.PI) / 180)) * 4.5;
      } else {
        midSpinRotateZ += deg;
        midSpinBlurPx = Math.sin(raw * Math.PI) * 5.2;
      }
    }
  }

  const totalBlurPx = Math.max(enterBlurPx, exitBlurPx, midSpinBlurPx) + (node.blurPx ?? 0);
  const has3dSpin = Math.abs(extraRotateX) > 0.05 || Math.abs(extraRotateY) > 0.05;
  const spin3dPrefix = has3dSpin
    ? `perspective(840px) rotateX(${extraRotateX.toFixed(2)}deg) rotateY(${extraRotateY.toFixed(2)}deg) `
    : "";

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        zIndex: node.zIndex ?? 20,
        opacity: opacity * (node.baseOpacity ?? 1),
        clipPath: hasSweepBar ? undefined : clipPath,
        filter: totalBlurPx > 0.2 ? `blur(${totalBlurPx.toFixed(2)}px)` : undefined,
        transformOrigin: "center center",
        backfaceVisibility: has3dSpin ? "visible" : undefined,
        transform: `translate(${alignX}, -50%) translate(${extraTranslateX.toFixed(1)}px, ${extraTranslateY.toFixed(1)}px) ${spin3dPrefix}rotate(${(rotateDeg + midSpinRotateZ).toFixed(2)}deg) scale(${baseScaleX.toFixed(4)}, ${baseScaleY.toFixed(4)})`,
        pointerEvents: "none",
      }}
    >
      {hasSweepBar ? (
        <>
          <span
            style={{
              display: "inline-block",
              clipPath: contentClipPath,
            }}
          >
            {content}
          </span>
          {sweepBarElement}
        </>
      ) : (
        content
      )}
    </div>
  );
};
