import { applyEasing, lerp } from "../easing";
import type { DoodleGraphicNode } from "../types";

interface DoodleShapeProps {
  node: DoodleGraphicNode;
  frame: number;
  fps: number;
}

function starPoints(points: number, outer: number, inner: number): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    out.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return out.join(" ");
}

/**
 * Small vector decorations that make a stage feel dense: soft stars, glowing moon blobs,
 * a hand-drawn swirl that draws itself on, and a flapping butterfly. All deterministic.
 */
export const DoodleShape = ({ node, frame, fps }: DoodleShapeProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const fpsScale = Math.max(0.25, fps / 24);
  const local = frame - node.startFrame;
  const t = frame / Math.max(1, fps);
  const popT = applyEasing(Math.min(1, (local + 1) / (7 * fpsScale)), "backOut");
  const breathe = 1 + 0.06 * Math.sin(t * Math.PI * 1.8 + (node.phase ?? 0) * Math.PI * 2);
  const scale = lerp(0.4, 1, popT) * breathe;

  let opacity = (node.opacity ?? 1) * Math.min(1, (local + 1) / (5 * fpsScale));
  const exitFrames = Math.max(3, Math.round(0.2 * fps));
  const remaining = node.endFrame - frame;
  if (remaining <= exitFrames) {
    opacity *= Math.max(0, remaining / exitFrames);
  }

  const phase = (node.phase ?? 0) * Math.PI * 2;
  const driftX = Math.sin(t * 0.9 + phase) * (node.driftPx ?? 22);
  const driftY = Math.cos(t * 0.7 + phase) * (node.driftPx ?? 22) * 0.8;
  const rotation = (node.rotateDeg ?? 0) + (node.spinDegPerSec ?? 0) * (local / Math.max(1, fps));
  const size = node.size;
  const color = node.color;
  const filters: string[] = [];
  if (node.blurPx) filters.push(`blur(${node.blurPx}px)`);
  const noGlowShapes = new Set(["swirl", "fineSpokes", "bezierThread", "crossMark", "concentricRing"]);
  if (node.glow !== false && !noGlowShapes.has(node.shape)) {
    filters.push(`drop-shadow(0 0 ${Math.round(size * 0.1)}px ${color})`);
  }

  let body: React.ReactNode = null;
  if (node.shape === "star") {
    const r = size / 2;
    body = (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{ overflow: "visible" }}>
        <polygon
          points={starPoints(5, r * 0.82, r * 0.4)}
          fill={color}
          stroke={color}
          strokeWidth={size * 0.12}
          strokeLinejoin="round"
        />
      </svg>
    );
  } else if (node.shape === "sparkle4") {
    const r = size / 2;
    const c = r * 0.22;
    body = (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{ overflow: "visible" }}>
        <path
          d={`M 0 ${-r} Q ${c} ${-c} ${r} 0 Q ${c} ${c} 0 ${r} Q ${-c} ${c} ${-r} 0 Q ${-c} ${-c} 0 ${-r} Z`}
          fill={color}
        />
      </svg>
    );
  } else if (node.shape === "tiltedRing") {
    const rx = size * 0.5;
    const ry = size * 0.2;
    const sw = Math.max(6, size * 0.055);
    const pad = sw * 2;
    body = (
      <svg
        width={size + pad * 2}
        height={ry * 2 + pad * 2}
        viewBox={`${-rx - pad} ${-ry - pad} ${size + pad * 2} ${ry * 2 + pad * 2}`}
        style={{ overflow: "visible" }}
      >
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={sw} />
        {node.secondaryColor ? (
          <ellipse
            cx={0}
            cy={0}
            rx={rx * 0.84}
            ry={ry * 0.82}
            fill="none"
            stroke={node.secondaryColor}
            strokeWidth={Math.max(2, sw * 0.32)}
            strokeOpacity={0.75}
          />
        ) : null}
      </svg>
    );
  } else if (node.shape === "fineSpokes") {
    const r = size / 2;
    const spokes = 14;
    const lines = Array.from({ length: spokes }, (_, idx) => {
      const a = (Math.PI * 2 * idx) / spokes;
      return (
        <line
          key={idx}
          x1={0}
          y1={0}
          x2={(Math.cos(a) * r).toFixed(1)}
          y2={(Math.sin(a) * r).toFixed(1)}
          stroke={color}
          strokeWidth={1.4}
          strokeOpacity={0.72}
        />
      );
    });
    body = (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{ overflow: "visible" }}>
        {lines}
      </svg>
    );
  } else if (node.shape === "bezierThread") {
    const draw = applyEasing(Math.min(1, (local + 1) / (18 * fpsScale)), "expoOut");
    body = (
      <svg width={size} height={size * 0.55} viewBox="0 0 320 176" style={{ overflow: "visible" }}>
        <path
          d="M 4 148 C 72 16, 134 172, 198 66 C 242 -8, 286 112, 316 24"
          pathLength={1}
          fill="none"
          stroke={color}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
    );
  } else if (node.shape === "crossMark") {
    const r = size / 2;
    const bar = Math.max(8, size * 0.22);
    body = (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{ overflow: "visible" }}>
        <line x1={-r * 0.72} y1={-r * 0.72} x2={r * 0.72} y2={r * 0.72} stroke={color} strokeWidth={bar} strokeLinecap="butt" />
        <line x1={r * 0.72} y1={-r * 0.72} x2={-r * 0.72} y2={r * 0.72} stroke={color} strokeWidth={bar} strokeLinecap="butt" />
      </svg>
    );
  } else if (node.shape === "clockHands") {
    const r = size / 2;
    const minAngle = (local / Math.max(1, fps)) * 52 + (node.phase ?? 0) * 360;
    const hourAngle = minAngle * 0.24 - 110;
    body = (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{ overflow: "visible" }}>
        <g transform={`rotate(${hourAngle.toFixed(2)})`}>
          <line x1={-r * 0.14} y1={0} x2={r * 0.58} y2={0} stroke={color} strokeWidth={4.5} strokeLinecap="round" />
        </g>
        <g transform={`rotate(${minAngle.toFixed(2)})`}>
          <line x1={-r * 0.18} y1={0} x2={r * 0.92} y2={0} stroke={node.secondaryColor ?? color} strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle cx={0} cy={0} r={6} fill="#FFFFFF" stroke={color} strokeWidth={3} />
      </svg>
    );
  } else if (node.shape === "concentricRing") {
    const r = size / 2;
    const sw = Math.max(6, size * 0.048);
    body = (
      <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{ overflow: "visible" }}>
        <circle cx={0} cy={0} r={r - sw} fill="none" stroke={color} strokeWidth={sw} />
        {node.secondaryColor ? (
          <circle
            cx={0}
            cy={0}
            r={(r - sw) * 0.68}
            fill="none"
            stroke={node.secondaryColor}
            strokeWidth={Math.max(3, sw * 0.55)}
          />
        ) : null}
      </svg>
    );
  } else if (node.shape === "moon") {
    body = (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 42% 36%, ${color} 0%, ${color} 38%, rgba(255,240,102,0.0) 74%)`,
        }}
      />
    );
  } else if (node.shape === "swirl") {
    const draw = applyEasing(Math.min(1, (local + 1) / (16 * fpsScale)), "expoOut");
    body = (
      <svg width={size} height={size * 0.46} viewBox="0 0 260 120" style={{ overflow: "visible" }}>
        <path
          d="M 6 74 C 40 -14, 96 128, 140 44 S 222 -14, 254 52"
          pathLength={1}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
    );
  } else {
    // butterfly
    const flap = 0.3 + 0.7 * Math.abs(Math.sin(t * 13 + phase));
    const wing = (dir: number) => (
      <g transform={`scale(${dir * flap}, 1)`}>
        <path d="M 0 0 C 30 -46, 78 -34, 66 2 C 76 38, 34 46, 0 6 Z" fill={color} />
        <path d="M 4 -2 C 26 -18, 48 -12, 52 2" fill="none" stroke={node.secondaryColor ?? "#8A6A00"} strokeWidth={2} strokeOpacity={0.6} />
      </g>
    );
    body = (
      <svg width={size} height={size * 0.8} viewBox="-80 -52 160 104" style={{ overflow: "visible" }}>
        {wing(1)}
        {wing(-1)}
        <line x1={0} y1={-18} x2={0} y2={20} stroke={node.secondaryColor ?? "#8A6A00"} strokeWidth={5} strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        zIndex: node.zIndex ?? 7,
        opacity,
        filter: filters.length > 0 ? filters.join(" ") : undefined,
        transform: `translate(-50%, -50%) translate(${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      {body}
    </div>
  );
};
