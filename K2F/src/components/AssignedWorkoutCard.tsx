import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, layout, radii, spacing, typography } from "@/theme";
import type { AssignedWorkout } from "@/workouts/workout";

type Props = {
  workout: AssignedWorkout | null;
  onOpen: (workoutId: string) => void;
};

export function AssignedWorkoutCard({ workout, onOpen }: Props) {
  if (!workout) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>No workout assigned yet</Text>
        <Text style={styles.summary}>Your next assigned workout will appear here.</Text>
      </View>
    );
  }

  const status = workout.status === "current" ? "Current workout" : "Upcoming workout";
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
      accessibilityLabel={`${status}: ${workout.title}. ${summary}`}
      accessibilityHint="Opens the assigned workout details"
      onPress={() => onOpen(workout.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.title}>{workout.title}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <View style={styles.action}>
        <Text style={styles.actionText}>View workout →</Text>
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
