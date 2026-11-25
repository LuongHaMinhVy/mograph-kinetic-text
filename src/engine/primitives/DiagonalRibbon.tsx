import { applyEasing, lerp } from "../easing";
import type { RibbonGraphicNode } from "../types";

interface DiagonalRibbonProps {
  node: RibbonGraphicNode;
  frame: number;
  fps?: number;
}

export const DiagonalRibbon = ({ node, frame, fps = 24 }: DiagonalRibbonProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const totalFrames = Math.max(1, node.endFrame - node.startFrame);
  const progress = Math.min(1, localFrame / totalFrames);

  const x =
    node.endX !== undefined ? lerp(node.x, node.endX, progress) : node.x;
  const y =
    node.endY !== undefined ? lerp(node.y, node.endY, progress) : node.y;

  const rotateDeg =
    node.endRotateDeg !== undefined
      ? lerp(node.rotateDeg, node.endRotateDeg, progress)
      : node.rotateDeg;

  // Ensure rapid beat-cut ribbons are already visibly entering on localFrame 0.
  const wipeT = applyEasing(
    Math.min(1, (localFrame + 1.8 * fpsScale) / (7 * fpsScale)),
    "expoOut"
  );
  let clipPath: string | undefined;
  const dir = node.wipeDirection ?? "none";

  if (dir !== "none" && wipeT < 0.999) {
    const pct = ((1 - wipeT) * 100).toFixed(1);
    if (dir === "ltr") clipPath = `inset(0 ${pct}% 0 0)`;
    else if (dir === "rtl") clipPath = `inset(0 0 0 ${pct}%)`;
    else if (dir === "ttb") clipPath = `inset(0 0 ${pct}% 0)`;
    else if (dir === "btt") clipPath = `inset(${pct}% 0 0 0)`;
  }

  const secondary = node.secondaryColor ?? "#FF3B1F";

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex ?? 6,
        transform: `translate(-50%, -50%) rotate(${rotateDeg.toFixed(2)}deg)`,
        transformOrigin: "center center",
        backgroundColor: node.color,
        clipPath,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {node.fireTexture && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(ellipse at 25% 30%, ${secondary} 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, #FF8A1C 0%, transparent 45%), linear-gradient(125deg, transparent 25%, rgba(255, 138, 28, 0.28) 50%, transparent 75%)`,
            opacity: 0.38,
          }}
        />
      )}
      {node.halftone && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(0, 0, 0, 0.36) 1.5px, transparent 1.6px)",
            backgroundSize: "7px 7px",
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
};
