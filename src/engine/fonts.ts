import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadNotoSerif } from "@remotion/google-fonts/NotoSerif";

let initialized = false;

export interface LoadedFontFamilies {
  display: string;
  displayNarrow: string;
  body: string;
  serif: string;
}

const CJK_SANS =
  '"Microsoft JhengHei", "Microsoft YaHei", "PingFang TC", "Noto Sans CJK TC", sans-serif';

const CJK_FALLBACK =
  '"PMingLiU", "MingLiU", "Microsoft JhengHei", "PingFang TC", serif';

let cachedFamilies: LoadedFontFamilies = {
  display: `"Anton", "Impact", ${CJK_SANS}`,
  displayNarrow: `"Oswald", "Anton", ${CJK_SANS}`,
  body: `"Be Vietnam Pro", "Segoe UI", ${CJK_SANS}`,
  serif: `"Noto Serif", ${CJK_FALLBACK}`,
};

export function ensureFontsLoaded(): LoadedFontFamilies {
  if (initialized) {
    return cachedFamilies;
  }
  initialized = true;

  try {
    const anton = loadAnton("normal", {
      weights: ["400"],
      subsets: ["vietnamese", "latin"],
    });
    const oswald = loadOswald("normal", {
      weights: ["500", "700"],
      subsets: ["vietnamese", "latin"],
    });
    const beVietnam = loadBeVietnamPro("normal", {
      weights: ["500", "700", "900"],
      subsets: ["vietnamese", "latin"],
    });
    const notoSerif = loadNotoSerif("normal", {
      weights: ["400", "700"],
      subsets: ["vietnamese", "latin"],
    });

    cachedFamilies = {
      display: `"${anton.fontFamily}", "Impact", ${CJK_SANS}`,
      displayNarrow: `"${oswald.fontFamily}", "${anton.fontFamily}", ${CJK_SANS}`,
      body: `"${beVietnam.fontFamily}", "Segoe UI", ${CJK_SANS}`,
      serif: `"${notoSerif.fontFamily}", ${CJK_FALLBACK}`,
    };
  } catch {
    // Keep clean fallback stack if font loading runs in a restricted environment.
  }

  return cachedFamilies;
}
