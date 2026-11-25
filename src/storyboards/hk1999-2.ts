import type {
  CameraKeyframe,
  GraphicNode,
  Storyboard,
  WordNode,
} from "../engine/types";
import { hk1999VnStoryboard } from "./hk1999-vn";
import { softenEntrances } from "../engine/softEntrances";

/**
 * Cantonese lyric video (漫步香港1999), rebuilt from docs/blueprints/motion-spec-hk1999-2.md.
 * 24 fps, 731 frames. Every scene lives in its own world cell so camera cuts are free; the
 * chorus reuses the Vietnamese lockup layout (ribbon, ticket, neon sign, wireframe) shifted
 * into its own cell. Angles: CSS degrees (positive = clockwise), so the spec's "/" lean is negative.
 */

const RED = "#F03020";
const ORANGE = "#FF8A20";
const CYAN = "#00E5FF";
const WHITE = "#FFFFFF";

const cx = (cell: number) => 600 + cell * 1200;
const A1 = cx(0);
const A2 = cx(1);
const A3 = cx(2);
const A4 = cx(3);
const A5 = cx(4);
const A6 = cx(5);
const A7 = cx(6);
const BR = cx(7);
const TK = cx(8);
const D0 = 0;
const D_SHIFT_FRAMES = 421 - 284;

const word = (
  id: string,
  text: string,
  startFrame: number,
  endFrame: number,
  x: number,
  y: number,
  fontSize: number,
  o: Partial<WordNode> = {}
): WordNode => ({
  id,
  text,
  startFrame,
  endFrame,
  x,
  y,
  fontSize,
  fontRole: "display",
  variant: "solid",
  entrance: "pop",
  color: WHITE,
  zIndex: 25,
  ...o,
});

const wipe = (o: Partial<WordNode> = {}): Partial<WordNode> => ({
  entrance: "mask-glide",
  revealDir: "btt",
  entranceDurationFrames: 3,
  ...o,
});

const ribbon = (
  id: string,
  startFrame: number,
  endFrame: number,
  x: number,
  y: number,
  width: number,
  height: number,
  rotateDeg: number,
  o: Partial<Extract<GraphicNode, { kind: "ribbon" }>> = {}
): GraphicNode => ({
  kind: "ribbon",
  id,
  startFrame,
  endFrame,
  x,
  y,
  width,
  height,
  rotateDeg,
  color: RED,
  halftone: true,
  zIndex: 12,
  ...o,
});

const star = (
  id: string,
  startFrame: number,
  endFrame: number,
  x: number,
  y: number,
  radius: number,
  o: Partial<Extract<GraphicNode, { kind: "starburst" }>> = {}
): GraphicNode => ({
  kind: "starburst",
  id,
  startFrame,
  endFrame,
  x,
  y,
  radius,
  points: 14,
  innerRatio: 0.66,
  fill: "transparent",
  stroke: "#F2603A",
  strokeWidth: 2.5,
  zIndex: 9,
  ...o,
});

const outlineGlyph = (
  id: string,
  text: string,
  startFrame: number,
  endFrame: number,
  x: number,
  y: number,
  fontSize: number
): WordNode =>
  word(id, text, startFrame, endFrame, x, y, fontSize, {
    variant: "hollow-outline",
    strokeColor: "#C41812",
    strokeWidth: 2,
    zIndex: 6,
    entrance: "pop",
    entranceDurationFrames: 1,
  });

/** One punch frame group: a small glyph that scales roughly 6x while tilting, ending as a slab. */
const punch = (
  id: string,
  text: string,
  startFrame: number,
  endFrame: number,
  x: number,
  y: number,
  fontSize: number,
  rot: number,
  color = WHITE
): WordNode =>
  word(id, text, startFrame, endFrame, x, y, fontSize, {
    color,
    entrance: "pop",
    entranceDurationFrames: 1,
    travel: { dx: 0, dy: 0, rot, scale: 5 },
    zIndex: 30,
  });

const cam = (
  frame: number,
  x: number,
  y: number,
  zoom = 1,
  easing: CameraKeyframe["easing"] = "hold",
  rotateDeg = 0
): CameraKeyframe => ({ frame, x, y, zoom, rotateDeg, easing });

// ---------------------------------------------------------------------------- chorus (reused)
const shiftChorusGraphic = (g: GraphicNode): GraphicNode => {
  const out: Record<string, unknown> = { ...g };
  out.startFrame = g.startFrame + D_SHIFT_FRAMES;
  out.endFrame = g.id === "s5-pivoting-ribbon" ? 681 : Math.min(731, g.endFrame + D_SHIFT_FRAMES);
  if (typeof out.x === "number") out.x = (out.x as number) + D0;
  if (typeof out.endX === "number") out.endX = (out.endX as number) + D0;
  if (Array.isArray(out.points)) {
    out.points = (out.points as Array<[number, number]>).map(([px, py]) => [px + D0, py]);
  }
  return out as unknown as GraphicNode;
};

const chorusGraphics: GraphicNode[] = hk1999VnStoryboard.graphics
  .filter((g) => g.id.startsWith("m-") || g.id.startsWith("s5-"))
  .map(shiftChorusGraphic);

const chorusWireWords: WordNode[] = hk1999VnStoryboard.words
  .filter((w) => w.id === "w-bg-manbu" || w.id === "w-bg-1999")
  .map((w) => ({
    ...w,
    startFrame: 421,
    endFrame: 731,
    x: w.x + D0,
  }));

const chorusLyric = (
  id: string,
  text: string,
  startFrame: number,
  endFrame: number,
  o: Partial<WordNode> = {}
): WordNode =>
  word(id, text, startFrame, endFrame, 600, 560, 70, {
    fontRole: "serif",
    fontWeight: 400,
    chromatic: 1.5,
    screenFixed: true,
    zIndex: 35,
    entrance: "pop",
    entranceDurationFrames: 1,
    ...o,
  });

// ---------------------------------------------------------------------------- camera
const cameraKeyframes: CameraKeyframe[] = [
  // Cold open + stack scroll (A1)
  cam(0, A1, 450),
  cam(42, A1, 450),
  cam(47, A1, 495, 1, "linear"),
  cam(56, A1, 617, 1, "linear"),
  cam(57, A1, 645, 1, "linear"),
  cam(59, A1, 700, 1, "cubicOut"),
  cam(60, A1, 1010, 1, "linear"),
  // Label, 你, snap zoom-out, whip pan, 登場 (A2)
  cam(61, A2, 450),
  cam(76, A2, 450),
  cam(77, A2 + 130, 430, 0.58),
  cam(88, A2 + 180, 430, 0.6, "linear"),
  cam(93, A2 - 240, 440, 0.62, "cubicOut"),
  cam(98, A2 - 470, 450, 0.75, "cubicOut"),
  cam(114, A2 - 520, 450, 0.78, "linear"),
  // 把嘴堵上 (A3)
  cam(116, A3, 450),
  cam(146, A3 - 60, 420, 1, "linear"),
  // 情話留在嘴邊也無妨 (A4) with the vertical whip at f159
  cam(147, A4, 450),
  cam(158, A4, 450),
  cam(159, A4, 590),
  cam(165, A4, 470, 1, "cubicOut"),
  // 喜歡 (A5)
  cam(214, A5, 450),
  // 怎麼藏 (A6) with push-in and punch zoom
  cam(233, A6, 450),
  cam(251, A6, 450, 1, "linear"),
  cam(260, A6, 450, 1.25, "linear"),
  cam(261, A6, 450, 1.45),
  cam(262, A6, 450, 2.6),
  cam(263, A6, 450, 6),
  // 悸動怎麼涼 (A7)
  cam(265, A7, 450),
  // breather (BR), ticker (TK)
  cam(306, BR, 450),
  cam(372, TK - 200, 450),
  cam(420, TK + 280, 450, 1, "linear"),
  // chorus (D): 1.6x hard cut that settles in ~12 frames, then drift, snap zoom-out at f464
  cam(421, D0 + 410, 315, 1.6),
  cam(433, D0 + 430, 325, 1.0, "expoOut"),
  cam(463, D0 + 540, 330, 1.0, "linear"),
  cam(464, D0 + 615, 455, 0.7),
  cam(680, D0 + 960, 455, 0.76, "linear"),
  cam(731, D0 + 1060, 465, 0.76, "linear"),
];

// ---------------------------------------------------------------------------- graphics
const graphics: GraphicNode[] = [
  // ===== A1: cold open, 華燈初上 stack (26-61)
  star("a1-star", 27, 61, A1 + 20, 360, 140),
  ribbon("a1-wedge", 27, 61, A1 + 480, 760, 980, 340, -63, { wipeDirection: "btt" }),
  ribbon("a1-box1", 34, 61, A1 + 140, 790, 340, 170, 0),
  ribbon("a1-box2", 41, 61, A1 + 420, 830, 260, 120, 0),
  star("a1-white-s", 49, 55, A1 + 250, 840, 70, { fill: WHITE, stroke: WHITE, points: 14 }),
  star("a1-white-l", 55, 61, A1 + 250, 840, 118, { fill: WHITE, stroke: WHITE, points: 14 }),

  // ===== A2: label, 你, snap zoom-out, whip pan, 登場 (61-116)
  ribbon("a2-label", 61, 99, A2 - 260, 520, 400, 112, 0),
  outlineGlyph("a2-giant-guang", "光", 62, 80, A2, 480, 980) as unknown as GraphicNode,
  ribbon("a2-cyan-bar", 70, 77, A2 + 40, 300, 96, 24, 0, { color: CYAN, halftone: false }),
  ribbon("a2-ribbon", 77, 99, A2 + 190, 450, 1100, 170, 10),
  star("a2-ice", 77, 90, A2 + 520, 120, 210, { fill: "#CDEFF5", stroke: "#CDEFF5" }),
  star("a2-burst8", 77, 116, A2 + 120, 480, 130, { points: 8, stroke: "#E04030" }),
  ribbon("a2-label2", 99, 116, A2 - 400, 520, 640, 120, 0),
  ribbon("a2-pillar", 99, 116, A2 - 600, 450, 780, 90, 90),
  star("a2-white", 99, 116, A2 - 420, 700, 110, { fill: WHITE, stroke: WHITE }),

  // ===== A3: 把嘴堵上 (116-147)
  star("a3-white", 116, 147, A3 + 10, 470, 70, { fill: WHITE, stroke: WHITE }),
  star("a3-outline", 120, 147, A3 - 200, 700, 250),
  ribbon("a3-pillar", 144, 147, A3, 450, 800, 90, 90),

  // ===== A4: 情話留在嘴邊也無妨 (147-214)
  ribbon("a4-pillar", 144, 181, A4 - 120, 450, 900, 80, 90, { fireTexture: true }),
  ribbon("a4-bar", 159, 190, A4 - 250, 700, 420, 70, 0),
  star("a4-outline", 159, 190, A4 - 300, 660, 150),
  star("a4-white1", 166, 173, A4 - 100, 580, 120, { fill: WHITE, stroke: WHITE }),
  star("a4-cyan", 173, 177, A4 - 100, 580, 120, { fill: "#CDEFF5", stroke: "#CDEFF5" }),
  star("a4-white2", 177, 190, A4 - 100, 580, 120, { fill: WHITE, stroke: WHITE }),
  ribbon("a4-splatter", 188, 214, A4 + 400, 760, 320, 320, 30, { fireTexture: true, color: "#D82818" }),

  // ===== A5: 喜歡 (214-233)
  star("a5-outline", 225, 233, A5, 450, 225, { stroke: WHITE, strokeWidth: 3 }),
  star("a5-orange", 225, 233, A5 + 120, 380, 52, { fill: ORANGE, stroke: ORANGE }),

  // ===== A6: 怎麼藏 (233-265)
  ribbon("a6-ribbon", 233, 261, A6, 450, 1300, 315, 28, { endRotateDeg: 80, fireTexture: true, color: "#EE5A22" }),
  ribbon("a6-cross-a", 247, 261, A6, 450, 1400, 160, 35),
  ribbon("a6-cross-b", 247, 261, A6, 450, 1400, 160, -55),
  { kind: "bgOverride", id: "a6-white", startFrame: 264, endFrame: 265, color: "#EDEDED" },

  // ===== A7: 悸動怎麼涼 (265-306)
  ribbon("a7-ribbon-1", 265, 272, A7, 520, 1100, 180, 5),
  star("a7-outline-1", 265, 272, A7, 450, 200),
  star("a7-orange-1", 265, 272, A7 + 80, 380, 38, { fill: ORANGE, stroke: ORANGE }),
  ribbon("a7-ribbon-2", 272, 278, A7, 450, 1100, 190, -35, { endRotateDeg: -60 }),
  star("a7-orange-2", 279, 288, A7 + 90, 380, 55, { fill: ORANGE, stroke: ORANGE }),
  star("a7-outline-2", 279, 290, A7, 450, 315, { stroke: "#E04030" }),
  ribbon("a7-square", 287, 288, A7, 450, 800, 800, 25, { color: WHITE, halftone: false, zIndex: 28 }),
  ribbon("a7-slab-a", 294, 306, A7, 450, 900, 300, -20, { endRotateDeg: 30, color: WHITE, halftone: false, zIndex: 20 }),
  star("a7-red", 303, 306, A7 + 450, 450, 315, { fill: "#E02820", stroke: "#E02820" }),

  // ===== BR: breather decorations (306-372)
  { kind: "stickerBlock", id: "br-tile", startFrame: 306, endFrame: 312, x: BR, y: 450, width: 250, height: 250, color: ORANGE, zIndex: 8 },
  star("br-star", 312, 319, BR, 450, 150, { fill: ORANGE, stroke: ORANGE }),
  { kind: "stickerBlock", id: "br-square", startFrame: 319, endFrame: 326, x: BR, y: 450, width: 270, height: 270, color: "transparent", borderColor: "#E04030", borderWidth: 3, rotateDeg: -12, zIndex: 8 },
  { kind: "doodle", id: "br-disc", startFrame: 326, endFrame: 335, shape: "moon", x: BR, y: 450, size: 340, color: "#F37A20", glow: false, zIndex: 8 },
  { kind: "orbitRing", id: "br-ring", startFrame: 326, endFrame: 335, x: BR, y: 450, radius: 175, stroke: WHITE, strokeWidth: 2, zIndex: 9 },
  { kind: "radialRays", id: "br-rays", startFrame: 341, endFrame: 349, x: BR, y: 450, radius: 210, rayCount: 14, color: "#FFFFFF", zIndex: 8 },
  ribbon("br-stroke", 349, 355, BR, 450, 150, 5, -35, { color: WHITE, halftone: false, zIndex: 30 }),
  ribbon("br-bar", 355, 372, BR, 470, 420, 70, -15, { color: ORANGE }),

  // ===== chorus
  ...chorusGraphics,
];

// ---------------------------------------------------------------------------- words
const words: WordNode[] = [
  // ===== A1: 華燈初上 stack
  word("a1-hua", "華", 26, 61, A1 + 250, 190, 205, { entrance: "unfold", entranceDurationFrames: 2 }),
  word("a1-deng", "燈", 33, 61, A1 + 250, 450, 205, wipe()),
  word("a1-chu", "初", 40, 61, A1 + 250, 710, 205, wipe()),
  word("a1-shang", "上", 48, 61, A1 + 250, 970, 205, wipe({ travel: { dx: 0, dy: -40, rot: 0, scale: 0.25 } })),

  // ===== A2: 燈光只為 label, 你, 我, 隆重, 登場
  word("a2-deng", "燈", 61, 99, A2 + (-380), 520, 72, wipe({ zIndex: 26 })),
  word("a2-guang", "光", 62, 99, A2 + (-300), 520, 72, wipe({ zIndex: 26 })),
  word("a2-zhi", "只", 63, 99, A2 + (-220), 520, 72, wipe({ zIndex: 26 })),
  word("a2-wei", "為", 65, 99, A2 + (-140), 520, 72, wipe({ zIndex: 26 })),
  word("a2-ni", "你", 69, 100, A2 + 60, 400, 300, { entrance: "slide-up", entranceDurationFrames: 3, travel: { dx: 30, dy: 0, rot: 0, scale: 0.05 } }),
  outlineGlyph("a2-ni-ghost", "你", 71, 77, A2 + 74, 412, 300),
  word("a2-wo", "我", 77, 100, A2 + 470, 450, 215, { color: CYAN, zIndex: 27 }),
  word("a2-wo-ghost", "我", 77, 100, A2 + 490, 462, 215, { color: WHITE, zIndex: 26 }),
  word("a2-long", "隆", 82, 100, A2 + 470, 700, 80, wipe({ color: "#9FEFFF" })),
  word("a2-zhong", "重", 85, 100, A2 + 470, 805, 80, wipe({ color: "#9FEFFF" })),
  word("a2-deng2", "登", 93, 116, A2 - 440, 450, 215, { entrance: "slide-up", entranceDurationFrames: 3, travel: { dx: 40, dy: 0, rot: 0, scale: 0.05 } }),
  word("a2-chang", "場", 102, 116, A2 - 230, 450, 215, wipe()),

  // ===== A3: 把嘴堵上
  word("a3-ba", "把", 116, 147, A3 - 110, 520, 80, { travel: { dx: -10, dy: -8, rot: 0, scale: 0.08 } }),
  word("a3-zui", "嘴", 123, 147, A3 + 10, 520, 135, wipe()),
  word("a3-du", "堵", 130, 147, A3 + 120, 700, 72, wipe()),
  word("a3-shang", "上", 137, 147, A3 + 330, 460, 270, { entrance: "pop", entranceDurationFrames: 5, travel: { dx: 0, dy: -10, rot: 0, scale: 0.1 } }),

  // ===== A4: 情話留在嘴邊也無妨
  word("a4-qing", "情", 147, 190, A4 + 330, 170, 105, wipe()),
  word("a4-hua", "話", 148, 190, A4 + 330, 335, 105, wipe()),
  word("a4-liu", "留", 152, 190, A4 + 330, 500, 105, wipe()),
  word("a4-zai", "在", 159, 185, A4 + 330, 665, 105, wipe()),
  word("a4-zui", "嘴", 162, 185, A4 + 330, 830, 105, wipe()),
  word("a4-bian", "邊", 166, 190, A4 - 120, 560, 330, { entrance: "slide-up", entranceDurationFrames: 3, zIndex: 28, travel: { dx: 20, dy: 0, rot: -4, scale: 0.06 } }),
  outlineGlyph("a4-bian-echo", "邊", 167, 188, A4 - 190, 590, 330),
  word("a4-ye", "也", 173, 181, A4 + 40, 570, 230, { color: "#E83020", zIndex: 24, ...wipe() }),
  word("a4-wu", "無", 181, 190, A4 + 40, 570, 230, { travel: { dx: 0, dy: 0, rot: -8, scale: -0.15 }, ...wipe() }),
  word("a4-fang", "妨", 191, 214, A4 + 40, 570, 205, { variant: "fire-masked", entrance: "pop", entranceDurationFrames: 1 }),
  outlineGlyph("a4-fang-giant", "妨", 191, 220, A4 + 20, 540, 780),

  // ===== A5: 喜歡
  word("a5-xi", "喜", 214, 233, A5 - 30, 450, 230, { entrance: "tilt-in", entranceDurationFrames: 6 }),
  word("a5-huan-o", "歡", 226, 232, A5 + 60, 450, 230, { color: ORANGE, travel: { dx: 10, dy: 0, rot: 0, scale: 0.35 } }),
  word("a5-huan-w", "歡", 232, 233, A5, 450, 560, { rotateDeg: -30, zIndex: 30, entrance: "pop", entranceDurationFrames: 1 }),

  // ===== A6: 怎麼藏
  word("a6-zen", "怎", 233, 247, A6, 450, 215, { entrance: "tilt-in", entranceDurationFrames: 5 }),
  word("a6-echo-1", "麼", 239, 247, A6 + 30, 426, 215, { color: ORANGE, baseOpacity: 0.7, zIndex: 24 }),
  word("a6-echo-2", "麼", 242, 247, A6 + 60, 402, 215, { color: ORANGE, baseOpacity: 0.55, zIndex: 23 }),
  word("a6-echo-3", "麼", 245, 247, A6 + 90, 378, 215, { color: ORANGE, baseOpacity: 0.4, zIndex: 22 }),
  word("a6-cang", "藏", 247, 265, A6, 450, 330, { entrance: "roll-settle", entranceDurationFrames: 4, zIndex: 30 }),

  // ===== A7: 悸動怎麼涼
  word("a7-ji", "悸", 265, 269, A7, 450, 165),
  punch("a7-ji-p", "悸", 269, 272, A7, 450, 165, 30),
  word("a7-dong", "動", 272, 276, A7, 450, 165, { color: CYAN, travel: { dx: 0, dy: 0, rot: 0, scale: 0.5 } }),
  punch("a7-dong-p", "動", 276, 278, A7, 450, 250, 25, CYAN),
  punch("a7-zen-slab", "怎", 278, 279, A7, 450, 700, 0),
  word("a7-zen", "怎", 279, 284, A7, 450, 125, { rotateDeg: 25, travel: { dx: 0, dy: 0, rot: 15, scale: 0.3 } }),
  punch("a7-me-p", "麼", 284, 287, A7, 450, 150, 10),
  word("a7-me", "麼", 288, 291, A7, 450, 270, { rotateDeg: -10, travel: { dx: 0, dy: 0, rot: 0, scale: 0.5 } }),
  punch("a7-me-slab", "麼", 291, 294, A7, 450, 300, -12),
  word("a7-liang", "涼", 294, 306, A7, 450, 145, { entrance: "pop", entranceDurationFrames: 1 }),
  outlineGlyph("a7-liang-echo", "涼", 294, 306, A7 + 20, 470, 290),

  // ===== BR: 獨留紅燭照亮一方 (one glyph per beat, tilting in)
  word("br-du", "獨", 306, 312, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30 }),
  word("br-liu", "留", 312, 319, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30 }),
  word("br-hong", "紅", 319, 326, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30 }),
  word("br-zhu", "燭", 326, 335, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30 }),
  word("br-zhao", "照", 335, 341, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30 }),
  word("br-zhao-echo", "照", 335, 341, BR + 140, 540, 290, { variant: "hollow-outline", strokeColor: "#8A1010", strokeWidth: 3, color: "transparent", zIndex: 20 }),
  word("br-liang", "亮", 341, 349, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30 }),
  word("br-fang", "方", 355, 372, BR, 450, 170, { entrance: "tilt-in", entranceDurationFrames: 6, zIndex: 30, exitFadeFrames: 12 }),

  // ===== TK: 就把月光打 typewriter ticker
  word("tk-jiu", "就", 372, 396, TK - 380 + 0, 450, 130, { fontRole: "body", fontWeight: 500, ...wipe(), exitStyle: "mask-wipe-down", exitDurationFrames: 3 }),
  word("tk-ba", "把", 377, 400, TK - 380 + 190, 450, 130, { fontRole: "body", fontWeight: 500, ...wipe(), exitStyle: "mask-wipe-down", exitDurationFrames: 3 }),
  word("tk-yue", "月", 385, 405, TK - 380 + 380, 450, 130, { fontRole: "body", fontWeight: 500, ...wipe(), exitStyle: "mask-wipe-down", exitDurationFrames: 3 }),
  word("tk-guang", "光", 392, 410, TK - 380 + 570, 450, 130, { fontRole: "body", fontWeight: 500, ...wipe(), exitStyle: "mask-wipe-down", exitDurationFrames: 3 }),
  word("tk-da", "打", 399, 421, TK - 380 + 760, 450, 130, { fontRole: "body", fontWeight: 500, ...wipe() }),

  // ===== chorus
  ...chorusWireWords,
  word("d-title", "漫步香港1999", 421, 520, D0 + 300, 150, 108, {
    fontRole: "serif",
    fontWeight: 400,
    color: "#F21B14",
    chromatic: 1.5,
    entrance: "pop",
    entranceDurationFrames: 1,
    zIndex: 40,
  }),
  word("d-kai", "開", 421, 464, D0 + 470, 335, 150, {
    fontRole: "serif",
    fontWeight: 400,
    rotateDeg: -14,
    chromatic: 2,
    entrance: "pop",
    entranceDurationFrames: 1,
    zIndex: 28,
  }),
  chorusLyric("d-lyric-1", "讓夢照進窗台", 464, 552),
  chorusLyric("d-lyric-2", "我愛的女孩", 552, 639),
  chorusLyric("d-lyric-3", "站在只屬於我們的舞台", 639, 679, { exitFadeFrames: 18 }),
];

// Motion pass. The reference is never still: scenes drift, text travels and tilts through its
// whole life, and held shots slowly pan. Hard cuts and punch frames keep their own motion.
const hash01 = (n: number): number => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const NO_TRAVEL = /giant|echo|ghost|slab|-p$|wire|manbu|1999|title|lyric|zhao-echo|^a6-echo|^a5-huan-w/;
const withTravel = (w: WordNode): WordNode => {
  if (w.travel || NO_TRAVEL.test(w.id) || w.endFrame - w.startFrame < 5) return w;
  const h = hash01(w.startFrame * 7 + w.fontSize);
  const ang = h * Math.PI * 2;
  const mag = Math.min(70, 16 + (w.endFrame - w.startFrame) * 1.3);
  return {
    ...w,
    driftStrength: 2.2,
    travel: {
      dx: Math.round(Math.cos(ang) * mag),
      dy: Math.round(Math.sin(ang) * mag * 0.8),
      rot: Math.round((h - 0.5) * 80) / 10,
      scale: 0.07 + h * 0.08,
    },
  };
};

// Slow pan on every held camera span, alternating direction per span.
const driftedCamera: CameraKeyframe[] = cameraKeyframes.map((k, i, all) => {
  const a = all[i - 1];
  if (!a || k.frame - a.frame < 10) return k;
  if (k.x !== a.x || k.y !== a.y || k.zoom !== a.zoom) return k;
  const dir = i % 2 === 0 ? 1 : -1;
  const span = k.frame - a.frame;
  return {
    ...k,
    x: k.x + dir * span * 2.6,
    y: k.y - dir * span * 1.4,
    zoom: k.zoom * (1 + Math.min(0.1, span * 0.0025)),
    easing: "linear",
  };
});

const SCALE_UNTIL = 421;
const finalWords: WordNode[] = words.map((w) => {
  const isDisplay = w.fontRole === "display";
  const heavy = isDisplay ? { fontWeight: w.fontWeight ?? 800 } : {};
  const big = isDisplay && w.startFrame < SCALE_UNTIL ? { fontSize: Math.round(w.fontSize * 1.22) } : {};
  const ticker = w.id.startsWith("tk-") ? { fontSize: 175, fontWeight: 700 } : {};
  return withTravel({ ...w, ...heavy, ...big, ...ticker });
});

// Ribbons slide and swing, starbursts spin fast: the reference's red shapes never sit still.
const finalGraphics: GraphicNode[] = graphics.map((g) => {
  if (g.startFrame >= 421) return g;
  const h = hash01(g.startFrame * 3 + g.endFrame);
  if (g.kind === "ribbon" && g.endRotateDeg === undefined && g.endFrame - g.startFrame > 4 && g.height < 1200) {
    return {
      ...g,
      endX: g.x + (h - 0.5) * 260,
      endY: g.y + (hash01(h * 91) - 0.5) * 120,
      endRotateDeg: g.rotateDeg + (h - 0.5) * 22,
    };
  }
  if (g.kind === "starburst" && g.spinDegPerSec === undefined) {
    return { ...g, spinDegPerSec: (h > 0.5 ? 1 : -1) * (70 + h * 90) };
  }
  return g;
});

const hk1999CantoneseBase: Storyboard = {
  id: "hk1999-2",
  title: "Man Bu Xiang Gang 1999",
  stylePackId: "hk-1999-halftone",
  fps: 24,
  durationInFrames: 731,
  audioSrc: "audio/hk1999-2.mp3",
  cameraKeyframes: driftedCamera,
  cameraWobble: { rotDeg: 1.6, zoomPct: 0.025, panPx: 14, periodSec: 1.7 },
  graphics: finalGraphics,
  words: finalWords,
};

export const hk1999CantoneseStoryboard: Storyboard = softenEntrances(hk1999CantoneseBase);
