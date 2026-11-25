import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import type { WorkoutExercise } from "@/workouts/workout";
import { recordedSetRows } from "@/workouts/workoutHistory";
import { countLabel } from "@/workouts/workoutLabels";

// One read-only view of the actuals for in-session review and archived results.
export function RecordedSets({ exercise, preview = false }: { exercise: WorkoutExercise; preview?: boolean }) {
  const rows = recordedSetRows(exercise);
  if (!rows.length) return preview ? null : <Text style={styles.body}>No sets recorded.</Text>;
  return <View style={styles.list}>
    {!preview && <Text style={styles.label}>{countLabel(rows.length, "recorded set")}</Text>}
    {(preview ? rows.slice(-1) : rows).map((row) => <Text key={row.id} style={styles.body}
      accessibilityLabel={`Set ${row.number}, ${row.reps}, ${row.weight}, ${row.status}`}>
      {`Set ${row.number} · ${row.reps}, ${row.weight}${row.status === "Unconfirmed" ? " (unconfirmed)" : ""}`}
    </Text>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, flexShrink: 1 },
});
