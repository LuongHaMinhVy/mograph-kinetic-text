import { applyEasing } from "../easing";
import type { ProgressBarGraphicNode } from "../types";

interface ProgressGlowBarProps {
  node: ProgressBarGraphicNode;
  frame: number;
  fps?: number;
  bassEnergy: number;
}

export const ProgressGlowBar = ({
  node,
  frame,
  fps = 24,
  bassEnergy,
}: ProgressGlowBarProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const totalFrames = Math.max(1, node.endFrame - node.startFrame);
  const sweepT = applyEasing(
    Math.min(1, localFrame / Math.min(Math.round(28 * fpsScale), totalFrames)),
    "cubicOut"
  );
  const fillPct = (15 + sweepT * 85).toFixed(1);
  const glowColor = node.glowColor ?? node.startColor;
  const glowSpread = 12 + Math.round(bassEnergy * 10);

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex ?? 16,
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(10, 10, 10, 0.85)",
        borderRadius: node.height / 2,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: `${fillPct}%`,
          height: "100%",
          borderRadius: node.height / 2,
          backgroundImage: `linear-gradient(90deg, ${node.startColor} 0%, ${node.endColor} 100%)`,
          boxShadow: `0 0 ${glowSpread}px ${glowColor}, 0 0 ${Math.round(glowSpread * 0.45)}px #FFFFFF`,
        }}
      />
    </div>
  );
};
