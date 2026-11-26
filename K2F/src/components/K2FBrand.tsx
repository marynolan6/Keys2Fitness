import type { PropsWithChildren } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type TextStyle } from "react-native";
import { branding, colors, isCompactLayout, layout, spacing, textStyles, typography } from "@/theme";

const logo = require("@/assets/images/K2F-Logo.png");

export function PageTitle({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text testID="k2f-page-title" accessibilityRole="header" style={[styles.pageTitle, style]}>{children}</Text>;
}

type Props = { variant?: "header" | "welcome"; coach?: boolean };

export function SectionMasthead({ coach, onBack, backLabel = "Back" }: { coach?: boolean; onBack: () => void; backLabel?: string }) {
  return <View style={styles.masthead}>
    <K2FBrand coach={coach} />
    <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack}
      style={({ pressed }) => [styles.back, pressed && { backgroundColor: colors.surfaceMuted }]}>
      <Text style={styles.backText}>‹ Back</Text>
    </Pressable>
  </View>;
}

export function K2FBrand({ variant = "header", coach = false }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const welcome = variant === "welcome";
  const compact = isCompactLayout(width, fontScale);
  const size = welcome
    ? (compact ? branding.compactWelcomeMark : branding.welcomeMark)
    : branding.headerMark;
  const coachSuffix = compact && fontScale >= layout.largeFontScale ? "\nCOACH" : " / COACH";

  return (
    <View testID={welcome ? "k2f-welcome-brand" : "k2f-section-brand"} accessible accessibilityRole="image" accessibilityLabel={coach ? "Keys2Fitness, coach" : "Keys2Fitness"}
      style={[styles.brand, welcome ? styles.welcome : styles.header]}>
      <Image testID="k2f-logo" source={logo} resizeMode="contain" resizeMethod="resize" accessible={false} style={{ width: size, height: size }} />
      <Text testID="k2f-wordmark" style={welcome ? styles.welcomeName : styles.headerName}>
        {welcome ? "Keys2Fitness" : "KEYS2FITNESS"}{coach && !welcome ? coachSuffix : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  masthead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: spacing.sm },
  back: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center", paddingHorizontal: spacing.sm },
  backText: { ...textStyles.label, color: colors.primaryDeep, textDecorationLine: "underline" },
  pageTitle: { ...textStyles.page, flexShrink: 1 },
  brand: { alignItems: "center", maxWidth: "100%", gap: spacing.sm },
  header: { flexDirection: "row", alignSelf: "flex-start" },
  welcome: { alignSelf: "center" },
  headerName: { flexShrink: 1, color: colors.primaryDeep, fontSize: branding.headerWordmark, fontWeight: "700", letterSpacing: branding.wordmarkTracking },
  welcomeName: { textAlign: "center", color: colors.text, fontSize: typography.heading, fontFamily: Platform.select({ ios: "Georgia", default: "serif" }) },
});
