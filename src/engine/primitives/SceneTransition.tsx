import type { CSSProperties } from "react";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "../StageViewport";
import { applyEasing, lerp } from "../easing";
import type { SceneTransitionGraphicNode, StylePackConfig } from "../types";

interface SceneTransitionProps {
  node: SceneTransitionGraphicNode;
  stylePack: StylePackConfig;
  frame: number;
}

/** Full-stage screen-fixed transition overlays between acts and beats. */
export const SceneTransition = ({
  node,
  stylePack,
  frame,
}: SceneTransitionProps) => {
  if (frame < node.startFrame || frame >= node.endFrame) {
    return null;
  }

  const localFrame = frame - node.startFrame;
  const totalFrames = Math.max(1, node.endFrame - node.startFrame);
  const p = Math.min(1, (localFrame + 0.5) / totalFrames);

  const mainColor = node.color ?? stylePack.palette.primary;
  const accentColor = node.accentColor ?? stylePack.palette.highlight;
  const zIndex = node.zIndex ?? 42;
  const baseStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: VIRTUAL_WIDTH,
    height: VIRTUAL_HEIGHT,
    zIndex,
    pointerEvents: "none",
    overflow: "hidden",
  };

  if (node.variant === "inverted-flash") {
    const opacity = Math.max(0, Math.min(0.9, Math.sin(p * Math.PI) * 0.9));
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: node.color ?? "#FFFFFF",
          mixBlendMode: "difference",
          opacity,
        }}
      />
    );
  }

  if (node.variant === "iris-pulse") {
    const scale = lerp(0.18, 2.2, p * p * 0.4 + p * 0.6);
    const opacity =
      p < 0.2 ? lerp(0.4, 0.95, p / 0.2) : lerp(0.95, 0, (p - 0.2) / 0.8);
    return (
      <div style={baseStyle}>
        <div
          style={{
            position: "absolute",
            left: VIRTUAL_WIDTH / 2,
            top: VIRTUAL_HEIGHT / 2,
            width: VIRTUAL_HEIGHT,
            height: VIRTUAL_HEIGHT,
            borderRadius: "50%",
            border: `14px solid ${accentColor}`,
            boxShadow: `0 0 36px ${accentColor}, inset 0 0 28px ${mainColor}`,
            opacity,
            transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          }}
        />
      </div>
    );
  }

  const dir = node.direction ?? (node.variant === "split-shutter" ? "ttb" : "ltr");
  const isHorizontal = dir === "ltr" || dir === "rtl";

  if (node.variant === "split-shutter") {
    const extentPct =
      (p <= 0.45
        ? applyEasing(p / 0.45, "expoOut")
        : 1 - applyEasing((p - 0.45) / 0.55, "cubicOut")) * 50;
    const seamGlow = `0 0 18px ${accentColor}`;
    const panelCommon: CSSProperties = {
      position: "absolute",
      backgroundColor: mainColor,
      boxShadow: seamGlow,
    };

    const firstPanel: CSSProperties = isHorizontal
      ? {
          ...panelCommon,
          left: 0,
          top: 0,
          bottom: 0,
          width: `${extentPct.toFixed(2)}%`,
          borderRight: `6px solid ${accentColor}`,
        }
      : {
          ...panelCommon,
          left: 0,
          right: 0,
          top: 0,
          height: `${extentPct.toFixed(2)}%`,
          borderBottom: `6px solid ${accentColor}`,
        };

    const secondPanel: CSSProperties = isHorizontal
      ? {
          ...panelCommon,
          right: 0,
          top: 0,
          bottom: 0,
          width: `${extentPct.toFixed(2)}%`,
          borderLeft: `6px solid ${accentColor}`,
        }
      : {
          ...panelCommon,
          left: 0,
          right: 0,
          bottom: 0,
          height: `${extentPct.toFixed(2)}%`,
          borderTop: `6px solid ${accentColor}`,
        };

    return (
      <div style={baseStyle}>
        <div style={firstPanel} />
        <div style={secondPanel} />
      </div>
    );
  }

  // curtain-wipe
  const inPhase = p <= 0.45;
  const startPct = inPhase
    ? 0
    : applyEasing((p - 0.45) / 0.55, "cubicOut") * 100;
  const endPct = inPhase ? Math.pow(p / 0.45, 1.8) * 100 : 100;
  const spanPct = Math.max(0, endPct - startPct);

  const curtainStyle: CSSProperties = {
    position: "absolute",
    backgroundColor: mainColor,
    ...(isHorizontal ? { top: 0, bottom: 0 } : { left: 0, right: 0 }),
  };

  if (dir === "ltr") {
    curtainStyle.left = `${startPct.toFixed(2)}%`;
    curtainStyle.width = `${spanPct.toFixed(2)}%`;
    curtainStyle.borderRight = inPhase ? `18px solid ${accentColor}` : undefined;
    curtainStyle.borderLeft = !inPhase ? `18px solid ${accentColor}` : undefined;
  } else if (dir === "rtl") {
    curtainStyle.right = `${startPct.toFixed(2)}%`;
    curtainStyle.width = `${spanPct.toFixed(2)}%`;
    curtainStyle.borderLeft = inPhase ? `18px solid ${accentColor}` : undefined;
    curtainStyle.borderRight = !inPhase ? `18px solid ${accentColor}` : undefined;
  } else if (dir === "ttb") {
    curtainStyle.top = `${startPct.toFixed(2)}%`;
    curtainStyle.height = `${spanPct.toFixed(2)}%`;
    curtainStyle.borderBottom = inPhase ? `18px solid ${accentColor}` : undefined;
    curtainStyle.borderTop = !inPhase ? `18px solid ${accentColor}` : undefined;
  } else {
    curtainStyle.bottom = `${startPct.toFixed(2)}%`;
    curtainStyle.height = `${spanPct.toFixed(2)}%`;
    curtainStyle.borderTop = inPhase ? `18px solid ${accentColor}` : undefined;
    curtainStyle.borderBottom = !inPhase ? `18px solid ${accentColor}` : undefined;
  }

  return (
    <div style={baseStyle}>
      <div style={curtainStyle} />
    </div>
  );
};
