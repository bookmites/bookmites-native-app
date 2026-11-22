import { colors } from "@/design/tokens";

/**
 * UX font-size tiers (ticket 005). Medium is the product baseline; the other tiers scale it,
 * with Small = 0.85× Medium. Sizes are applied to the root element of each spine document,
 * so publisher styles written in relative units (em/rem/%) scale with the tier.
 */
const MEDIUM_ROOT_PX = 18;

const TIER_MULTIPLIER = {
  small: 0.85,
  medium: 1,
  large: 1.25,
  xl: 1.5,
  "2xl": 1.75,
} as const;

export const READER_FONT_SIZE_TIERS = [
  "small",
  "medium",
  "large",
  "xl",
  "2xl",
] as const;

export type ReaderFontSizeTier = (typeof READER_FONT_SIZE_TIERS)[number];

export const READER_FONT_SIZE_LABELS: Record<ReaderFontSizeTier, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "XL",
  "2xl": "2XL",
};

export const DEFAULT_READER_FONT_SIZE_TIER: ReaderFontSizeTier = "medium";

export function isReaderFontSizeTier(value: string): value is ReaderFontSizeTier {
  return (READER_FONT_SIZE_TIERS as readonly string[]).includes(value);
}

export function readerFontSizePx(tier: ReaderFontSizeTier): number {
  return Math.round(MEDIUM_ROOT_PX * TIER_MULTIPLIER[tier] * 10) / 10;
}

/** Reader stylesheet injected into every spine document for the given settings. */
export function buildReaderCss(tier: ReaderFontSizeTier): string {
  return `
html {
  font-size: ${readerFontSizePx(tier)}px !important;
  background-color: ${colors.background} !important;
}
body {
  font-size: 1rem !important;
  line-height: 1.6;
  color: ${colors.textPrimary};
  background-color: transparent !important;
  overflow-wrap: break-word;
}
img, svg, video {
  max-width: 100%;
  height: auto;
}
`;
}
