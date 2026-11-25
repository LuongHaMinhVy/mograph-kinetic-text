import type { ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

export const VIRTUAL_WIDTH = 1200;
export const VIRTUAL_HEIGHT = 900;

interface StageViewportProps {
  backgroundColor: string;
  /** Screen-fixed decor that must sit behind world-space text (low zIndex). */
  backFixedLayer?: ReactNode;
  worldLayer: ReactNode;
  screenFixedLayer?: ReactNode;
  postFxLayer?: ReactNode;
}

export const StageViewport = ({
  backgroundColor,
  backFixedLayer,
  worldLayer,
  screenFixedLayer,
  postFxLayer,
}: StageViewportProps) => {
  const { width, height } = useVideoConfig();
  const scale = Math.min(width / VIRTUAL_WIDTH, height / VIRTUAL_HEIGHT);
  const offsetX = (width - VIRTUAL_WIDTH * scale) / 2;
  const offsetY = (height - VIRTUAL_HEIGHT * scale) / 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: VIRTUAL_WIDTH,
          height: VIRTUAL_HEIGHT,
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
          overflow: "visible",
        }}
      >
        {backFixedLayer}
        {worldLayer}
        {screenFixedLayer}
      </div>
      {postFxLayer}
    </AbsoluteFill>
  );
};
