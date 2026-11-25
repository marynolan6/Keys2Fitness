import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { colors, isCompactLayout, spacing, typography } from "@/theme";
import type { WorkoutExercise } from "@/workouts/workout";
import { recordedSetRows } from "@/workouts/workoutHistory";
import { countLabel } from "@/workouts/workoutLabels";

// One read-only view of the actuals for in-session review and archived results.
export function RecordedSets({ exercise, preview = false }: { exercise: WorkoutExercise; preview?: boolean }) {
  const { width, fontScale } = useWindowDimensions();
  const rows = recordedSetRows(exercise);
  if (preview) {
    const last = rows.at(-1);
    return last ? <Text style={styles.body}>Logged · Set {last.number}: {last.reps} · {last.weight}</Text> : null;
  }
  if (!rows.length) return <Text style={styles.body}>No sets recorded.</Text>;
  return <View style={styles.list}>
    <Text style={styles.label}>{countLabel(rows.length, "recorded set")}</Text>
    {rows.map((row) => <View key={row.id} style={styles.row}>
      <Text style={styles.label}>Set {row.number} · {row.status}</Text>
      <View style={[styles.values, isCompactLayout(width, fontScale) && styles.stacked]}>
        <Text style={styles.body}>{row.reps}</Text>
        <Text style={styles.body}>{row.weight}</Text>
      </View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: spacing.sm, gap: spacing.xs },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  values: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.md, rowGap: spacing.xs },
  stacked: { flexDirection: "column" },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, flexShrink: 1 },
});
