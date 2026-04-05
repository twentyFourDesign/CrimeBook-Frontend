// ─────────────────────────────────────────────
// Design Tokens – Light & Dark Palettes
// Uber / iOS level aesthetic
// ─────────────────────────────────────────────

export const LIGHT = {
  // Backgrounds
  bg:               "#F8FAFF",
  surface:          "#FFFFFF",
  surfaceElevated:  "#FFFFFF",
  surfaceFaint:     "#F1F5F9",

  // Borders
  border:           "#F1F5F9",
  borderStrong:     "#E2E8F0",

  // Text
  text:             "#0F172A",
  textSecondary:    "#475569",
  textTertiary:     "#94A3B8",
  textInverse:      "#FFFFFF",

  // Accent (Blue)
  accent:           "#2563EB",
  accentSoft:       "#EFF6FF",
  accentMuted:      "#DBEAFE",

  // Status colors
  success:          "#16A34A",
  successBg:        "#DCFCE7",
  warning:          "#D97706",
  warningBg:        "#FEF9C3",
  danger:           "#DC2626",
  dangerBg:         "#FEE2E2",

  // Tab bar
  tabBg:            "#FFFFFF",
  tabBorder:        "#E8ECF1",
  tabActive:        "#2563EB",
  tabInactive:      "#94A3B8",

  // Safe area
  safeArea:         "#FFFFFF",

  // Shell
  shellBg:          "#F8FAFF",

  // Card shadow
  shadow:           "#000000",
  shadowOpacity:    0.05,
} as const;

export const DARK = {
  // Backgrounds — true black, like Uber
  bg:               "#000000",
  surface:          "#141414",
  surfaceElevated:  "#1F1F1F",
  surfaceFaint:     "#0A0A0A",

  // Borders — very subtle
  border:           "#2A2A2A",
  borderStrong:     "#3A3A3A",

  // Text — white and greys
  text:             "#FFFFFF",
  textSecondary:    "#A3A3A3",
  textTertiary:     "#525252",
  textInverse:      "#000000",

  // Accent — blue is the ONLY color accent
  accent:           "#276EF1",
  accentSoft:       "#0D1F3C",
  accentMuted:      "#1A3057",

  // Status — muted in dark, nearly monochrome
  success:          "#30D158",
  successBg:        "#0A2010",
  warning:          "#FFD60A",
  warningBg:        "#1F1800",
  danger:           "#FF453A",
  dangerBg:         "#200805",

  // Tab bar
  tabBg:            "#141414",
  tabBorder:        "#2A2A2A",
  tabActive:        "#276EF1",
  tabInactive:      "#525252",

  // Safe area
  safeArea:         "#141414",

  // Shell
  shellBg:          "#000000",

  // Card shadow
  shadow:           "#000000",
  shadowOpacity:    0.6,
} as const;

export type ColorPalette = {
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceFaint: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentSoft: string;
  accentMuted: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  safeArea: string;
  shellBg: string;
  shadow: string;
  shadowOpacity: number;
};
