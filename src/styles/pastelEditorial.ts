import { ensureFontsLoaded } from "../engine/fonts";
import type { StylePackConfig } from "../engine/types";

export function createPastelEditorialStylePack(): StylePackConfig {
  const fonts = ensureFontsLoaded();
  return {
    id: "pastel-editorial-light",
    name: "Pastel Editorial Light",
    defaultFps: 30,
    palette: {
      bg: "#FCFCFD",
      bgAlt: "#121318",
      primary: "#6E6BF5",
      accent: "#FF5A5F",
      accentAlt: "#8EF0B0",
      highlight: "#FFE46B",
      textPrimary: "#14151A",
      textInverted: "#FFFFFF",
      strokePrimary: "#14151A",
      glowColor: "rgba(110, 107, 245, 0.22)",
    },
    fonts,
    postFx: {
      halftoneOpacity: 0,
      scanlineOpacity: 0,
      chromaticShiftPx: 1,
      glowStrengthPx: 0,
      vignetteOpacity: 0,
      grainOpacity: 0.02,
    },
  };
}
