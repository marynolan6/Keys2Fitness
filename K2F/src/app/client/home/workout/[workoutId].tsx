import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { getWorkoutById } from "@/workouts/mockWorkout";
import type { AssignedWorkout } from "@/workouts/workout";

export default function WorkoutDetails() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const router = useRouter();
    const workout = getWorkoutById(workoutId);

    if (!workout) {
      return (
        <ThemedBackground>
        <View style={styles.content}>
          <Text style={styles.title}>Workout unavailable</Text>
          <Text style={styles.subtitle}>This workout could not be found.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.finishButton}
            onPress={() => router.replace("/client/home")}
          >
            <Text style={styles.finishButtonText}>Back to dashboard</Text>
          </Pressable>
        </View>
        </ThemedBackground>
      );
    }

    return <WorkoutContent key={workout.id} workout={workout} />;
}

function WorkoutContent({ workout }: { workout: AssignedWorkout }) {
    const { width, fontScale } = useWindowDimensions();
    const compact = isCompactLayout(width, fontScale);
    const workoutId = workout.id;
    const [exercises, setExercises] = useState(workout.exercises);
    const [showNotes, setShowNotes] = useState(false);

    const completedCount = exercises.filter((exercise) => exercise.completed).length;
    const progress = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0;

    const router = useRouter();

    function toggleExercise(id: string) {
        setExercises((current) =>
            current.map((exercise) =>
                exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise,
            ),
        );
    }

return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>KEYS2FITNESS</Text>
        <Text style={styles.screenNumber}>03</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <View style={[styles.subtitleRow, compact && styles.subtitleRowCompact]}>
          <Text style={[styles.subtitle, styles.subtitleText]}>
            {[workout.status === "current" ? "Current workout" : "Upcoming workout", workout.scheduleLabel].filter(Boolean).join(" · ")}
          </Text>
          {workout.notes?.trim() && <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showNotes }}
            onPress={() => setShowNotes((visible) => !visible)}
            style={[styles.notesToggle, compact && styles.notesToggleCompact]}
          >
            <Text style={styles.notesToggleText}>
              {showNotes ? "Hide notes" : "Notes"}
            </Text>
          </Pressable>}
        </View>

        {showNotes && workout.notes?.trim() && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Workout notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        <View style={styles.progressCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Workout progress</Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.rowBetween}>
              <View style={styles.exerciseText}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.prescription}>
                  {exercise.sets} sets × {exercise.reps} reps · {exercise.weight}
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`${exercise.name} completed`}
                accessibilityState={{ checked: exercise.completed }}
                onPress={() => toggleExercise(exercise.id)}
                style={[
                  styles.checkbox,
                  exercise.completed && styles.checkboxCompleted,
                ]}
              >
                {exercise.completed && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            </View>

            <View style={[styles.buttonRow, compact && styles.buttonRowCompact]}>
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                <Text style={styles.secondaryButtonText}>+ Add Set</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
                <Text style={styles.secondaryButtonText}>− Remove Set</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${exercise.name} details`}
              style={({ pressed }) => [styles.secondaryButton, styles.detailsButton, pressed && styles.buttonPressed]}
              onPress={() =>
                router.push({
                  pathname:
                    "/client/home/workout/[workoutId]/exercise/[exerciseId]",
                  params: {
                    workoutId: String(workoutId),
                    exerciseId: exercise.id,
                    name: exercise.name,
                    sets: String(exercise.sets),
                    reps: String(exercise.reps),
                    weight: exercise.weight,
                  },
                })
              }
            >
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </Pressable>
          </View>
        ))}


        <View style={[styles.buttonRow, compact && styles.buttonRowCompact]}>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.secondaryButtonText}>+ Add Exercise</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.secondaryButtonText}>− Remove Exercise</Text>
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [styles.finishButton, pressed && styles.buttonPressed]}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </Pressable>

      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
  },
  screenNumber: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  subtitleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  subtitleRowCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: spacing.sm,
  },
  subtitleText: {
    flex: 1,
    marginTop: 0,
  },
  notesToggle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    marginLeft: spacing.sm,
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesToggleCompact: { marginLeft: 0 },
  notesToggleText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  notesTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  notesText: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    flexShrink: 1,
  },
  progressText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  progressTrack: {
    backgroundColor: colors.progressTrack,
    borderRadius: radii.control,
    height: 14,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    height: "100%",
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  exerciseText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  exerciseName: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
  },
  prescription: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 3,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
    flexShrink: 0,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  buttonRowCompact: { flexDirection: "column" },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    flexGrow: 1,
    flexBasis: 0,
    justifyContent: "center",
    minHeight: layout.minTouchTarget + spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  detailsButton: { marginTop: spacing.sm },
  buttonPressed: { opacity: 0.75 },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    textAlign: "center",
  },
  finishButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: layout.minTouchTarget + spacing.md,
  },
  finishButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
