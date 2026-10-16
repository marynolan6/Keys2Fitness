export const colors = {
  background: "#75AFC7",
  surface: "#FFFFFF",
  surfaceMuted: "#E1EEF3",
  primary: "#5B9FD4",
  primaryDark: "#2B6E8C",
  text: "#17232D",
  textMuted: "#5B7180",
  border: "#DCE5E9",
  progressTrack: "#DCE9EE",
  success: "#5B9FD4",
  danger: "#B94A48",
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
  button: 22,
  card: 28,
} as const;

export const typography = {
  body: 16,
  label: 15,
  heading: 25,
  title: 38,
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
} as const;
