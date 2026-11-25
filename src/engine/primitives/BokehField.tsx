import { useMemo } from "react";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "../StageViewport";
import type { BokehFieldGraphicNode } from "../types";

interface BokehFieldProps {
  node: BokehFieldGraphicNode;
  frame: number;
  fps: number;
}

interface BokehOrb {
  baseX: number;
  baseY: number;
  size: number;
  speedX: number;
  speedY: number;
  phase: number;
  isSparkle: boolean;
  opacity: number;
}

/** Deterministic Mulberry32 PRNG for repeatable per-frame Remotion renders. */
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

/** Deterministic drifting warm bokeh circles and 4-point sparkles. */
export const BokehField = ({ node, frame, fps }: BokehFieldProps) => {
  const orbs = useMemo<BokehOrb[]>(() => {
    const rng = createSeededRng(node.seed ?? 1999);
    const total = Math.max(1, Math.min(48, Math.round(node.count)));
    return Array.from({ length: total }, (_, idx) => {
      const isSparkle = idx % 3 === 0;
      return {
        baseX: rng() * VIRTUAL_WIDTH,
        baseY: rng() * VIRTUAL_HEIGHT,
        size: isSparkle ? 14 + rng() * 14 : 46 + rng() * 96,
        speedX: 0.4 + rng() * 0.7,
        speedY: 0.35 + rng() * 0.65,
        phase: rng() * Math.PI * 2,
        isSparkle,
        opacity: isSparkle ? 0.48 + rng() * 0.36 : 0.16 + rng() * 0.22,
      };
    });
  }, [node.count, node.seed]);

  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const timeSec = frame / Math.max(1, fps);
  const sparkleColor = node.sparkleColor ?? node.color;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: VIRTUAL_WIDTH,
        height: VIRTUAL_HEIGHT,
        zIndex: node.zIndex ?? 4,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {orbs.map((orb, idx) => {
        const dx = Math.sin(timeSec * orb.speedX + orb.phase) * 28;
        const dy = Math.cos(timeSec * orb.speedY + orb.phase * 1.3) * 22;
        const x = orb.baseX + dx;
        const y = orb.baseY + dy;

        if (orb.isSparkle) {
          const pulse =
            0.72 + 0.28 * Math.sin(timeSec * 2.4 + orb.phase);
          return (
            <svg
              key={idx}
              width={orb.size}
              height={orb.size}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${pulse.toFixed(3)})`,
                opacity: orb.opacity,
                filter: `drop-shadow(0 0 6px ${sparkleColor})`,
              }}
            >
              <path
                d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z"
                fill={sparkleColor}
              />
            </svg>
          );
        }

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              backgroundImage: `radial-gradient(circle, ${node.color} 0%, transparent 70%)`,
              opacity: orb.opacity,
              filter: "blur(3px)",
            }}
          />
        );
      })}
    </div>
  );
};
