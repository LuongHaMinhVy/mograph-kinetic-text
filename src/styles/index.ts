import type { StylePackConfig, StylePackId } from "../engine/types";
import { createDreamyGlowStylePack } from "./dreamyGlow";
import { createHk1999StylePack } from "./hk1999";
import { createNeonPlexusStylePack } from "./neonPlexus";
import { createPastelEditorialStylePack } from "./pastelEditorial";
import { createPopCollageStylePack } from "./popCollage";

export const STYLE_PACKS: Record<StylePackId, () => StylePackConfig> = {
  "hk-1999-halftone": createHk1999StylePack,
  "pop-collage-light": createPopCollageStylePack,
  "dreamy-glow-dark": createDreamyGlowStylePack,
  "neon-plexus-dark": createNeonPlexusStylePack,
  "pastel-editorial-light": createPastelEditorialStylePack,
};

export function getStylePack(id: StylePackId): StylePackConfig {
  return STYLE_PACKS[id]();
}
