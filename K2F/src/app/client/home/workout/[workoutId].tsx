import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ExerciseDetailsModal } from "@/components/ExerciseDetailsModal";
import { useLocalSearchParams, useRouter } from "expo-router";
// K2F-43: useEffect loads a previously paused workout when the client opens the workout screen.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
// K2F-43: Functions used to save, restore, and clear a paused workout from local storage.
import {
  saveWorkoutSession,
  loadWorkoutSession,
  clearWorkoutSession,
} from "@/workouts/workoutSession";
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
    // Used to navigate back to the client dashboard.
    const router = useRouter();
    const { width, fontScale } = useWindowDimensions();
    const compact = isCompactLayout(width, fontScale);    
    const [showNotes, setShowNotes] = useState(false);
    const [exercises, setExercises] = useState(workout.exercises);
    
    // K2F-43: Tracks whether the current workout is paused.
    const [isPaused, setIsPaused] = useState(false);

    // Prevents workout interactions until saved data is loaded.
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // Prevents duplicate pause/resume actions while saving.
    const [isSavingSession, setIsSavingSession] = useState(false);

    // K2F-186: Restore the paused session when the screen opens.
    useEffect(() => {
      let active = true;

      async function restoreWorkout() {
        try {
          const saved = await loadWorkoutSession(workout.id);

          if (!active) return;

          if (saved) {
            // Restore the exercise list and completion state.
            setExercises(saved.exercises);
            setIsPaused(saved.paused);
          }
        } catch (error) {
          // Keep the original workout available if loading fails.
          console.error("Unable to restore workout:", error);
        } finally {
          if (active) {
            setIsLoadingSession(false);
          }
        }
      }
      restoreWorkout();

      // Avoid updating state after this screen unmounts.
      return () => {
        active = false;
      };
    }, [workout.id]);

    // K2F-32: Store the ID of the exercise currently being viewed.
    // Using the ID lets us retrieve the latest exercise information
    // from state whenever that exercise is updated.
    const [selectedExerciseId, setSelectedExerciseId] =
      useState<string | null>(null);

    // Find the latest data for the selected exercise.
    // If no exercise is selected, the modal receives null.
    const selectedExercise =
      exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;

    const completedCount = exercises.filter((exercise) => exercise.completed).length;
    const progress = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0;

    // Clients can only change completion while the workout is active.
    function toggleExercise(id: string) {
      if (isPaused || isLoadingSession || isSavingSession) return;
          setExercises((current) =>
            current.map((exercise) =>
                exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise,
            ),
        );
    }
    
    // K2F-184 and K2F-185: Pause the workout and save its current progress.
    async function pauseWorkout() {
    // K2F-43: Prevent saving before workout data finishes loading.
    if (isPaused || isLoadingSession || isSavingSession) return;
      setIsSavingSession(true);

      try {
        // Save the entire current exercise list.
        // This includes completed exercises and any edited values.
        await saveWorkoutSession({
          workoutId: workout.id,
          exercises,
          paused: true,
        });

        // Only mark the workout paused after saving succeeds.
        setIsPaused(true);
      } catch (error) {
        console.error("Unable to pause workout:", error);
      } finally {
        setIsSavingSession(false);
      }
    }

// K2F-186: Resume the saved workout.
// Existing exercise data stays in React state.
async function resumeWorkout() {
  // K2F-43: Prevent resuming while session data is loading.
  if (!isPaused || isLoadingSession || isSavingSession) return;
  setIsSavingSession(true);

  try {
    // Clear the saved paused flag.
    // The restored exercises remain in memory.
    await clearWorkoutSession(workout.id);

    // Allow the client to continue the workout.
    setIsPaused(false);
  } catch (error) {
    console.error("Unable to resume workout:", error);
  } finally {
    setIsSavingSession(false);
  }
}


// Show a loading indicator until we know whether this workout
// has saved progress that needs to be restored.
if (isLoadingSession) {
  return (
    <ThemedBackground>
      <View style={styles.sessionLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>
          Loading workout...
        </Text>
      </View>
    </ThemedBackground>
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
        

      {/* K2F-43: Displays Pause or Resume controls. */}
      <View style={styles.sessionCard}>
        {isPaused ? (
          <>
            {/* K2F-186: Show confirmation when the workout is paused. */}
            <Text style={styles.sessionMessage}>
              Workout paused. Your progress is saved.
            </Text>

            {/* K2F-186: Resume the paused workout. */}
            <Pressable
              accessibilityRole="button"
              // Prevent interactions while loading or saving workout data.
              disabled={isLoadingSession || isSavingSession}
              onPress={resumeWorkout}
              style={({ pressed }) => [
                styles.sessionButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.sessionButtonText}>
                {isSavingSession ? "Resuming..." : "▶ Resume Workout"}
              </Text>
            </Pressable>

            {/* K2F-185: Return to the dashboard while keeping
                the saved workout progress in local storage.
                This button is SEPARATE from Resume Workout.
            */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/client/home")}
              style={styles.leaveButton}
            >
              <Text style={styles.leaveButtonText}>
                Back to Dashboard
              </Text>
            </Pressable>
          </>
        ) : (
          // K2F-184: Pause the active workout.
          <Pressable
            accessibilityRole="button"
            disabled={isSavingSession}
            onPress={pauseWorkout}
            style={({ pressed }) => [
              styles.sessionButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.sessionButtonText}>
              {isSavingSession ? "Saving..." : "Ⅱ Pause Workout"}
            </Text>
          </Pressable>
        )}
      </View>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.rowBetween}>
              <View style={styles.exerciseText}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
             
              {/* K2F-166: Display the prescribed sets and repetitions.
                  Only show the weight if one is assigned to the exercise.
                  This prevents empty weights from appearing on the screen.
              */}
              <Text style={styles.prescription}>
                {exercise.sets} sets × {exercise.reps} reps
                {exercise.weight ? ` · ${exercise.weight}` : ""}
              </Text>
             

            </View>

            {/* K2F-43: Checkbox for marking an exercise completed.
                Disable it while the workout is paused or saving.
            */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`${exercise.name} completed`}

              // Prevents clicking the checkbox while paused or saving.
              disabled={isPaused || isSavingSession || isLoadingSession}

              // Tells accessibility tools whether the checkbox is
              // checked or disabled.
              accessibilityState={{
                checked: exercise.completed,
                disabled: isPaused || isSavingSession || isLoadingSession,
              }}

              // Updates exercise completion when the checkbox is clicked.
              onPress={() => toggleExercise(exercise.id)}

              style={[
                styles.checkbox,
                exercise.completed && styles.checkboxCompleted,
              ]}
            >
              {/* Shows a checkmark when the exercise is completed. */}
              {exercise.completed && (
                <Text style={styles.checkmark}>✓</Text>
              )}
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

              // K2F-32: Open the details for the exercise the client selects.
              onPress={() => setSelectedExerciseId(exercise.id)}
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

      {/* K2F-32: Display the latest information for the selected exercise.
          Closing the modal clears the selected exercise ID.
      */}
      <ExerciseDetailsModal
        exercise={selectedExercise}
        onClose={() => setSelectedExerciseId(null)}
      />

    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  
  // K2F-43: Centers the loading indicator while restoring progress.
  sessionLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },

  // Container for the pause/resume controls.
  sessionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  // Message shown when the workout is paused.
  sessionMessage: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.md,
  },

  // Main pause/resume button, using existing app colors.
  sessionButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    minHeight: layout.minTouchTarget + spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  sessionButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },

  // Secondary button that returns to the client dashboard.
  leaveButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    marginTop: spacing.sm,
  },

  leaveButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },

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
