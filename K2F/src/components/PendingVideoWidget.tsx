import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";
import { getPendingVideos } from "@/videos/mockVideos";

type PendingVideosWidgetProps = {
    onPress: () => void;
};

export function PendingVideosWidget({
    onPress,
}: PendingVideosWidgetProps) {
    const pendingCount = getPendingVideos().length;

    return (
        <Pressable
  accessibilityRole="button"
  onPress={onPress}
  style={({ pressed }) => [
    styles.container,
    pressed && styles.pressed,
  ]}
>
  <View style={styles.iconCircle}>
    <Text style={styles.icon}>▶</Text>

    {pendingCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{pendingCount}</Text>
      </View>
    )}
  </View>

  <Text style={styles.title}>Videos to Review</Text>

  <Text style={styles.subtitle}>
    {pendingCount} pending video{pendingCount === 1 ? "" : "s"}
  </Text>

  <Text style={styles.arrow}>›</Text>
</Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
  width: "100%",
  minHeight: 116,
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.md,
  position: "relative",
  backgroundColor: colors.surface,
  borderRadius: radii.card,
},

iconCircle: {
  width: 52,
  height: 52,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.xs,
  position: "relative",
  borderRadius: 26,
  backgroundColor: colors.surfaceMuted,
},

title: {
  color: colors.text,
  fontSize: typography.body,
  fontWeight: "700",
},

subtitle: {
  marginTop: spacing.xs,
  color: colors.textMuted,
  fontSize: typography.label,
},

badge: {
  position: "absolute",
  top: -7,
  right: -7,
  width: 28,
  height: 28,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 14,
  backgroundColor: colors.primary,
},

badgeText: {
  color: colors.surface,
  fontSize: typography.label,
  fontWeight: "700",
},

arrow: {
  position: "absolute",
  right: spacing.md,
  top: "50%",
  color: colors.primaryDark,
  fontSize: 28,
  transform: [{ translateY: -14 }],
},

pressed: {
  opacity: 0.8,
},
});