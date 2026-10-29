export const colors = {
  // Solid fallback and gradient stops sampled visually from the Figma reference.
  background: "#F7FAFB",
  backgroundMiddle: "#BDD3DC",
  backgroundEnd: "#287393",
  surface: "#FFFFFF",
  surfaceMuted: "#E6EFF4",
  primary: "#599FDB",
  primaryDark: "#176E96",
  text: "#17232D",
  textMuted: "#5B7180",
  border: "#D5E4EF",
  progressTrack: "#E6EFF4",
  success: "#599FDB",
  // Completed-goal state; distinct from primary so "done" doesn't read as "in progress".
  achieved: "#2F8A5B",
  achievedMuted: "#E3F3EA",
  danger: "#B94A48",
  dangerMuted: "#FBEAE8",
  overlay: "rgba(23, 35, 45, 0.58)",
} as const;

export const gradients = {
  screen: {
    colors: [colors.background, colors.backgroundMiddle, colors.backgroundEnd],
    locations: [0, 0.35, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
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
  button: 16,
  card: 24,
} as const;

export const typography = {
  body: 16,
  label: 15,
  heading: 25,
  title: 38,
} as const;

// Use the app window width (dp) and system font scale, not physical screen pixels.
// Keep actions full-width when two columns would leave too little room for text.
export const layout = {
  compactWidth: 390,
  largeFontScale: 1.3,
  minTouchTarget: 48,
  maxContentWidth: 600,
} as const;

export function isCompactLayout(width: number, fontScale: number): boolean {
  return width < layout.compactWidth || fontScale >= layout.largeFontScale;
}

export const theme = {
  colors,
  gradients,
  spacing,
  radii,
  typography,
  layout,
} as const;
