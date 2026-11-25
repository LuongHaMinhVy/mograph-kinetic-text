import { Easing } from "remotion";
import type { CameraKeyframe, EasingName } from "./types";

export interface SampledCamera {
  x: number;
  y: number;
  zoom: number;
  rotateDeg: number;
  vxPx: number;
  vyPx: number;
  velocityPx: number;
  angularVelocity: number;
}

const EASING_MAP: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  backOut: Easing.bezier(0.34, 1.48, 0.64, 1),
  cubicOut: (t) => 1 - Math.pow(1 - t, 3),
  whipSnap: Easing.bezier(0.16, 1.0, 0.22, 1.0),
  hold: (t) => (t >= 1 ? 1 : 0),
};

export function applyEasing(t: number, easing: EasingName = "cubicOut"): number {
  const clamped = Math.min(1, Math.max(0, t));
  return EASING_MAP[easing](clamped);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleRawCamera(
  sorted: CameraKeyframe[],
  frame: number
): Omit<SampledCamera, "vxPx" | "vyPx" | "velocityPx" | "angularVelocity"> {
  if (sorted.length === 0) {
    return { x: 600, y: 450, zoom: 1, rotateDeg: 0 };
  }
  if (frame <= sorted[0].frame) {
    const first = sorted[0];
    return { x: first.x, y: first.y, zoom: first.zoom, rotateDeg: first.rotateDeg };
  }
  const last = sorted[sorted.length - 1];
  if (frame >= last.frame) {
    return { x: last.x, y: last.y, zoom: last.zoom, rotateDeg: last.rotateDeg };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i];
    const k1 = sorted[i + 1];
    if (frame >= k0.frame && frame <= k1.frame) {
      const span = k1.frame - k0.frame;
      if (span <= 0) {
        return { x: k1.x, y: k1.y, zoom: k1.zoom, rotateDeg: k1.rotateDeg };
      }
      const rawT = (frame - k0.frame) / span;
      const easedT = applyEasing(rawT, k1.easing ?? "cubicOut");
      return {
        x: lerp(k0.x, k1.x, easedT),
        y: lerp(k0.y, k1.y, easedT),
        zoom: lerp(k0.zoom, k1.zoom, easedT),
        rotateDeg: lerp(k0.rotateDeg, k1.rotateDeg, easedT),
      };
    }
  }

  return { x: last.x, y: last.y, zoom: last.zoom, rotateDeg: last.rotateDeg };
}

const smoothCache = new Map<string, SampledCamera[]>();

/**
 * Camera as a spring chasing the keyframe path. Piecewise keyframes have velocity jumps at every
 * key, which reads as mechanical; the spring turns every target change into continuous
 * acceleration and deceleration. Keyframes flagged `cut` teleport instead (a real hard cut).
 * Deterministic: the whole path is simulated once per keyframe set and cached.
 */
export function sampleSmoothCamera(
  keyframes: CameraKeyframe[],
  frame: number,
  params: { omega: number; zeta: number }
): SampledCamera {
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  const key = `${params.omega}|${params.zeta}|${JSON.stringify(sorted)}`;
  let path = smoothCache.get(key);
  if (!path) {
    const last = sorted.length > 0 ? sorted[sorted.length - 1].frame : 0;
    const total = last + 90;
    const cutFrames = new Set(sorted.filter((k) => k.cut).map((k) => k.frame));
    const first = sampleRawCamera(sorted, 0);
    const state = { x: first.x, y: first.y, zoom: first.zoom, rot: first.rotateDeg };
    const vel = { x: 0, y: 0, zoom: 0, rot: 0 };
    const w2 = params.omega * params.omega;
    const damp = 2 * params.zeta * params.omega;
    path = [];
    for (let f = 0; f <= total; f++) {
      const target = sampleRawCamera(sorted, f);
      if (cutFrames.has(f)) {
        state.x = target.x;
        state.y = target.y;
        state.zoom = target.zoom;
        state.rot = target.rotateDeg;
        vel.x = vel.y = vel.zoom = vel.rot = 0;
      } else {
        const sub = 4;
        const dt = 1 / sub;
        for (let i = 0; i < sub; i++) {
          vel.x += (w2 * (target.x - state.x) - damp * vel.x) * dt;
          vel.y += (w2 * (target.y - state.y) - damp * vel.y) * dt;
          vel.zoom += (w2 * (target.zoom - state.zoom) - damp * vel.zoom) * dt;
          vel.rot += (w2 * (target.rotateDeg - state.rot) - damp * vel.rot) * dt;
          state.x += vel.x * dt;
          state.y += vel.y * dt;
          state.zoom += vel.zoom * dt;
          state.rot += vel.rot * dt;
        }
      }
      const dz = vel.zoom * 300;
      path.push({
        x: state.x,
        y: state.y,
        zoom: state.zoom,
        rotateDeg: state.rot,
        vxPx: vel.x,
        vyPx: vel.y,
        velocityPx: Math.sqrt(vel.x * vel.x + vel.y * vel.y + dz * dz),
        angularVelocity: Math.abs(vel.rot),
      });
    }
    smoothCache.set(key, path);
  }
  return path[Math.min(Math.max(0, Math.round(frame)), path.length - 1)];
}

export function sampleCamera(
  keyframes: CameraKeyframe[],
  frame: number
): SampledCamera {
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  const curr = sampleRawCamera(sorted, frame);
  const prev = sampleRawCamera(sorted, Math.max(0, frame - 1));

  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const dz = (curr.zoom - prev.zoom) * 300;
  const velocityPx = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const angularVelocity = Math.abs(curr.rotateDeg - prev.rotateDeg);

  return {
    ...curr,
    vxPx: dx,
    vyPx: dy,
    velocityPx,
    angularVelocity,
  };
}
