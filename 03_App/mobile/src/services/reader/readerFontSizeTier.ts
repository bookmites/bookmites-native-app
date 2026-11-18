import type { Preferences } from "react-native-readium";

/**
 * UX tiers vs Readium `fontSize`. Medium = product baseline (1×).
 * Readium documents fontSize ≈ [1.0, 3.0]; Small uses 1.0 and Medium is scaled
 * so Small = 0.85× Medium visually (ticket 005).
 */
const MEDIUM_BASE = 1 / 0.85;

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

export function readerFontSizeToReadium(tier: ReaderFontSizeTier): number {
  const multiplier = TIER_MULTIPLIER[tier];
  const raw = multiplier * MEDIUM_BASE;
  return Math.min(3, Math.max(1, raw));
}

export function readerFontSizeToPreferences(tier: ReaderFontSizeTier): Preferences {
  return { fontSize: readerFontSizeToReadium(tier) };
}