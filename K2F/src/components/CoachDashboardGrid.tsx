import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { colors, isCompactLayout, layout, radii, spacing, textStyles } from "@/theme";

const icons = {
  videos: { ios: "play.rectangle", android: "videocam", web: "videocam" },
  messages: { ios: "message", android: "chat", web: "chat" },
  clients: { ios: "person.2", android: "group", web: "group" },
  activity: { ios: "chart.bar", android: "bar_chart", web: "bar_chart" },
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
            {loading ? <ActivityIndicator color={colors.primaryDark} /> : <SymbolView name={icons[id]} size={spacing.lg} tintColor={colors.primaryDeep} />}
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
  content: { padding: spacing.md, alignItems: "flex-start", gap: spacing.xs },
  iconCircle: { width: spacing.xl, height: spacing.xl, borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  title: { ...textStyles.label, alignSelf: "stretch" },
  summary: { ...textStyles.meta, alignSelf: "stretch" },
  pressed: { backgroundColor: colors.surfaceMuted },
});
