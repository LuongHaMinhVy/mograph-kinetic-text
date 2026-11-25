import { applyEasing, lerp } from "../easing";
import type { OrbitRingGraphicNode } from "../types";

interface DashedOrbitRingProps {
  node: OrbitRingGraphicNode;
  frame: number;
  fps: number;
}

/** Rotating SVG dashed orbit ring with optional soft glow. */
export const DashedOrbitRing = ({ node, frame, fps }: DashedOrbitRingProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const popT = applyEasing(
    Math.min(1, (localFrame + 1.2 * fpsScale) / (6 * fpsScale)),
    "backOut"
  );
  let scale = lerp(0.72, 1, popT);
  let opacity = Math.min(1, 0.78 + (localFrame / fpsScale) * 0.1);
  const exitFrames = Math.max(3, Math.round(0.18 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    const exitT = Math.min(
      1,
      Math.max(0, (exitFrames - remaining + 1) / exitFrames)
    );
    const easeIn = exitT * exitT;
    scale *= lerp(1, 1.18, easeIn);
    opacity *= lerp(1, 0, easeIn);
  }
  const spinDeg = (localFrame / Math.max(1, fps)) * (node.spinDegPerSec ?? 14);

  const strokeWidth = node.strokeWidth ?? 2.5;
  const pad = Math.ceil(strokeWidth + 14);
  const size = (node.radius + pad) * 2;
  const center = size / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: size,
        height: size,
        zIndex: node.zIndex ?? 9,
        opacity,
        transform: `translate(-50%, -50%) rotate(${spinDeg.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        filter: node.glow ? `drop-shadow(0 0 10px ${node.stroke})` : undefined,
        pointerEvents: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        <circle
          cx={center}
          cy={center}
          r={node.radius}
          fill="none"
          stroke={node.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={node.dashArray ?? "4 10"}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
