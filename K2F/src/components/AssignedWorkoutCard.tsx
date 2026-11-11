import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, layout, radii, spacing, typography } from "@/theme";
import type { AssignedWorkout } from "@/workouts/workout";
import { getWorkoutCardLabels, type WorkoutSession } from "@/workouts/workoutSessionModel";

type Props = {
  workout: AssignedWorkout | null;
  onOpen: (workoutId: string) => void;
  session?: WorkoutSession | null;
  loading?: boolean;
};

export function AssignedWorkoutCard({ workout, onOpen, session = null, loading = false }: Props) {
  if (!workout) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>No workout assigned yet</Text>
        <Text style={styles.summary}>Your next assigned workout will appear here.</Text>
      </View>
    );
  }

  const labels = getWorkoutCardLabels(workout, session);
  const status = loading ? "Checking workout..." : labels.status;
  const action = loading ? "Loading..." : labels.action;
  const summary = [
    workout.scheduleLabel?.trim(),
    `${workout.exercises.length} ${workout.exercises.length === 1 ? "exercise" : "exercises"}`,
    workout.durationMinutes != null && workout.durationMinutes > 0
      ? `${workout.durationMinutes} min`
      : undefined,
  ].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action}: ${workout.title}. ${status}. ${summary}`}
      accessibilityHint={labels.continuing ? "Continues your saved workout progress" : "Opens the assigned workout details"}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={() => onOpen(workout.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.title}>{workout.title}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <View style={styles.action}>
        <Text style={styles.actionText}>{action} →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  status: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "700" },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "300" },
  summary: { color: colors.textMuted, fontSize: typography.body },
  action: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    padding: spacing.md,
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
    marginTop: spacing.sm,
    alignItems: "center",
  },
  actionText: { color: colors.surface, fontSize: typography.body, fontWeight: "700" },
});
