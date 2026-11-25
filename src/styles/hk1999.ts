import { ensureFontsLoaded } from "../engine/fonts";
import type { StylePackConfig } from "../engine/types";

export function createHk1999StylePack(): StylePackConfig {
  const fonts = ensureFontsLoaded();
  return {
    id: "hk-1999-halftone",
    name: "Hong Kong 1999 Halftone",
    defaultFps: 24,
    palette: {
      bg: "#050505",
      bgAlt: "#140404",
      primary: "#F2241B",
      accent: "#00F0FF",
      accentAlt: "#7CFF2E",
      highlight: "#FFE64D",
      textPrimary: "#FFFFFF",
      textInverted: "#090909",
      strokePrimary: "#F2241B",
      glowColor: "rgba(242, 36, 27, 0.55)",
    },
    fonts,
    postFx: {
      halftoneOpacity: 0.14,
      scanlineOpacity: 0.22,
      chromaticShiftPx: 3,
      glowStrengthPx: 6,
      vignetteOpacity: 0.34,
      grainOpacity: 0.08,
    },
  };
}
