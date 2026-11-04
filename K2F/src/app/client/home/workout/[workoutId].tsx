import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ExerciseDetailsModal } from "@/components/ExerciseDetailsModal";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { saveWorkoutSession, loadWorkoutSession } from "@/workouts/workoutSession";
import { elapsedWorkoutTime, formatWorkoutTime, initialWorkoutTimer, transitionWorkoutTimer } from "@/workouts/workoutTimer";

import { getWorkoutById } from "@/workouts/mockWorkout";
import { getWorkoutProgress } from "@/workouts/workoutProgress";
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
    const router = useRouter();
    const { width, fontScale } = useWindowDimensions();
    const compact = isCompactLayout(width, fontScale);
    const [exercises, setExercises] = useState(workout.exercises);
    const [showNotes, setShowNotes] = useState(false);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
    const [timer, setTimer] = useState(initialWorkoutTimer);
    const [now, setNow] = useState(Date.now);
    const [showEndConfirmation, setShowEndConfirmation] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const isPaused = timer.status === "paused";
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isSavingSession, setIsSavingSession] = useState(false);
    const sessionDisabled = timer.status !== "running" || isLoadingSession || isSavingSession;

    useEffect(() => {
      if (timer.status !== "running") return;
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, [timer.status]);

    useEffect(() => {
      let active = true;
      async function restoreWorkout() {
        try {
          const saved = await loadWorkoutSession(workout.id);
          if (active && saved) {
            setExercises(saved.exercises);
            setTimer(saved.timer ?? { status: "paused", elapsedMs: 0, runningSince: null });
            setNow(Date.now());
          }
        } catch (error) {
          console.error("Unable to restore workout:", error);
          if (active) setSessionError("Unable to load your saved workout. Reopen the workout to retry.");
        } finally {
          if (active) setIsLoadingSession(false);
        }
      }
      restoreWorkout();
      return () => { active = false; };
    }, [workout.id]);

    async function changeSession(action: "start" | "pause" | "resume" | "end") {
      if (isLoadingSession || isSavingSession) return;
      const changedAt = Date.now();
      const next = transitionWorkoutTimer(timer, action, changedAt);
      if (next === timer) return;
      const nextExercises = action === "start" && timer.status === "ended"
        ? workout.exercises.map((exercise) => ({ ...exercise, completed: false })) : exercises;
      setIsSavingSession(true);
      setSessionError("");
      try {
        await saveWorkoutSession({ workoutId: workout.id, exercises: nextExercises, paused: next.status === "paused", timer: next });
        setExercises(nextExercises);
        setTimer(next);
        setNow(changedAt);
        setShowEndConfirmation(false);
      } catch (error) {
        console.error("Unable to update workout:", error);
        setSessionError("Your workout could not be saved. Please try again.");
      } finally {
        setIsSavingSession(false);
      }
    }

    const summary = getWorkoutProgress(exercises);
    const progress = summary.percentage;

    function toggleExercise(id: string) {
        if (sessionDisabled) return;
        setExercises((current) =>
            current.map((exercise) =>
                exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise,
            ),
        );
    }

if (isLoadingSession) {
  return (
    <ThemedBackground>
      <View style={styles.sessionLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.subtitle}>Loading workout...</Text>
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

        <View style={[styles.progressCard, summary.isComplete && styles.completedCard]}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Workout progress</Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.progressSummary}>
            {summary.total === 0
              ? "No exercises assigned"
              : `${summary.completed} of ${summary.total} exercises complete · ${summary.remaining} remaining`}
          </Text>
          {summary.isComplete && (
            <Text style={styles.completeMessage}>All exercises complete</Text>
          )}
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Workout progress"
            accessibilityValue={{ min: 0, max: 100, now: progress }}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.sessionCard}>
          <Text style={styles.timerLabel}>{timer.status === "ended" ? "Workout duration" : "Active workout time"}</Text>
          <Text accessibilityLabel={`Workout time ${formatWorkoutTime(elapsedWorkoutTime(timer, now))}`} style={styles.timerValue}>
            {formatWorkoutTime(elapsedWorkoutTime(timer, now))}
          </Text>
          {sessionError ? <Text accessibilityRole="alert" style={styles.sessionMessage}>{sessionError}</Text> : null}
          {isPaused && <Text style={styles.sessionMessage}>Workout paused. Your progress is saved.</Text>}
          {timer.status === "ended" && (
            <><Text accessibilityLiveRegion="polite" style={styles.sessionMessage}>
              Workout ended. {summary.completed} of {summary.total} exercises completed.
            </Text>
            <Pressable accessibilityRole="button" disabled={isSavingSession} onPress={() => changeSession("start")}
              style={({ pressed }) => [styles.sessionButton, pressed && styles.buttonPressed]}>
              <Text style={styles.sessionButtonText}>Start New Workout</Text>
            </Pressable></>
          )}
          {timer.status !== "ended" && <View style={styles.sessionActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isSavingSession}
            accessibilityState={{ disabled: isSavingSession }}
            onPress={() => changeSession(timer.status === "ready" ? "start" : isPaused ? "resume" : "pause")}
            style={({ pressed }) => [styles.sessionButton, styles.sessionAction, pressed && styles.buttonPressed]}
          >
            <Text style={styles.sessionButtonText}>
              {isSavingSession ? "Saving..." : timer.status === "ready" ? "Start Workout" : isPaused ? "Resume" : "Ⅱ Pause Workout"}
            </Text>
          </Pressable>
          {isPaused && <Pressable
            accessibilityRole="button" disabled={isSavingSession}
            onPress={() => summary.remaining > 0 ? setShowEndConfirmation(true) : changeSession("end")}
            style={({ pressed }) => [styles.sessionButton, styles.sessionAction, styles.endButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.sessionButtonText}>End Workout</Text>
          </Pressable>}
          </View>}
          {(isPaused || timer.status === "ended") && (
            <Pressable accessibilityRole="button" onPress={() => router.push("/client/home")}
              style={({ pressed }) => [styles.leaveButton, pressed && styles.buttonPressed]}>
              <Text style={styles.leaveButtonText}>Back to Dashboard</Text>
            </Pressable>
          )}
        </View>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={[styles.exerciseCard, exercise.completed && styles.completedCard]}>
            <View style={styles.rowBetween}>
              <View style={styles.exerciseText}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={[styles.exerciseStatus, exercise.completed && styles.exerciseStatusComplete]}>
                  {exercise.completed ? "Completed" : "Not complete"}
                </Text>
                <Text style={styles.prescription}>
                  {exercise.sets} sets × {exercise.reps} reps{exercise.weight ? ` · ${exercise.weight}` : ""}
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`${exercise.name} completed`}
                disabled={sessionDisabled}
                accessibilityState={{ checked: exercise.completed, disabled: sessionDisabled }}
                onPress={() => toggleExercise(exercise.id)}
                accessibilityHint="Toggles completion for this exercise"
                style={({ pressed }) => [
                  styles.checkbox,
                  exercise.completed && styles.checkboxCompleted,
                  pressed && styles.buttonPressed,
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

      </ScrollView>
      <ExerciseDetailsModal
        exercise={selectedExercise}
        onClose={() => setSelectedExerciseId(null)}
      />
      <Modal transparent visible={showEndConfirmation} animationType="fade"
        onRequestClose={() => { if (!isSavingSession) setShowEndConfirmation(false); }}>
        <View style={styles.confirmOverlay}>
          <View accessibilityViewIsModal style={styles.confirmCard}>
            <ScrollView contentContainerStyle={styles.confirmContent}>
              <Text accessibilityRole="header" style={styles.exerciseName}>End this workout?</Text>
              <Text style={styles.progressSummary}>
                You have {summary.remaining} incomplete {summary.remaining === 1 ? "exercise" : "exercises"}. Are you sure you want to finish the workout?
              </Text>
              <Pressable accessibilityRole="button" disabled={isSavingSession}
                onPress={() => changeSession("end")}
                style={({ pressed }) => [styles.sessionButton, styles.endButton, pressed && styles.buttonPressed]}>
                <Text style={styles.sessionButtonText}>{isSavingSession ? "Saving..." : "End Anyway"}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isSavingSession}
                onPress={() => setShowEndConfirmation(false)}
                style={({ pressed }) => [styles.leaveButton, pressed && styles.buttonPressed]}>
                <Text style={styles.leaveButtonText}>Keep Workout</Text>
              </Pressable>
              {sessionError ? <Text accessibilityRole="alert" style={styles.progressSummary}>{sessionError}</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  timerLabel: { color: colors.textMuted, fontSize: typography.label, textAlign: "center" },
  timerValue: { color: colors.text, fontSize: typography.title, fontVariant: ["tabular-nums"], textAlign: "center", marginBottom: spacing.md },
  sessionActions: { flexDirection: "row", gap: spacing.sm },
  sessionAction: { flex: 1 },
  endButton: { backgroundColor: colors.danger },
  confirmOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  confirmCard: { backgroundColor: colors.surface, borderRadius: radii.card, width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "90%" },
  confirmContent: { padding: spacing.lg, gap: spacing.md },
  sessionLoading: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  sessionCard: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.md,
  },
  sessionMessage: { color: colors.text, fontSize: typography.body, textAlign: "center", marginBottom: spacing.md },
  sessionButton: {
    backgroundColor: colors.primaryDark, borderRadius: radii.button,
    alignItems: "center", justifyContent: "center", minHeight: layout.minTouchTarget + spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  sessionButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "700" },
  leaveButton: { alignItems: "center", justifyContent: "center", minHeight: layout.minTouchTarget, marginTop: spacing.sm },
  leaveButtonText: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "700" },
  completedCard: {
    backgroundColor: colors.achievedMuted,
    borderColor: colors.achieved,
  },
  progressSummary: {
    color: colors.text,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  completeMessage: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  exerciseStatus: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.sm,
    fontWeight: "700",
  },
  exerciseStatusComplete: {
    color: colors.text,
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
