import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";
import type { getWorkoutProgress } from "@/workouts/workoutProgress";

export function WorkoutProgressIndicator({ progress }: { progress: ReturnType<typeof getWorkoutProgress> }) {
  const { completed, total, remaining, percentage, isComplete } = progress;
  const text = total === 0 ? "No exercises assigned"
    : `${completed} of ${total} ${total === 1 ? "exercise" : "exercises"} complete · ${remaining} remaining`;
  return <View style={styles.card}>
    <View style={styles.header}>
      <Text accessibilityLiveRegion="polite" style={styles.summary}>{text}</Text>
      <Text style={[styles.percent, isComplete && styles.complete]}>{percentage}%</Text>
    </View>
    <View accessibilityRole="progressbar" accessibilityLabel="Workout progress"
      accessibilityValue={{ min: 0, max: 100, now: percentage, text }} style={styles.track}>
      <View style={[styles.fill, isComplete && styles.completeFill, { width: `${percentage}%` }]} />
    </View>
    {isComplete && <Text style={styles.completeText}>All exercises complete</Text>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.button, padding: spacing.sm, gap: spacing.sm },
  header: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  summary: { flex: 1, color: colors.text, fontSize: typography.label },
  percent: { color: colors.primaryDeep, fontSize: typography.label, fontWeight: "700" },
  track: { height: spacing.sm, borderRadius: radii.control, backgroundColor: colors.progressTrack, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.primaryDark, borderRadius: radii.control },
  complete: { color: colors.achieved },
  completeFill: { backgroundColor: colors.achieved },
  completeText: { color: colors.text, fontSize: typography.label, fontWeight: "600" },
});
