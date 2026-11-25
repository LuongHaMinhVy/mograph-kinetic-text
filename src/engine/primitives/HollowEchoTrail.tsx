import type { HollowEchoGraphicNode, StylePackConfig } from "../types";

interface HollowEchoTrailProps {
  node: HollowEchoGraphicNode;
  stylePack: StylePackConfig;
  frame: number;
}

/** Trailing hollow-outlined text copies drifting smoothly across the canvas. */
export const HollowEchoTrail = ({
  node,
  stylePack,
  frame,
}: HollowEchoTrailProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const localFrame = frame - node.startFrame;
  const totalFrames = Math.max(1, node.endFrame - node.startFrame);
  const progress = Math.min(1, localFrame / totalFrames);
  const driftOffset = (node.driftX ?? 0) * progress;
  const count = Math.max(1, Math.min(16, Math.round(node.count)));
  const strokeWidth = node.strokeWidth ?? 2;
  const stepY = node.stepY ?? 0;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: node.x + driftOffset,
        top: node.y,
        zIndex: node.zIndex ?? 14,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {Array.from({ length: count }, (_, idx) => {
        const t = count > 1 ? idx / (count - 1) : 0;
        const opacity = Math.max(0.16, 0.88 - t * 0.68);
        return (
          <span
            key={idx}
            style={{
              position: idx === 0 ? "relative" : "absolute",
              left: idx === 0 ? 0 : idx * node.stepX,
              top: idx === 0 ? 0 : idx * stepY,
              fontFamily: stylePack.fonts.displayNarrow,
              fontWeight: 700,
              fontSize: node.fontSize,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              display: "inline-block",
              color: "transparent",
              WebkitTextStroke: `${strokeWidth}px ${node.strokeColor}`,
              opacity,
            }}
          >
            {node.text}
          </span>
        );
      })}
    </div>
  );
};
