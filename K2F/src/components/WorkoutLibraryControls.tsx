import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { colors } from "@/theme";
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
    style={({ pressed }) => [styles.catalogRow, pressed && styles.pressed, disabled && styles.disabled]}>
    <Text style={styles.feedback}>{libraryItemLabels[kind]}</Text>
    <Text style={styles.heading}>{title}</Text>
    <Text style={styles.muted}>{summary}</Text>
    {metadata && <Text style={styles.muted}>{metadata}</Text>}
    <Text style={styles.label}>View details →</Text>
  </Pressable>;
}
