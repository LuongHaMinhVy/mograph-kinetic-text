import { applyEasing } from "../easing";
import type { StylePackConfig, ZigzagGraphicNode } from "../types";

interface ZigzagTrackProps {
  node: ZigzagGraphicNode;
  stylePack: StylePackConfig;
  frame: number;
  fps?: number;
}

function computeTotalLength(points: Array<[number, number]>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.max(1, len);
}

export const ZigzagTrack = ({
  node,
  stylePack,
  frame,
  fps = 24,
}: ZigzagTrackProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }
  if (node.points.length < 2) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const drawFrames = Math.max(
    1,
    node.drawDurationFrames ?? Math.round(18 * fpsScale)
  );
  const drawT = applyEasing(Math.min(1, localFrame / drawFrames), "cubicOut");

  const xs = node.points.map((p) => p[0]);
  const ys = node.points.map((p) => p[1]);
  const shift =
    typeof node.chromatic === "number"
      ? node.chromatic
      : node.chromatic
      ? stylePack.postFx.chromaticShiftPx
      : 0;

  const pad = Math.ceil(node.strokeWidth * 2 + shift + 18);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;

  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);

  const localPointsAttr = node.points
    .map(([px, py]) => `${(px - minX).toFixed(1)},${(py - minY).toFixed(1)}`)
    .join(" ");

  const totalLength = computeTotalLength(node.points);
  const dashOffset = totalLength * (1 - drawT);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        left: minX,
        top: minY,
        zIndex: node.zIndex ?? 12,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {shift > 0 && (
        <>
          <polyline
            points={localPointsAttr}
            fill="none"
            stroke={stylePack.palette.accent}
            strokeWidth={node.strokeWidth}
            strokeDasharray={totalLength}
            strokeDashoffset={dashOffset}
            strokeLinejoin="miter"
            transform={`translate(${-shift}, 0)`}
            opacity={0.7}
          />
          <polyline
            points={localPointsAttr}
            fill="none"
            stroke={stylePack.palette.highlight}
            strokeWidth={Math.max(1.5, node.strokeWidth * 0.7)}
            strokeDasharray={totalLength}
            strokeDashoffset={dashOffset}
            strokeLinejoin="miter"
            transform={`translate(${shift}, 1)`}
            opacity={0.55}
          />
        </>
      )}
      <polyline
        points={localPointsAttr}
        fill="none"
        stroke={node.stroke}
        strokeWidth={node.strokeWidth}
        strokeDasharray={totalLength}
        strokeDashoffset={dashOffset}
        strokeLinejoin="miter"
      />
    </svg>
  );
};
