import type { GraphicNode, Storyboard, StylePackConfig, WordNode } from "./types";

/**
 * Text must never melt into what sits behind it. For every readable word this estimates the
 * colour directly behind it (topmost solid shape under the word, else the stage background) at
 * a few moments of its life, and if the contrast is too low it adds an outside halo in the
 * opposite tone so the letters stay legible. Deterministic and storyboard-only.
 */

type RGB = [number, number, number];

function parseColor(input: string | undefined): RGB | null {
  if (!input) return null;
  const c = input.trim().toLowerCase();
  if (c === "transparent" || c === "none") return null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgba = /^rgba?\(([^)]+)\)/.exec(c);
  if (rgba) {
    const p = rgba[1].split(",").map((x) => parseFloat(x));
    if (p.length >= 3 && (p.length < 4 || p[3] >= 0.35)) return [p[0], p[1], p[2]];
  }
  return null;
}

function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const rgbToHex = ([r, g, b]: RGB) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function inRotatedRect(
  px: number,
  py: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotDeg: number
): boolean {
  const r = (-rotDeg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  const lx = dx * Math.cos(r) - dy * Math.sin(r);
  const ly = dx * Math.sin(r) + dy * Math.cos(r);
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
}

/** Colour of a solid shape under a point at `frame`, or null when the shape does not cover it. */
function shapeColorAt(g: GraphicNode, px: number, py: number, frame: number): RGB | null {
  if (frame < g.startFrame || frame >= g.endFrame) return null;
  const life = Math.min(1, Math.max(0, (frame - g.startFrame) / Math.max(1, g.endFrame - g.startFrame)));
  switch (g.kind) {
    case "ribbon": {
      const x = g.endX !== undefined ? g.x + (g.endX - g.x) * life : g.x;
      const y = g.endY !== undefined ? g.y + (g.endY - g.y) * life : g.y;
      const rot = g.endRotateDeg !== undefined ? g.rotateDeg + (g.endRotateDeg - g.rotateDeg) * life : g.rotateDeg;
      return inRotatedRect(px, py, x, y, g.width, g.height, rot) ? parseColor(g.color) : null;
    }
    case "stickerBlock":
      return inRotatedRect(px, py, g.x, g.y, g.width, g.height, g.rotateDeg ?? 0)
        ? parseColor(g.color)
        : null;
    case "starburst":
      return g.fill !== "transparent" && Math.hypot(px - g.x, py - g.y) <= g.radius * 0.8
        ? parseColor(g.fill)
        : null;
    default:
      return null;
  }
}

function wordBox(w: WordNode) {
  const chars = Math.max(1, Math.max(...String(w.text).split("\n").map((l) => l.length)));
  const width = Math.min(w.maxWidthPx ?? 1400, chars * w.fontSize * (w.fontRole === "display" ? 0.5 : 0.56));
  return { width, height: w.fontSize * 0.9 };
}

export interface LegibilityReport {
  fixed: Array<{ id: string; text: string; worst: number; color: string; fixedTo: number }>;
}

/**
 * Colours behind the word at a few moments and points of its life (topmost solid shape under the
 * word, else the stage background).
 */
function backdropsFor(w: WordNode, storyboard: Storyboard, bgBase: RGB, overrides: GraphicNode[]): RGB[] {
  const box = wordBox(w);
  const life = w.endFrame - w.startFrame;
  const frames = [0.2, 0.5, 0.85].map((t) => w.startFrame + Math.floor(life * t));
  // A 5x3 grid over the word box, so partial coverage by a shape is seen as partial.
  const offsets: Array<[number, number]> = [];
  for (const gx of [-0.4, -0.2, 0, 0.2, 0.4]) {
    for (const gy of [-0.28, 0, 0.28]) offsets.push([box.width * gx, box.height * gy]);
  }
  const out: RGB[] = [];
  for (const f of frames) {
    const bgNow =
      parseColor(
        (overrides.find((o) => f >= o.startFrame && f < o.endFrame) as { color?: string } | undefined)?.color
      ) ??
      bgBase;
    for (const [ox, oy] of offsets) {
      const rad = ((w.rotateDeg ?? 0) * Math.PI) / 180;
      const px = w.x + ox * Math.cos(rad) - oy * Math.sin(rad);
      const py = w.y + ox * Math.sin(rad) + oy * Math.cos(rad);
      let behind: RGB = bgNow;
      let topZ = -Infinity;
      for (const g of storyboard.graphics) {
        if (g.kind === "bgOverride") continue;
        const gz = (g as { zIndex?: number }).zIndex ?? 10;
        if (gz >= (w.zIndex ?? 20) || gz < topZ) continue;
        const sameSpace = Boolean((g as { screenFixed?: boolean }).screenFixed) === Boolean(w.screenFixed);
        if (!sameSpace) continue;
        const col = shapeColorAt(g, px, py, f);
        if (col) {
          behind = col;
          topZ = gz;
        }
      }
      out.push(behind);
    }
  }
  return out;
}

/**
 * Text must never melt into what sits behind it. When a word's colour has too little contrast
 * with the backdrop, switch it to near-black or white (whichever reads best). No outlines or
 * halos: they look cheap. Placement is still the better fix, so the report lists every word that
 * had to be recoloured.
 */
export function ensureLegible(
  storyboard: Storyboard,
  stylePack: StylePackConfig,
  minContrast = 2.2
): { storyboard: Storyboard; report: LegibilityReport } {
  const bgBase = parseColor(stylePack.palette.bg) ?? [0, 0, 0];
  const overrides = storyboard.graphics.filter((g) => g.kind === "bgOverride");
  const report: LegibilityReport = { fixed: [] };
  const INK: RGB = [12, 12, 16];
  const PAPER: RGB = [250, 250, 250];

  const words = storyboard.words.map((w): WordNode => {
    if (w.ambient || w.variant === "hollow-outline" || w.variant === "fire-masked" || w.variant === "censor-invert") {
      return w;
    }
    const textColor = parseColor(w.color ?? stylePack.palette.textPrimary);
    if (!textColor) return w;
    const behind = backdropsFor(w, storyboard, bgBase, overrides);
    // Share of sampled points where the colour reads (contrast >= minContrast).
    const shareOf = (c: RGB) => behind.filter((b) => contrast(c, b) >= minContrast).length / behind.length;
    const share = shareOf(textColor);
    if (share >= 0.8) return w;
    const inkShare = shareOf(INK);
    const paperShare = shareOf(PAPER);
    const best = inkShare >= paperShare ? INK : PAPER;
    const bestShare = Math.max(inkShare, paperShare);
    // Only recolour when the new colour reads nearly everywhere. A word half on a light shape and
    // half on the dark stage cannot be fixed by recolouring: keep its colour.
    if (bestShare < 0.9 || bestShare < share + 0.25) return w;
    const hex = rgbToHex(best);
    report.fixed.push({
      id: w.id,
      text: w.text,
      worst: Math.round(share * 100) / 100,
      color: hex,
      fixedTo: Math.round(bestShare * 100) / 100,
    });
    return { ...w, color: hex };
  });

  return { storyboard: { ...storyboard, words }, report };
}
