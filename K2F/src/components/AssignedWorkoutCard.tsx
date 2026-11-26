import { Pressable, StyleSheet, Text, View } from "react-native";

import { actionColors, colors, layout, radii, spacing, textStyles, typography } from "@/theme";
import type { AssignedWorkout } from "@/workouts/workout";
import { countLabel } from "@/workouts/workoutLabels";
import { getWorkoutCardLabels, type WorkoutSession } from "@/workouts/workoutSessionModel";

type Props = {
  workout: AssignedWorkout | null;
  onOpen: (workoutId: string, resume: boolean) => void;
  session?: WorkoutSession | null;
  assignedAt?: string;
  featured?: boolean;
};

export function AssignedWorkoutCard({ workout, onOpen, session = null, assignedAt, featured = false }: Props) {
  if (!workout) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>No workout assigned yet</Text>
        <Text style={styles.summary}>Your next assigned workout will appear here.</Text>
      </View>
    );
  }

  const labels = getWorkoutCardLabels(workout, session);
  const date = assignedAt ? new Date(assignedAt).toLocaleString() : null;
  const status = featured || session ? labels.status : null;
  const action = featured || labels.continuing ? labels.action : "Open workout";
  const summary = [
    workout.scheduleLabel?.trim(),
    countLabel(workout.exercises.length, "exercise"),
    workout.durationMinutes != null && workout.durationMinutes > 0
      ? `${workout.durationMinutes} min`
      : undefined,
  ].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={date
        ? `${labels.continuing ? "Continue" : "Open"} assigned workout ${workout.title} from ${date}. ${[status, summary].filter(Boolean).join(". ")}`
        : `${action}: ${workout.title}. ${[status, summary].filter(Boolean).join(". ")}`}
      accessibilityHint={labels.continuing ? "Continues your saved workout progress" : "Opens the assigned workout details"}
      onPress={() => onOpen(workout.id, labels.continuing)}
      style={({ pressed }) => [styles.card, featured && styles.featured, pressed && styles.pressed]}
    >
      {status && <Text style={styles.status}>{status}</Text>}
      <Text style={featured ? textStyles.page : styles.title}>{workout.title}</Text>
      <Text style={styles.summary}>{summary}</Text>
      {date && <Text style={styles.date}>Assigned {date}</Text>}
      <View style={[styles.action, !featured && styles.secondaryAction]}>
        <Text style={[styles.actionText, !featured && styles.secondaryText]}>{action} →</Text>
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
  featured: { borderLeftWidth: spacing.xs, borderLeftColor: colors.primaryDark },
  title: textStyles.section,
  summary: { color: colors.textMuted, fontSize: typography.body },
  date: { color: colors.textMuted, fontSize: typography.label },
  action: {
    backgroundColor: actionColors.primary.fill,
    borderRadius: radii.button,
    padding: spacing.md,
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
    marginTop: spacing.sm,
    alignItems: "center",
  },
  actionText: { color: colors.surface, fontSize: typography.body, fontWeight: "700" },
  secondaryAction: { backgroundColor: colors.surfaceMuted },
  secondaryText: { color: colors.primaryDark },
});
