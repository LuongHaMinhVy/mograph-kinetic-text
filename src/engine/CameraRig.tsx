import type { ReactNode } from "react";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./StageViewport";
import type { SampledCamera } from "./easing";

interface CameraRigProps {
  camera: SampledCamera;
  frame?: number;
  fps?: number;
  bassEnergy: number;
  isBeat: boolean;
  children: ReactNode;
}

/** World camera transform with deterministic micro-sway, directional smear, and blur. */
export const CameraRig = ({
  camera,
  frame = 0,
  fps = 24,
  bassEnergy,
  isBeat,
  children,
}: CameraRigProps) => {
  const timeSec = frame / Math.max(1, fps);
  const beatBoost = isBeat ? 0.024 : bassEnergy * 0.012;
  const effectiveZoom = camera.zoom * (1 + beatBoost);

  // Subtle deterministic handheld micro-sway + beat kick so held frames breathe organically.
  const kickParity = frame % 2 === 0 ? 1 : -1;
  const swayX =
    Math.sin(timeSec * 1.9) * 2.2 +
    Math.cos(timeSec * 3.1) * 1.0 +
    (isBeat ? kickParity * 1.5 : 0);
  const swayY =
    Math.cos(timeSec * 1.5) * 1.6 +
    Math.sin(timeSec * 2.7) * 0.8 +
    (isBeat ? -kickParity * 1.2 : 0);
  const swayRot = Math.sin(timeSec * 1.3) * 0.22;

  const speedPer24Frame =
    (camera.velocityPx + camera.angularVelocity * 6) * (fps / 24);
  const inWhipWindow = speedPer24Frame > 18 && speedPer24Frame < 340;
  const motionBlurPx = inWhipWindow
    ? Math.min((speedPer24Frame - 18) * 0.026, 2.4)
    : 0;

  let smearX = 1;
  let smearY = 1;
  if (inWhipWindow) {
    const stretch = Math.min(0.045, (speedPer24Frame - 18) * 0.00025);
    if (Math.abs(camera.vxPx) >= Math.abs(camera.vyPx)) {
      smearX = 1 + stretch;
      smearY = 1 - stretch * 0.55;
    } else {
      smearY = 1 + stretch;
      smearX = 1 - stretch * 0.55;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: VIRTUAL_WIDTH,
        height: VIRTUAL_HEIGHT,
        transformOrigin: "0 0",
        transform: `translate(${(VIRTUAL_WIDTH / 2 + swayX).toFixed(2)}px, ${(
          VIRTUAL_HEIGHT / 2 +
          swayY
        ).toFixed(2)}px) scale(${(effectiveZoom * smearX).toFixed(4)}, ${(
          effectiveZoom * smearY
        ).toFixed(4)}) rotate(${(-(camera.rotateDeg + swayRot)).toFixed(
          3
        )}deg) translate(${-camera.x}px, ${-camera.y}px)`,
        filter: motionBlurPx > 0.25 ? `blur(${motionBlurPx.toFixed(2)}px)` : undefined,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
