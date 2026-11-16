import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { colors, isCompactLayout, radii, spacing, typography } from "@/theme";
import { recordedSetResult } from "@/workouts/workoutHistory";
import type { WorkoutHistoryEntry } from "@/workouts/workoutSessionModel";
import { formatWorkoutTime } from "@/workouts/workoutTimer";

// Presentation of the archived snapshot only: no session controller, target
// initialization, assignment lookup or write operation belongs in this view.
export function WorkoutHistoryDetails({ entry }: { entry: WorkoutHistoryEntry }) {
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  return <View style={styles.content}>
    <Text accessibilityRole="header" style={styles.heading}>{entry.title.trim() || "Untitled workout"}</Text>
    <Text style={styles.body}>{entry.session.outcome === "completed" ? "Completed" : "Ended early"}</Text>
    <Text style={styles.muted}>{new Date(entry.session.finishedAt).toLocaleString()} · {formatWorkoutTime(entry.session.timer.elapsedMs)} active</Text>
    <Text style={styles.body}>Read-only record · actual performed sets are shown separately from prescribed targets.</Text>
    {!entry.session.exercises.length && <Text style={styles.body}>No exercise details were recorded for this workout.</Text>}
    {entry.session.exercises.map((exercise) => <View key={exercise.id} style={styles.exercise}>
      <Text accessibilityRole="header" style={styles.label}>{exercise.name.trim() || "Unnamed exercise"}</Text>
      <Text style={styles.body}>{exercise.completed ? "Exercise completed" : "Exercise not complete"}</Text>
      <Text style={styles.muted}>Prescribed target: {exercise.sets} sets × {exercise.reps} reps · {exercise.weight || "Bodyweight"}</Text>
      {exercise.restSeconds !== undefined && <Text style={styles.muted}>Prescribed rest: {exercise.restSeconds} seconds</Text>}
      <Text style={styles.label}>{exercise.actualSets?.length ?? 0} recorded sets</Text>
      {!exercise.actualSets?.length && <Text style={styles.body}>No performed sets were recorded. Prescribed targets are not recorded results.</Text>}
      {exercise.actualSets?.map((set, index) => {
        const result = recordedSetResult(set);
        return <View key={set.id} style={styles.set}>
          <Text style={styles.label}>Set {index + 1} · {result.status}</Text>
          <View style={[styles.values, compact && styles.stacked]}>
            <Text style={styles.body}>{result.reps}</Text>
            <Text style={styles.body}>{result.weight}</Text>
          </View>
        </View>;
      })}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  heading: { color: colors.text, fontSize: typography.heading, fontWeight: "600" },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: typography.label },
  exercise: { backgroundColor: colors.surfaceMuted, borderRadius: radii.control, padding: spacing.md, gap: spacing.sm },
  set: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: spacing.sm, gap: spacing.xs },
  values: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  stacked: { flexDirection: "column", gap: spacing.xs },
});
