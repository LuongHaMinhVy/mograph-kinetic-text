import { ensureFontsLoaded } from "../engine/fonts";
import type { StylePackConfig } from "../engine/types";

export function createNeonPlexusStylePack(): StylePackConfig {
  const fonts = ensureFontsLoaded();
  return {
    id: "neon-plexus-dark",
    name: "Neon Plexus Dark",
    defaultFps: 30,
    palette: {
      bg: "#06070A",
      bgAlt: "#0C1018",
      primary: "#4EFFB2",
      accent: "#FFF59E",
      accentAlt: "#5B7CFF",
      highlight: "#FF6B5B",
      textPrimary: "#FFFFFF",
      textInverted: "#06070A",
      strokePrimary: "#4EFFB2",
      glowColor: "rgba(78, 255, 178, 0.42)",
    },
    fonts,
    postFx: {
      halftoneOpacity: 0,
      scanlineOpacity: 0.04,
      chromaticShiftPx: 1.5,
      glowStrengthPx: 14,
      vignetteOpacity: 0.34,
      grainOpacity: 0.03,
    },
  };
}
