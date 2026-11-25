import { ensureFontsLoaded } from "../engine/fonts";
import type { StylePackConfig } from "../engine/types";

export function createDreamyGlowStylePack(): StylePackConfig {
  const fonts = ensureFontsLoaded();
  return {
    id: "dreamy-glow-dark",
    name: "Dreamy Glow Dark",
    defaultFps: 30,
    palette: {
      bg: "#1F1C22",
      bgAlt: "#141216",
      primary: "#9B5CFF",
      accent: "#FFF066",
      accentAlt: "#FF5C8A",
      highlight: "#FFF6A8",
      textPrimary: "#FFFFFF",
      textInverted: "#1F1C22",
      strokePrimary: "#FFF066",
      glowColor: "rgba(255, 240, 102, 0.45)",
    },
    fonts,
    postFx: {
      halftoneOpacity: 0,
      scanlineOpacity: 0.06,
      chromaticShiftPx: 1,
      glowStrengthPx: 14,
      vignetteOpacity: 0.28,
      grainOpacity: 0.04,
    },
  };
}
