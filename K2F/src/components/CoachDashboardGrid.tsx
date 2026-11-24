import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

const icons = {
  videos: "▶",
  messages: "💬",
  clients: "👥",
  activity: "📊",
} as const;

type Tile = {
  id: keyof typeof icons; title: string; summary: string; action: string; onPress: () => void;
  loading?: boolean;
};

export function CoachDashboardGrid({ tiles }: { tiles: Tile[] }) {
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const [heights, setHeights] = useState<Partial<Record<Tile["id"], number>>>({});
  const minHeight = Math.max(layout.minTouchTarget, ...Object.values(heights));

  return <View style={styles.grid}>
    {tiles.map(({ id, title, summary, action, onPress, loading }) => (
      <Pressable key={id} testID={`coach-tile-${id}`} accessibilityRole="button" accessibilityLabel={action}
        accessibilityHint={`${title}. ${summary}`} accessibilityState={{ disabled: !!loading, busy: !!loading }}
        disabled={loading} onPress={onPress} style={({ pressed }) => [styles.tile, compact && styles.stacked, { minHeight }, pressed && styles.pressed]}>
        {/* Measure natural content, not the stretched card, so the grid can also shrink after rotation. */}
        <View style={styles.content} onLayout={({ nativeEvent }) => {
          const height = Math.ceil(nativeEvent.layout.height);
          setHeights((prev) => prev[id] === height ? prev : { ...prev, [id]: height });
        }}>
          <View style={styles.iconCircle}>
            {loading ? <ActivityIndicator color={colors.primaryDark} /> : <Text accessible={false} allowFontScaling={false} style={styles.icon}>{icons[id]}</Text>}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
      </Pressable>
    ))}
  </View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.sm },
  tile: { width: "48%", backgroundColor: colors.surface, borderRadius: radii.card },
  stacked: { width: "100%" },
  content: { padding: spacing.md, alignItems: "center", gap: spacing.xs },
  iconCircle: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  icon: { fontSize: typography.heading, color: colors.primaryDark },
  title: { color: colors.text, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  summary: { color: colors.textMuted, fontSize: typography.label, textAlign: "center" },
  pressed: { backgroundColor: colors.surfaceMuted },
});
