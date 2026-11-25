import { applyEasing, lerp } from "../easing";
import type { FlowerGraphicNode } from "../types";

interface FlowerCutoutProps {
  node: FlowerGraphicNode;
  frame: number;
  fps: number;
}

/** Deterministic pseudo random in [0, 1) so every render draws the same blossom. */
function hash01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Paper-cut style blossom: layered petals, rim shade, speckled core. Drawn as vector, no assets. */
export const FlowerCutout = ({ node, frame, fps }: FlowerCutoutProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const localFrame = frame - node.startFrame;
  const popT = applyEasing(
    Math.min(1, (localFrame + 1.2 * fpsScale) / (8 * fpsScale)),
    "backOut"
  );
  const scale = lerp(0.55, 1, popT);
  let opacity = (node.opacity ?? 1) * Math.min(1, 0.5 + (localFrame / fpsScale) * 0.1);
  const exitFrames = Math.max(3, Math.round(0.16 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    const exitT = Math.min(1, Math.max(0, (exitFrames - remaining + 1) / exitFrames));
    opacity *= lerp(1, 0, exitT * exitT);
  }

  const rotation =
    (node.rotateDeg ?? 0) + (localFrame / Math.max(1, fps)) * (node.spinDegPerSec ?? 5);
  const petals = Math.max(4, Math.min(12, Math.round(node.petals)));
  const r = node.radius;
  const size = r * 2.4;
  const c = size / 2;
  const rim = node.rimColor ?? node.color;
  const core = node.coreColor ?? "#FFD54A";
  const gradId = `flower-grad-${node.id}`;

  const petalShape = (idx: number, layer: number) => {
    const angle = (idx * 360) / petals + layer * (180 / petals);
    const lengthJitter = 0.9 + hash01(idx * 3 + layer * 11 + 1) * 0.2;
    const len = r * (layer === 0 ? 0.98 : 0.7) * lengthJitter;
    const half = r * (layer === 0 ? 0.36 : 0.27);
    return (
      <path
        key={`${layer}-${idx}`}
        d={`M 0 0 C ${-half} ${-len * 0.28}, ${-half * 1.15} ${-len * 0.82}, 0 ${-len} C ${half * 1.15} ${-len * 0.82}, ${half} ${-len * 0.28}, 0 0 Z`}
        transform={`rotate(${angle.toFixed(2)})`}
        fill={layer === 0 ? `url(#${gradId})` : rim}
        fillOpacity={layer === 0 ? 0.96 : 0.55}
        stroke={rim}
        strokeOpacity={0.35}
        strokeWidth={Math.max(1, r * 0.012)}
      />
    );
  };

  const speckles = Array.from({ length: 16 }, (_, i) => {
    const a = hash01(i * 7 + 2) * Math.PI * 2;
    const d = hash01(i * 13 + 5) * r * 0.12;
    return (
      <circle
        key={i}
        cx={Math.cos(a) * d}
        cy={Math.sin(a) * d}
        r={r * (0.012 + hash01(i * 3 + 9) * 0.018)}
        fill={i % 5 === 0 ? "#2A0A12" : "#FFF3C4"}
      />
    );
  });

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: size,
        height: size,
        zIndex: node.zIndex ?? 5,
        opacity,
        transform: `translate(-50%, -50%) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="100%" r="100%" fx="50%" fy="100%">
            <stop offset="0%" stopColor={rim} />
            <stop offset="55%" stopColor={node.color} />
            <stop offset="100%" stopColor={node.tipColor ?? node.color} />
          </radialGradient>
        </defs>
        <g transform={`translate(${c} ${c})`}>
          {Array.from({ length: petals }, (_, i) => petalShape(i, 0))}
          {Array.from({ length: petals }, (_, i) => petalShape(i, 1))}
          <circle r={r * 0.1} fill={core} />
          <circle r={r * 0.1} fill="none" stroke="#2A0A12" strokeOpacity={0.35} strokeWidth={r * 0.02} />
          {speckles}
        </g>
      </svg>
    </div>
  );
};
