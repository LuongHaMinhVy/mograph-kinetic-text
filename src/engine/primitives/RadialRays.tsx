import { applyEasing, lerp } from "../easing";
import type { RadialRaysGraphicNode } from "../types";

interface RadialRaysProps {
  node: RadialRaysGraphicNode;
  frame: number;
  fps: number;
}

export const RadialRays = ({ node, frame, fps }: RadialRaysProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const localFrame = frame - node.startFrame;
  const burstT = applyEasing(Math.min(1, localFrame / 6), "expoOut");
  const scale = lerp(0.2, 1, burstT);
  const spinDeg = (localFrame / Math.max(1, fps)) * (node.spinDegPerSec ?? 16);
  const size = node.radius * 2;
  const center = node.radius;

  const lines: Array<{ x2: number; y2: number }> = [];
  for (let i = 0; i < node.rayCount; i++) {
    const angle = (i * Math.PI * 2) / node.rayCount;
    lines.push({
      x2: center + Math.cos(angle) * node.radius,
      y2: center + Math.sin(angle) * node.radius,
    });
  }

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: size,
        height: size,
        zIndex: node.zIndex ?? 8,
        transform: `translate(-50%, -50%) rotate(${spinDeg.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {lines.map((line, index) => (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={line.x2.toFixed(1)}
            y2={line.y2.toFixed(1)}
            stroke={node.color}
            strokeWidth={1.6}
            strokeOpacity={0.85}
          />
        ))}
      </svg>
    </div>
  );
};
