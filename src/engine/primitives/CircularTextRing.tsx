import { applyEasing, lerp } from "../easing";
import type { CircularTextGraphicNode, StylePackConfig } from "../types";

interface CircularTextRingProps {
  node: CircularTextGraphicNode;
  stylePack: StylePackConfig;
  frame: number;
  fps: number;
}

/**
 * 360-degree circular orbiting text along an SVG ring path, optionally tilted in 3D perspective
 * (modeled after m1hl4m's "Vu tru co anh" rotating neon text rings).
 */
export const CircularTextRing = ({
  node,
  stylePack,
  frame,
  fps,
}: CircularTextRingProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const local = frame - node.startFrame;
  const enterT = applyEasing(Math.min(1, (local + 1) / (10 * fpsScale)), "expoOut");
  const scale = lerp(0.55, 1, enterT);

  let opacity = (node.opacity ?? 0.88) * Math.min(1, (local + 1) / (6 * fpsScale));
  const exitFrames = Math.max(4, Math.round(0.22 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    opacity *= Math.max(0, remaining / exitFrames);
  }

  const r = node.radius;
  const pad = node.fontSize * 1.6 + 24;
  const box = (r + pad) * 2;
  const cx = r + pad;
  const cy = r + pad;
  const spinDeg =
    (node.rotateDeg ?? 0) +
    (node.spinDegPerSec ?? 48) * (local / Math.max(1, fps));
  const tiltX = node.tiltXDeg ?? 0;
  const tiltY = node.tiltYDeg ?? 0;

  const basePhrase = node.text.trim() || "KINETIC";
  const sep = "  /  ";
  const circ = 2 * Math.PI * r;
  const estPhrasePx = (basePhrase.length + sep.length) * node.fontSize * 0.72;
  const repeatCount = Math.max(1, Math.min(8, Math.floor((circ * 0.94) / Math.max(60, estPhrasePx))));
  const ringText = Array.from({ length: repeatCount }, () => basePhrase).join(sep) + (repeatCount > 1 ? sep : "");

  const pathId = `circ-text-${node.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  const fontFamily =
    node.fontRole === "body" ? stylePack.fonts.body : stylePack.fonts.display;
  const glowFilter =
    node.glow !== false && stylePack.postFx.glowStrengthPx > 0
      ? `drop-shadow(0 0 8px ${node.color})`
      : undefined;

  const transform3d =
    Math.abs(tiltX) > 0.1 || Math.abs(tiltY) > 0.1
      ? `perspective(900px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) `
      : "";

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        zIndex: node.zIndex ?? 3,
        opacity,
        filter: glowFilter,
        transform: `translate(-50%, -50%) ${transform3d}scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        style={{
          overflow: "visible",
          transform: `rotate(${spinDeg.toFixed(2)}deg)`,
          transformOrigin: "center center",
        }}
      >
        <defs>
          <path id={pathId} d={pathD} />
        </defs>
        {node.ringStroke ? (
          <circle
            cx={cx}
            cy={cy}
            r={r + node.fontSize * 0.35}
            fill="none"
            stroke={node.ringStroke}
            strokeWidth={node.ringStrokeWidth ?? 12}
            strokeOpacity={0.85}
          />
        ) : null}
        <text
          fill={node.color}
          fontFamily={fontFamily}
          fontSize={node.fontSize}
          fontWeight={node.fontRole === "body" ? 700 : 400}
          letterSpacing="0.06em"
        >
          <textPath href={`#${pathId}`} startOffset="0%">
            {ringText}
          </textPath>
        </text>
      </svg>
    </div>
  );
};
