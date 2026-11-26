import type { TextStyle } from "react-native";

export const colors = {
  background: "#F7FAFB",
  backgroundMiddle: "#EFF5F8",
  backgroundEnd: "#E3EDF2",
  lake: "#CDE5EF",
  lakeDeep: "#287393",
  surface: "#FFFFFF",
  surfaceMuted: "#E6EFF4",
  primary: "#267397",
  primaryDark: "#176E96",
  primaryDeep: "#125574",
  text: "#152D3B",
  textMuted: "#465F6E",
  border: "#CADAE2",
  controlBorder: "#708591",
  progressTrack: "#E6EFF4",
  achieved: "#226B49",
  achievedMuted: "#E3F3EA",
  danger: "#B94A48",
  dangerMuted: "#FBEAE8",
  overlay: "rgba(23, 35, 45, 0.58)",
} as const;

export const gradients = {
  screen: {
    colors: [colors.background, colors.backgroundMiddle, colors.backgroundEnd],
  },
  home: {
    colors: [colors.lake, colors.background, colors.backgroundEnd],
    locations: [0, 0.44, 1],
  },
  welcome: {
    colors: [colors.background, colors.lake, colors.lakeDeep],
    locations: [0, 0.65, 1],
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  control: 10,
  button: 12,
  card: 18,
} as const;

export const typography = {
  caption: 12,
  body: 16,
  bodyLineHeight: 23,
  label: 15,
  heading: 22,
  title: 30,
} as const;

export const textStyles = {
  page: { fontSize: typography.title, lineHeight: 37, fontWeight: "700", color: colors.text },
  section: { fontSize: typography.heading, lineHeight: 28, fontWeight: "600", color: colors.text },
  metric: { fontSize: typography.heading, lineHeight: 28, fontWeight: "700", fontVariant: ["tabular-nums"], color: colors.text },
  body: { fontSize: typography.body, lineHeight: typography.bodyLineHeight, fontWeight: "400", color: colors.text },
  label: { fontSize: typography.label, lineHeight: 20, fontWeight: "600", color: colors.text },
  meta: { fontSize: 14, lineHeight: 20, fontWeight: "400", color: colors.textMuted },
  eyebrow: { fontSize: typography.caption, lineHeight: 17, fontWeight: "700", letterSpacing: 0.8, color: colors.primaryDeep },
} satisfies Record<string, TextStyle>;

export const actionColors = {
  primary: { fill: colors.primaryDark, ink: colors.surface, pressed: colors.primaryDeep },
  secondary: { fill: colors.surfaceMuted, ink: colors.primaryDeep, pressed: colors.border },
  danger: { fill: colors.danger, ink: colors.surface, pressed: "#963836" },
  disabled: { fill: colors.surfaceMuted, ink: colors.textMuted, pressed: colors.surfaceMuted },
} as const;

// Use the app window width (dp) and system font scale, not physical screen pixels.
// Keep actions full-width when two columns would leave too little room for text.
export const layout = {
  compactWidth: 390,
  largeFontScale: 1.3,
  minTouchTarget: 48,
  maxContentWidth: 600,
  twoColumnWidth: 760,
  workspaceWidth: 960,
} as const;

export function isCompactLayout(width: number, fontScale: number): boolean {
  return width < layout.compactWidth || fontScale >= layout.largeFontScale;
}

export const branding = {
  headerMark: 40,
  headerWordmark: 18,
  welcomeMark: 80,
  compactWelcomeMark: 64,
  wordmarkTracking: 1,
} as const;

// Shared bottom navigation standard for both client and coach layouts.
// Render through AppTabBar so role-specific destinations never fork the design.
export const navigation = {
  inactiveTint: "#6B7280",
  cornerRadius: spacing.lg,
  overlap: spacing.md,
  centerSlotWidth: layout.minTouchTarget + spacing.md,
  actionSize: layout.minTouchTarget + spacing.sm,
  actionRadius: (layout.minTouchTarget + spacing.sm) / 2,
  actionColor: colors.primaryDeep,
  actionPressedColor: colors.primaryDark,
  actionElevation: 4,
  actionShadowOpacity: 0.2,
} as const;

export const theme = {
  colors,
  gradients,
  spacing,
  radii,
  typography,
  textStyles,
  actionColors,
  layout,
  branding,
  navigation,
} as const;
