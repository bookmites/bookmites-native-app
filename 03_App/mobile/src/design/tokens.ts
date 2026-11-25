export const colors = {
  background: "#f8f7f4",
  surface: "#ffffff",
  textPrimary: "#1a1a1a",
  textSecondary: "#5c5c5c",
  accent: "#000000",
  border: "#e2e0da",
  /** Reader chrome `nav` mode: area behind the scaled page card. */
  readerNavShell: "#e4e9ed",
} as const;

export const readerNavSurfaceRadius = 8;

export const readerNavSurfaceShadow = {
  color: "#1a1a1a",
  offset: { width: 0, height: 4 },
  opacity: 0.14,
  radius: 12,
  elevation: 5,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Uniform scale for `ReaderSurface` in reader chrome `nav` mode (visual only; no epub reflow). */
export const readerNavSurfaceScale = 0.8;

export const readerChromeTransitionMs = 280;

export const typography = {
  title: {
    fontSize: 22,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
} as const;

/**
 * Collapsed chrome containers during read → nav animation (`overflow: hidden` on wrapper).
 * Must fit real layout or icons clip — derived from reader toolbar / section bar padding.
 */
export const readerToolbarMaxHeight = spacing.sm * 4 + 24 + spacing.xs;
export const readerSectionBarMaxHeight =
  spacing.sm * 2 + spacing.md * 2 + typography.body.lineHeight + spacing.xs;