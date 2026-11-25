import type { StylePackConfig } from "../types";

interface PostProcessFXProps {
  stylePack: StylePackConfig;
}

export const PostProcessFX = ({ stylePack }: PostProcessFXProps) => {
  const { halftoneOpacity, scanlineOpacity, vignetteOpacity, grainOpacity } =
    stylePack.postFx;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {halftoneOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255, 255, 255, 0.16) 1px, transparent 1.2px)",
            backgroundSize: "6px 6px",
            opacity: halftoneOpacity,
          }}
        />
      )}
      {scanlineOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 4px)",
            opacity: scanlineOpacity,
          }}
        />
      )}
      {grainOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, transparent 1px, transparent 3px)",
            opacity: grainOpacity,
          }}
        />
      )}
      {vignetteOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(ellipse at center, transparent 58%, rgba(0, 0, 0, ${vignetteOpacity}) 100%)`,
          }}
        />
      )}
    </div>
  );
};
