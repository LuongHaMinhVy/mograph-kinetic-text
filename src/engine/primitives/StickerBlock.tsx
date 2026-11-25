import { applyEasing, lerp } from "../easing";
import type { StickerBlockGraphicNode } from "../types";

interface StickerBlockProps {
  node: StickerBlockGraphicNode;
  frame: number;
  fps?: number;
}

/** Tilted solid collage rectangle with coupled clip-slide entrance and exit. */
export const StickerBlock = ({ node, frame, fps = 24 }: StickerBlockProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const popT = applyEasing(
    Math.min(1, (localFrame + 1.2 * fpsScale) / (5 * fpsScale)),
    "backOut"
  );
  const wipeE = applyEasing(
    Math.min(1, (localFrame + 1.2 * fpsScale) / (6 * fpsScale)),
    "expoOut"
  );
  const scale = lerp(0.78, 1, popT);
  let opacity = Math.min(1, 0.78 + (localFrame / fpsScale) * 0.12);
  let extraX = lerp(-24, 0, wipeE);
  let clipPath: string | undefined =
    wipeE < 0.999 ? `inset(0 ${((1 - wipeE) * 100).toFixed(1)}% 0 0)` : undefined;

  const exitFrames = Math.max(3, Math.round(0.18 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    const exitT = Math.min(
      1,
      Math.max(0, (exitFrames - remaining + 1) / exitFrames)
    );
    const easeIn = exitT * exitT;
    clipPath = `inset(0 0 0 ${(easeIn * 100).toFixed(1)}%)`;
    extraX += easeIn * 24;
    opacity *= lerp(1, 0.1, easeIn);
  }

  const rotateDeg = node.rotateDeg ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex ?? 12,
        opacity,
        clipPath,
        backgroundColor: node.color,
        border:
          node.borderWidth && node.borderColor
            ? `${node.borderWidth}px solid ${node.borderColor}`
            : undefined,
        boxShadow:
          node.shadow !== false ? "0 12px 26px rgba(0, 0, 0, 0.16)" : undefined,
        transform: `translate(-50%, -50%) translateX(${extraX.toFixed(
          1
        )}px) rotate(${rotateDeg.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    />
  );
};
