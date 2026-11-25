export type AspectPreset = "4:3" | "16:9" | "9:16";

export type StylePackId =
  | "hk-1999-halftone"
  | "pop-collage-light"
  | "dreamy-glow-dark"
  | "neon-plexus-dark"
  | "pastel-editorial-light";

export type EasingName =
  | "linear"
  | "expoOut"
  | "expoInOut"
  | "backOut"
  | "cubicOut"
  | "whipSnap"
  | "hold";

export interface StylePackPalette {
  bg: string;
  bgAlt: string;
  primary: string;
  accent: string;
  accentAlt: string;
  highlight: string;
  textPrimary: string;
  textInverted: string;
  strokePrimary: string;
  glowColor: string;
}

export interface StylePackFonts {
  display: string;
  displayNarrow: string;
  body: string;
  serif: string;
}

export interface StylePackPostFx {
  halftoneOpacity: number;
  scanlineOpacity: number;
  chromaticShiftPx: number;
  glowStrengthPx: number;
  vignetteOpacity: number;
  grainOpacity: number;
}

export interface StylePackConfig {
  id: StylePackId;
  name: string;
  defaultFps: number;
  palette: StylePackPalette;
  fonts: StylePackFonts;
  postFx: StylePackPostFx;
}

export interface CameraKeyframe {
  frame: number;
  x: number;
  y: number;
  zoom: number;
  rotateDeg: number;
  easing?: EasingName;
  /** Snap the smoothed camera to this keyframe instead of gliding there (a true cut). */
  cut?: boolean;
}

export type WordStyleVariant =
  | "solid"
  | "hollow-outline"
  | "boxed-label"
  | "fire-masked"
  | "censor-invert";

export type WordEntrance =
  | "pop"
  | "slam"
  | "slide-up"
  | "mask-wipe"
  | "flip-spin"
  | "glitch-reveal"
  | "tracking-expand"
  | "baseline-mask"
  | "spring-pop"
  | "mask-glide"
  | "char-wave"
  | "blur-pop"
  | "rise-fade"
  | "fade-focus"
  | "hero-rise"
  | "typewriter"
  | "roll-settle"
  | "char-spring"
  | "tilt-in"
  | "unfold"
  | "slide-blur"
  | "spin-360-y"
  | "spin-360-x"
  | "spin-360-z";

export type WordRevealDir = "ltr" | "rtl" | "btt" | "ttb" | "center";

export type WordExitStyle =
  | "cut"
  | "ease-in-pop"
  | "ease-in-slide"
  | "mask-wipe-left"
  | "mask-wipe-right"
  | "mask-wipe-up"
  | "mask-wipe-down"
  | "split-close"
  | "char-peel"
  | "fly-out"
  | "slide-out";

export type TextGranularity = "char" | "word" | "sentence";

export interface WordTimingCue {
  text: string;
  startFrame: number;
  endFrame?: number;
  emphasis?: boolean;
  color?: string;
}

export interface SweepBarConfig {
  color?: string;
  thicknessPx?: number;
  direction?: "ltr" | "rtl" | "ttb" | "btt";
}

export interface KineticPushConfig {
  dx: number;
  dy: number;
  triggerFrame: number;
  rotateDeg?: number;
}

export type FontRole = "display" | "body" | "serif";

export interface WordNode {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  fontSize: number;
  fontRole: FontRole;
  variant: WordStyleVariant;
  entrance: WordEntrance;
  granularity?: TextGranularity;
  wordTimings?: WordTimingCue[];
  maxWidthPx?: number;
  revealDir?: WordRevealDir;
  entranceDurationFrames?: number;
  rotateDeg?: number;
  scaleX?: number;
  scaleY?: number;
  letterSpacing?: string;
  align?: "left" | "center" | "right";
  color?: string;
  bgColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fontWeight?: number;
  useNarrowDisplay?: boolean;
  chromatic?: boolean | number;
  beatReactive?: boolean;
  zIndex?: number;
  screenFixed?: boolean;
  censorColor?: string;
  censorBandRatio?: number;
  exitFadeFrames?: number;
  exitDurationFrames?: number;
  staggerWords?: boolean;
  livingDrift?: boolean;
  exitStyle?: WordExitStyle;
  deepGlow?: boolean;
  /** Static multiplier on opacity, for ghosted depth layers. */
  baseOpacity?: number;
  /** Multiplies the slow push-in and, above 1, adds a gentle sway while the word is held. */
  driftStrength?: number;
  /** Decorative extra text (ghost trails, micro captions) that may overlap readable words. */
  ambient?: boolean;
  /** Outside halo colour added automatically when the text would blend into what is behind it. */
  haloColor?: string;
  haloWidth?: number;
  /** Total movement spread over the word's life: px, degrees and extra scale (0.1 = +10%). */
  travel?: { dx: number; dy: number; rot: number; scale: number };
  /** Opacity an exiting word dims to (ease-in-pop exit). Default 0.05; the dreamy reference leaves words at ~0.28. */
  exitOpacityFloor?: number;
  /** Static blur in px, for out-of-focus depth layers. */
  blurPx?: number;
  sweepReveal?: SweepBarConfig;
  sweepExit?: SweepBarConfig;
  kineticPush?: KineticPushConfig;
  /** Mid-life 360-degree 3D whip-spin (e.g. Y-axis coin-flip showing mirrored back briefly). */
  spin360?: {
    axis: "x" | "y" | "z";
    turns?: number;
    triggerFrame?: number;
    durationFrames?: number;
  };
}

export interface StarburstGraphicNode {
  kind: "starburst";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  radius: number;
  points: number;
  innerRatio: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  spinDegPerSec?: number;
  chromatic?: boolean | number;
  pulseOnBeat?: boolean;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface RibbonGraphicNode {
  kind: "ribbon";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  width: number;
  height: number;
  rotateDeg: number;
  endRotateDeg?: number;
  color: string;
  secondaryColor?: string;
  halftone?: boolean;
  fireTexture?: boolean;
  wipeDirection?: "ltr" | "rtl" | "ttb" | "btt" | "none";
  zIndex?: number;
  screenFixed?: boolean;
}

export interface ZigzagGraphicNode {
  kind: "zigzag";
  id: string;
  startFrame: number;
  endFrame: number;
  points: Array<[number, number]>;
  stroke: string;
  strokeWidth: number;
  chromatic?: boolean | number;
  drawDurationFrames?: number;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface ProgressBarGraphicNode {
  kind: "progressBar";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  startColor: string;
  endColor: string;
  glowColor?: string;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface MediaCardGraphicNode {
  kind: "mediaCard";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotateDeg?: number;
  variant: "hk-ticket" | "hk-neon-sign" | "fire-square" | "polaroid-frame";
  label?: string;
  parallaxFactor?: number;
  blurPx?: number;
  zIndex?: number;
}

export interface RadialRaysGraphicNode {
  kind: "radialRays";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  radius: number;
  rayCount: number;
  color: string;
  spinDegPerSec?: number;
  zIndex?: number;
}

export interface BgOverrideGraphicNode {
  kind: "bgOverride";
  id: string;
  startFrame: number;
  endFrame: number;
  color: string;
}

export interface StickerBlockGraphicNode {
  kind: "stickerBlock";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotateDeg?: number;
  color: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface HollowEchoGraphicNode {
  kind: "hollowEcho";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  count: number;
  stepX: number;
  stepY?: number;
  strokeColor: string;
  strokeWidth?: number;
  driftX?: number;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface OrbitRingGraphicNode {
  kind: "orbitRing";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  radius: number;
  stroke: string;
  strokeWidth?: number;
  dashArray?: string;
  spinDegPerSec?: number;
  glow?: boolean;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface BokehFieldGraphicNode {
  kind: "bokehField";
  id: string;
  startFrame: number;
  endFrame: number;
  count: number;
  color: string;
  sparkleColor?: string;
  seed?: number;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface FlowerGraphicNode {
  kind: "flower";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  radius: number;
  petals: number;
  color: string;
  rimColor?: string;
  tipColor?: string;
  coreColor?: string;
  rotateDeg?: number;
  spinDegPerSec?: number;
  opacity?: number;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface CircularTextGraphicNode {
  kind: "circularText";
  id: string;
  startFrame: number;
  endFrame: number;
  x: number;
  y: number;
  radius: number;
  text: string;
  fontSize: number;
  fontRole?: "display" | "body";
  color: string;
  ringStroke?: string;
  ringStrokeWidth?: number;
  rotateDeg?: number;
  spinDegPerSec?: number;
  tiltXDeg?: number;
  tiltYDeg?: number;
  opacity?: number;
  glow?: boolean;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface PlexusFieldGraphicNode {
  kind: "plexusField";
  id: string;
  startFrame: number;
  endFrame: number;
  count: number;
  color: string;
  lineColor?: string;
  maxLinkDist?: number;
  opacity?: number;
  seed?: number;
  zIndex?: number;
  screenFixed?: boolean;
}

export interface DoodleGraphicNode {
  kind: "doodle";
  id: string;
  startFrame: number;
  endFrame: number;
  shape:
    | "star"
    | "moon"
    | "swirl"
    | "butterfly"
    | "sparkle4"
    | "tiltedRing"
    | "fineSpokes"
    | "bezierThread"
    | "crossMark"
    | "clockHands"
    | "concentricRing";
  x: number;
  y: number;
  size: number;
  color: string;
  secondaryColor?: string;
  rotateDeg?: number;
  spinDegPerSec?: number;
  driftPx?: number;
  phase?: number;
  blurPx?: number;
  opacity?: number;
  glow?: boolean;
  zIndex?: number;
  screenFixed?: boolean;
}

export type SceneTransitionVariant =
  | "curtain-wipe"
  | "inverted-flash"
  | "split-shutter"
  | "iris-pulse";

export interface SceneTransitionGraphicNode {
  kind: "sceneTransition";
  id: string;
  startFrame: number;
  endFrame: number;
  variant: SceneTransitionVariant;
  direction?: "ltr" | "rtl" | "ttb" | "btt";
  color?: string;
  accentColor?: string;
  zIndex?: number;
  screenFixed?: boolean;
}

export type GraphicNode =
  | StarburstGraphicNode
  | RibbonGraphicNode
  | ZigzagGraphicNode
  | ProgressBarGraphicNode
  | MediaCardGraphicNode
  | RadialRaysGraphicNode
  | BgOverrideGraphicNode
  | StickerBlockGraphicNode
  | HollowEchoGraphicNode
  | OrbitRingGraphicNode
  | BokehFieldGraphicNode
  | FlowerGraphicNode
  | DoodleGraphicNode
  | PlexusFieldGraphicNode
  | CircularTextGraphicNode
  | SceneTransitionGraphicNode;

export interface EnergyFrame {
  bass: number;
  overall: number;
  isBeat: boolean;
}

export interface EnergyTrack {
  fps: number;
  durationInFrames: number;
  frames: EnergyFrame[];
}

export interface CameraWobble {
  /** Peak extra camera tilt in degrees. */
  rotDeg: number;
  /** Peak extra zoom as a fraction, e.g. 0.03 for 3%. */
  zoomPct: number;
  /** Peak extra pan in px. */
  panPx: number;
  /** Seconds per wobble cycle. */
  periodSec: number;
}

export interface CameraSmoothing {
  /** Natural frequency in rad/frame: higher follows the keyframes tighter (0.2 slow, 0.6 snappy). */
  omega: number;
  /** Damping ratio: 1 is critically damped, below 1 leaves a little follow-through overshoot. */
  zeta: number;
}

export interface Storyboard {
  id: string;
  title: string;
  stylePackId: StylePackId;
  fps: number;
  durationInFrames: number;
  audioSrc?: string;
  cameraKeyframes: CameraKeyframe[];
  /** Always-on camera movement layered over the keyframes so held shots never freeze. */
  cameraWobble?: CameraWobble;
  /** Run the camera through a spring so keyframes become eased, continuous motion. */
  cameraSmoothing?: CameraSmoothing;
  graphics: GraphicNode[];
  words: WordNode[];
}
