import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { colors, layout, radii, spacing, textStyles } from "@/theme";
import { libraryItemLabels, type WorkoutLibraryItemKind } from "@/workouts/workoutLibraryBrowse";
import type { WorkoutLibraryState } from "@/workouts/workoutRepositories";

export function WorkoutLibraryLoadStatus({ state, retry }: {
  state: Exclude<WorkoutLibraryState, { status: "ready" }>; retry: () => void;
}) {
  return <View style={styles.card}>
    {state.status === "loading" ? <View style={styles.row} accessibilityState={{ busy: true }}>
      <ActivityIndicator color={colors.primaryDark} />
      <Text accessibilityLiveRegion="polite" style={styles.muted}>Loading workout library…</Text>
    </View> : <>
      <Text accessibilityRole="header" style={styles.heading}>Workout library unavailable</Text>
      <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
      <BuilderButton label="Retry workout library" onPress={retry} />
    </>}
  </View>;
}

export function WorkoutLibraryItemLink({ kind, title, summary, metadata, onPress, disabled }: {
  kind: WorkoutLibraryItemKind; title: string; summary: string; metadata?: string;
  onPress: () => void; disabled: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${kind} details for ${title}${metadata ? `, ${metadata}` : ""}`}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [itemStyles.row, pressed && styles.selected, disabled && styles.disabled]}>
    <View style={itemStyles.copy}>
      <Text style={itemStyles.kind}>{libraryItemLabels[kind]}</Text>
      <Text style={textStyles.section}>{title}</Text>
      <Text style={textStyles.meta}>{summary}</Text>
      {metadata && <Text style={textStyles.meta}>{metadata}</Text>}
    </View>
    <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={spacing.lg} tintColor={colors.primaryDeep} />
  </Pressable>;
}

const itemStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: layout.minTouchTarget, gap: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radii.control },
  copy: { flex: 1, gap: spacing.xs },
  kind: { ...textStyles.meta, color: colors.primaryDeep },
});
