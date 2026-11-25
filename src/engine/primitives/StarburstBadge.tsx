import { applyEasing, lerp } from "../easing";
import type { StarburstGraphicNode, StylePackConfig } from "../types";

interface StarburstBadgeProps {
  node: StarburstGraphicNode;
  stylePack: StylePackConfig;
  frame: number;
  fps: number;
  bassEnergy: number;
  isBeat: boolean;
}

function buildStarPolygonPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  pointCount: number
): string {
  const coords: string[] = [];
  const totalVertices = pointCount * 2;
  for (let i = 0; i < totalVertices; i++) {
    const angle = (i * Math.PI) / pointCount - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    coords.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return coords.join(" ");
}

export const StarburstBadge = ({
  node,
  stylePack,
  frame,
  fps,
  bassEnergy,
  isBeat,
}: StarburstBadgeProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const popT = Math.min(1, (localFrame + 1.2 * fpsScale) / (5 * fpsScale));
  const popScale = lerp(0.55, 1, applyEasing(popT, "backOut"));
  const beatScale =
    node.pulseOnBeat !== false
      ? 1 + (isBeat ? 0.08 : bassEnergy * 0.04)
      : 1;

  const spinDeg = (localFrame / Math.max(1, fps)) * (node.spinDegPerSec ?? 22);
  let exitScale = 1;
  let extraSpin = 0;
  let opacity = 1;
  const exitFrames = Math.max(3, Math.round(0.16 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    const exitT = Math.min(
      1,
      Math.max(0, (exitFrames - remaining + 1) / exitFrames)
    );
    const easeIn = exitT * exitT;
    exitScale = lerp(1, 0.45, easeIn);
    extraSpin = easeIn * 28;
    opacity = lerp(1, 0, easeIn);
  }

  const scale = popScale * beatScale * exitScale;

  const shift =
    typeof node.chromatic === "number"
      ? node.chromatic
      : node.chromatic
      ? stylePack.postFx.chromaticShiftPx
      : 0;

  const pad = Math.ceil((node.strokeWidth ?? 4) + shift + 12);
  const size = (node.radius + pad) * 2;
  const center = size / 2;
  const pointsAttr = buildStarPolygonPoints(
    center,
    center,
    node.radius,
    node.radius * node.innerRatio,
    node.points
  );

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: size,
        height: size,
        zIndex: node.zIndex ?? 10,
        opacity,
        transform: `translate(-50%, -50%) rotate(${(spinDeg + extraSpin).toFixed(
          2
        )}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible" }}
      >
        {shift > 0 && (
          <>
            <polygon
              points={pointsAttr}
              fill="none"
              stroke={stylePack.palette.accent}
              strokeWidth={node.strokeWidth ?? 2.5}
              transform={`translate(${-shift}, 0)`}
              opacity={0.78}
            />
            <polygon
              points={pointsAttr}
              fill="none"
              stroke={stylePack.palette.primary}
              strokeWidth={node.strokeWidth ?? 2.5}
              transform={`translate(${shift}, 0)`}
              opacity={0.78}
            />
          </>
        )}
        <polygon
          points={pointsAttr}
          fill={node.fill}
          stroke={node.stroke ?? "none"}
          strokeWidth={node.strokeWidth ?? 0}
          strokeLinejoin="miter"
        />
      </svg>
    </div>
  );
};
