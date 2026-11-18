export const colors = {
  background: "#f8f7f4",
  surface: "#ffffff",
  textPrimary: "#1a1a1a",
  textSecondary: "#5c5c5c",
  accent: "#000000",
  border: "#e2e0da",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

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