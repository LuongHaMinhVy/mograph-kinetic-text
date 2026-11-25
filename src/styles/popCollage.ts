import { ensureFontsLoaded } from "../engine/fonts";
import type { StylePackConfig } from "../engine/types";

export function createPopCollageStylePack(): StylePackConfig {
  const fonts = ensureFontsLoaded();
  return {
    id: "pop-collage-light",
    name: "Pop Collage Light",
    defaultFps: 30,
    palette: {
      bg: "#FAFAFA",
      bgAlt: "#0D0D0F",
      primary: "#F25C2A",
      accent: "#5A18F0",
      accentAlt: "#88D498",
      highlight: "#3A66FF",
      textPrimary: "#111114",
      textInverted: "#FFFFFF",
      strokePrimary: "#111114",
      glowColor: "rgba(90, 24, 240, 0.25)",
    },
    fonts,
    postFx: {
      halftoneOpacity: 0,
      scanlineOpacity: 0,
      chromaticShiftPx: 2,
      glowStrengthPx: 0,
      vignetteOpacity: 0,
      grainOpacity: 0.03,
    },
  };
}
