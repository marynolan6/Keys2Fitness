import { Image, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { branding, colors, isCompactLayout, layout, spacing, typography } from "@/theme";

const logo = require("@/assets/images/K2F-Logo.png");

type Props = { variant?: "header" | "welcome"; coach?: boolean };

export function K2FBrand({ variant = "header", coach = false }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const welcome = variant === "welcome";
  const compact = isCompactLayout(width, fontScale);
  const size = welcome
    ? (compact ? branding.compactWelcomeMark : branding.welcomeMark)
    : branding.headerMark;
  const coachSuffix = compact && fontScale >= layout.largeFontScale ? "\nCOACH" : " / COACH";

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={coach ? "Keys2Fitness, coach" : "Keys2Fitness"}
      style={[styles.brand, welcome ? styles.welcome : styles.header]}>
      <Image source={logo} resizeMode="contain" resizeMethod="resize" accessible={false} style={{ width: size, height: size }} />
      <Text style={welcome ? styles.welcomeName : styles.headerName}>
        {welcome ? "Keys2Fitness" : "KEYS2FITNESS"}{coach && !welcome ? coachSuffix : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", maxWidth: "100%", gap: spacing.sm },
  header: { flexDirection: "row", alignSelf: "flex-start" },
  welcome: { alignSelf: "center" },
  headerName: { flexShrink: 1, color: colors.primaryDeep, fontSize: typography.label, fontWeight: "700", letterSpacing: branding.wordmarkTracking },
  welcomeName: { textAlign: "center", color: colors.text, fontSize: typography.heading, fontFamily: Platform.select({ ios: "Georgia", default: "serif" }) },
});
