import { useMemo } from "react";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "../StageViewport";
import type { PlexusFieldGraphicNode } from "../types";

interface PlexusFieldProps {
  node: PlexusFieldGraphicNode;
  frame: number;
  fps: number;
}

interface PlexusPoint {
  baseX: number;
  baseY: number;
  radius: number;
  speedX: number;
  speedY: number;
  ampX: number;
  ampY: number;
  phase: number;
}

function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic 3D-feel wireframe constellation mesh inspired by m1hl4m dark neon edits:
 * drifting nodes connected by thin translucent lines whose alpha scales with distance.
 */
export const PlexusField = ({ node, frame, fps }: PlexusFieldProps) => {
  const points = useMemo<PlexusPoint[]>(() => {
    const rng = createSeededRng(node.seed ?? 4141);
    const total = Math.max(8, Math.min(44, Math.round(node.count)));
    return Array.from({ length: total }, () => ({
      baseX: rng() * VIRTUAL_WIDTH,
      baseY: rng() * VIRTUAL_HEIGHT,
      radius: 1.8 + rng() * 2.4,
      speedX: 0.35 + rng() * 0.65,
      speedY: 0.3 + rng() * 0.6,
      ampX: 24 + rng() * 52,
      ampY: 20 + rng() * 44,
      phase: rng() * Math.PI * 2,
    }));
  }, [node.count, node.seed]);

  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const timeSec = frame / Math.max(1, fps);
  const maxDist = node.maxLinkDist ?? 215;
  const lineColor = node.lineColor ?? node.color;
  const baseOpacity = node.opacity ?? 0.34;

  const current = points.map((p) => ({
    x: p.baseX + Math.sin(timeSec * p.speedX + p.phase) * p.ampX,
    y: p.baseY + Math.cos(timeSec * p.speedY + p.phase * 1.2) * p.ampY,
    r: p.radius,
  }));

  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; alpha: number }> = [];
  for (let i = 0; i < current.length; i++) {
    for (let j = i + 1; j < current.length; j++) {
      const dx = current[i].x - current[j].x;
      const dy = current[i].y - current[j].y;
      const d = Math.hypot(dx, dy);
      if (d <= maxDist) {
        const alpha = Math.pow(1 - d / maxDist, 1.35) * 0.72;
        edges.push({
          x1: current[i].x,
          y1: current[i].y,
          x2: current[j].x,
          y2: current[j].y,
          alpha,
        });
      }
    }
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: VIRTUAL_WIDTH,
        height: VIRTUAL_HEIGHT,
        zIndex: node.zIndex ?? 2,
        opacity: baseOpacity,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg
        width={VIRTUAL_WIDTH}
        height={VIRTUAL_HEIGHT}
        viewBox={`0 0 ${VIRTUAL_WIDTH} ${VIRTUAL_HEIGHT}`}
      >
        {edges.map((e, idx) => (
          <line
            key={`e-${idx}`}
            x1={e.x1.toFixed(1)}
            y1={e.y1.toFixed(1)}
            x2={e.x2.toFixed(1)}
            y2={e.y2.toFixed(1)}
            stroke={lineColor}
            strokeWidth={1.15}
            strokeOpacity={e.alpha.toFixed(3)}
          />
        ))}
        {current.map((p, idx) => (
          <circle
            key={`p-${idx}`}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={p.r.toFixed(2)}
            fill={node.color}
            fillOpacity={0.85}
          />
        ))}
      </svg>
    </div>
  );
};
