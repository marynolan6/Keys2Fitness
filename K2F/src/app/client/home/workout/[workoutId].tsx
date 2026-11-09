import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ExerciseDetailsModal } from "@/components/ExerciseDetailsModal";
import { ExerciseSetsModal } from "@/components/ExerciseSetsModal";
import { CoachNoteButton, CoachNoteSheet } from "@/components/CoachNoteSheet";
import { WorkoutCoachNoteCard } from "@/components/WorkoutCoachNoteCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { getWorkoutCardLabels, saveWorkoutSession, loadWorkoutSession } from "@/workouts/workoutSession";
import { elapsedWorkoutTime, formatWorkoutTime, initialWorkoutTimer, transitionWorkoutTimer } from "@/workouts/workoutTimer";

import { getWorkoutCoachNote } from "@/workouts/coachNote";
import { getWorkoutById, workoutBelongsToClient } from "@/workouts/workoutSource";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { getWorkoutProgress } from "@/workouts/workoutProgress";
import { addPerformedSet, initializeSetPerformance, removeLastPerformedSet, resetSetPerformance, toggleExercisePerformance, togglePerformedSet, updateSetPerformance } from "@/workouts/setPerformance";
import type { AssignedWorkout } from "@/workouts/workout";

export default function WorkoutDetails() {
    const { workoutId, resume } = useLocalSearchParams<{ workoutId: string; resume?: string }>();
    const router = useRouter();
    const library = useWorkoutLibraryState();
    const workout = workoutBelongsToClient(workoutId, library.data.previewClientId) ? getWorkoutById(workoutId) : undefined;

    if (library.status !== "ready") return <ThemedBackground><View style={styles.content}>
      <Text style={styles.subtitle}>{library.status === "loading" ? "Loading workout…" : library.error}</Text>
      {library.status === "error" && <Pressable accessibilityRole="button" onPress={() => { void workoutLibrary.load(); }} style={styles.sessionButton}>
        <Text style={styles.sessionButtonText}>Retry workout library</Text>
      </Pressable>}
    </View></ThemedBackground>;

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

    return <WorkoutContent key={workout.id} workout={workout} resumeRequest={resume} />;
}

function WorkoutContent({ workout, resumeRequest }: { workout: AssignedWorkout; resumeRequest?: string }) {
    const { width, fontScale } = useWindowDimensions();
    const compact = isCompactLayout(width, fontScale);
    const [exercises, setExercises] = useState(() => workout.exercises.map(initializeSetPerformance));
    const nextSetId = useRef(0);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    // The note opens as an overlay on this screen, so viewing it never touches workout state.
    const [showCoachNote, setShowCoachNote] = useState(false);
    const [noteScrolledAway, setNoteScrolledAway] = useState(false);
    const noteCardBottom = useRef<number | null>(null);
    const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
    const [selectedSetsId, setSelectedSetsId] = useState<string | null>(null);
    const selectedSetsExercise = exercises.find((exercise) => exercise.id === selectedSetsId) ?? null;
    const [timer, setTimer] = useState(initialWorkoutTimer);
    const [now, setNow] = useState(Date.now);
    const [showEndConfirmation, setShowEndConfirmation] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const isPaused = timer.status === "paused";
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isSavingSession, setIsSavingSession] = useState(false);
    const [sessionLoadFailed, setSessionLoadFailed] = useState(false);
    const [loadRetry, setLoadRetry] = useState(0);
    const [progressSaveError, setProgressSaveError] = useState("");
    const sessionDisabled = timer.status !== "running" || isLoadingSession || isSavingSession;

    useEffect(() => {
      if (timer.status !== "running") return;
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, [timer.status]);

    useEffect(() => {
      let active = true;
      async function restoreWorkout() {
        setIsLoadingSession(true);
        setSessionLoadFailed(false);
        try {
          const saved = await loadWorkoutSession(workout.id);
          if (active && saved) {
            setExercises(saved.exercises.map(initializeSetPerformance));
            const savedTimer = saved.timer ?? { status: "paused" as const, elapsedMs: 0, runningSince: null };
            const resumedAt = Date.now();
            // Continue resumes a paused timer, but never restarts an ended session
            // or moves the starting point of an already-running clock.
            const nextTimer = resumeRequest
              ? transitionWorkoutTimer(savedTimer, "resume", resumedAt) : savedTimer;
            setTimer(savedTimer);
            if (nextTimer !== savedTimer) {
              await saveWorkoutSession({ ...saved, timer: nextTimer, paused: false });
            }
            if (active) {
              setTimer(nextTimer);
              setNow(resumedAt);
              setSessionError("");
            }
          }
        } catch (error) {
          console.error("Unable to restore workout:", error);
          if (active) setSessionLoadFailed(true);
        } finally {
          if (active) setIsLoadingSession(false);
        }
      }
      restoreWorkout();
      return () => { active = false; };
    }, [workout.id, resumeRequest, loadRetry]);

    useEffect(() => {
      if (isLoadingSession || sessionLoadFailed || timer.status === "ready") return;
      let active = true;
      saveWorkoutSession({ workoutId: workout.id, exercises, paused: timer.status === "paused", timer })
        .then(() => { if (active) setProgressSaveError(""); })
        .catch(() => {
          if (active) setProgressSaveError("Your latest progress could not be saved. Try again before leaving.");
        });
      return () => { active = false; };
    }, [exercises, timer, workout.id, isLoadingSession, sessionLoadFailed]);

    async function changeSession(action: "start" | "pause" | "resume" | "end") {
      if (isLoadingSession || isSavingSession) return;
      const changedAt = Date.now();
      const next = transitionWorkoutTimer(timer, action, changedAt);
      if (next === timer) return;
      const nextExercises = action === "start" && timer.status === "ended"
        ? workout.exercises.map(resetSetPerformance) : exercises;
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
    const coachNote = getWorkoutCoachNote(workout);
    const sessionLabel = [workout.title, workout.scheduleLabel].filter(Boolean).join(" · ");
    const noteStatusText = [
      { ready: "Workout not started", running: "Workout running", paused: "Workout paused", ended: "Workout ended" }[timer.status],
      timer.status === "ready" ? undefined : formatWorkoutTime(elapsedWorkoutTime(timer, now)),
      `${summary.completed} of ${summary.total} exercises complete`,
    ].filter(Boolean).join(" · ");
    const progress = summary.percentage;
    const workoutStatus = getWorkoutCardLabels(workout, { workoutId: workout.id, exercises, paused: isPaused, timer }).status;

    function toggleExercise(id: string) {
        if (sessionDisabled) return;
        setExercises((current) =>
            current.map((exercise) =>
                exercise.id === id ? toggleExercisePerformance(exercise) : exercise,
            ),
        );
    }

    function changeExercise(id: string, update: (exercise: AssignedWorkout["exercises"][number]) => AssignedWorkout["exercises"][number]) {
      if (sessionDisabled) return;
      setExercises((current) => current.map((exercise) => exercise.id === id ? update(exercise) : exercise));
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

if (sessionLoadFailed) {
  return (
    <ThemedBackground>
      <View style={styles.content}>
        <Text accessibilityRole="alert" style={styles.subtitle}>Your saved workout could not be opened. Try again to continue without resetting progress.</Text>
        <Pressable accessibilityRole="button" onPress={() => setLoadRetry((current) => current + 1)}
          style={({ pressed }) => [styles.sessionButton, pressed && styles.buttonPressed]}>
          <Text style={styles.sessionButtonText}>Try again</Text>
        </Pressable>
      </View>
    </ThemedBackground>
  );
}

return (
    <ThemedBackground>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, coachNote && styles.contentWithNoteButton]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={32}
        onScroll={(event) => {
          const bottom = noteCardBottom.current;
          if (bottom === null) return;
          const scrolledAway = event.nativeEvent.contentOffset.y > bottom;
          if (scrolledAway !== noteScrolledAway) setNoteScrolledAway(scrolledAway);
        }}
      >
        <Text style={styles.brand}>KEYS2FITNESS</Text>
        <Text style={styles.screenNumber}>03</Text>
        <Text style={styles.title}>{workout.title}</Text>
        <View style={[styles.subtitleRow, compact && styles.subtitleRowCompact]}>
          <Text style={[styles.subtitle, styles.subtitleText]}>
            {[workoutStatus, workout.scheduleLabel].filter(Boolean).join(" · ")}
          </Text>
        </View>

        <View style={styles.headerProgress}>
          <View style={styles.rowBetween}>
            <Text accessibilityLiveRegion="polite" style={styles.headerProgressSummary}>
              {summary.total === 0
                ? "No exercises assigned"
                : `${summary.completed} of ${summary.total} exercises complete · ${summary.remaining} remaining`}
            </Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          {summary.isComplete && (
            <Text style={styles.headerProgressSummary}>All exercises complete</Text>
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

        {coachNote && (
          <View onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            noteCardBottom.current = y + height;
          }}>
            <WorkoutCoachNoteCard note={coachNote} sessionLabel={sessionLabel} collapsible />
          </View>
        )}

        <View style={styles.sessionCard}>
          <View style={[styles.timerRow, compact && styles.timerRowCompact]}>
            <View style={[styles.timerSummary, compact && styles.timerSummaryCompact]}>
              <Text style={styles.timerLabel}>{timer.status === "ended" ? "Workout duration" : "Active workout time"}</Text>
              <Text accessibilityLabel={`Workout time ${formatWorkoutTime(elapsedWorkoutTime(timer, now))}`} style={styles.timerValue}>
                {formatWorkoutTime(elapsedWorkoutTime(timer, now))}
              </Text>
            </View>
            <View style={[styles.sessionActions, compact && styles.sessionActionsCompact,
              fontScale >= layout.largeFontScale && styles.sessionActionsLargeText]}>
              {timer.status === "ended" ? (
                <Pressable accessibilityRole="button" disabled={isSavingSession} onPress={() => changeSession("start")}
                  style={({ pressed }) => [styles.sessionButton, styles.sessionAction, pressed && styles.buttonPressed]}>
                  <Text style={styles.sessionButtonText}>Start New Workout</Text>
                </Pressable>
              ) : <>
                <Pressable accessibilityRole="button" disabled={isSavingSession}
                  accessibilityState={{ disabled: isSavingSession }}
                  onPress={() => changeSession(timer.status === "ready" ? "start" : isPaused ? "resume" : "pause")}
                  style={({ pressed }) => [styles.sessionButton, styles.sessionAction, pressed && styles.buttonPressed]}>
                  <Text style={styles.sessionButtonText}>
                    {isSavingSession ? "Saving..." : timer.status === "ready" ? "Start Workout" : isPaused ? "Resume" : "Ⅱ Pause Workout"}
                  </Text>
                </Pressable>
                {isPaused && <Pressable accessibilityRole="button" disabled={isSavingSession}
                  onPress={() => summary.remaining > 0 ? setShowEndConfirmation(true) : changeSession("end")}
                  style={({ pressed }) => [styles.sessionButton, styles.sessionAction, styles.endButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.sessionButtonText}>End Workout</Text>
                </Pressable>}
              </>}
            </View>
          </View>
          {sessionError ? <Text accessibilityRole="alert" style={styles.sessionMessage}>{sessionError}</Text> : null}
          {progressSaveError ? <View>
            <Text accessibilityRole="alert" style={styles.sessionMessage}>{progressSaveError}</Text>
            <Pressable accessibilityRole="button" onPress={() => {
              saveWorkoutSession({ workoutId: workout.id, exercises, paused: isPaused, timer })
                .then(() => setProgressSaveError(""))
                .catch(() => setProgressSaveError("Your latest progress could not be saved. Try again before leaving."));
            }} style={({ pressed }) => [styles.leaveButton, pressed && styles.buttonPressed]}>
              <Text style={styles.leaveButtonText}>Retry saving progress</Text>
            </Pressable>
          </View> : null}
          {isPaused && <Text style={styles.sessionMessage}>Workout paused. Your progress is saved.</Text>}
          {timer.status === "ended" && (
            <Text accessibilityLiveRegion="polite" style={styles.sessionMessage}>
              Workout ended. {summary.completed} of {summary.total} exercises completed.
            </Text>
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
                  {exercise.sets} sets × {exercise.reps} reps · {exercise.weight?.trim() || "Bodyweight"}
                </Text>
                <Text style={styles.exerciseStatus}>
                  {exercise.actualSets?.filter((set) => set.completed).length ?? 0}/{exercise.actualSets?.length ?? 0} sets complete
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`${exercise.name} completed`}
                disabled={sessionDisabled || exercise.actualSets?.length === 0}
                accessibilityState={{ checked: exercise.completed, disabled: sessionDisabled || exercise.actualSets?.length === 0 }}
                onPress={() => toggleExercise(exercise.id)}
                accessibilityHint="Toggles all performed sets. Completing untouched fields records the prescribed targets."
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${exercise.name} details`}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => setSelectedExerciseId(exercise.id)}
            >
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`View ${exercise.name} sets`}
              onPress={() => setSelectedSetsId(exercise.id)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
              <Text style={styles.secondaryButtonText}>View Sets</Text>
            </Pressable>
            </View>
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
      </KeyboardAvoidingView>
      {coachNote && noteScrolledAway && !showCoachNote && (
        <CoachNoteButton onPress={() => setShowCoachNote(true)} />
      )}
      {coachNote && (
        <CoachNoteSheet
          note={coachNote}
          sessionLabel={sessionLabel}
          visible={showCoachNote}
          statusText={noteStatusText}
          onClose={() => setShowCoachNote(false)}
        />
      )}
      <ExerciseDetailsModal
        exercise={selectedExercise}
        onClose={() => setSelectedExerciseId(null)}
      />
      <ExerciseSetsModal
        exercise={selectedSetsExercise}
        disabled={sessionDisabled}
        onClose={() => setSelectedSetsId(null)}
        onChange={(setId, field, value) => {
          if (selectedSetsId) changeExercise(selectedSetsId, (current) => updateSetPerformance(current, setId, field, value));
        }}
        onToggle={(setId) => {
          if (selectedSetsId) changeExercise(selectedSetsId, (current) => togglePerformedSet(current, setId));
        }}
        onAdd={() => {
          if (!selectedSetsId) return;
          const id = `${selectedSetsId}-actual-${Date.now()}-${++nextSetId.current}`;
          changeExercise(selectedSetsId, (current) => addPerformedSet(current, id));
        }}
        onRemove={() => { if (selectedSetsId) changeExercise(selectedSetsId, removeLastPerformedSet); }}
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
  screen: { flex: 1 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  timerRowCompact: { flexDirection: "column", alignItems: "stretch", gap: spacing.sm },
  timerSummary: { flex: 1, gap: spacing.xs },
  timerSummaryCompact: { flex: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  timerLabel: { color: colors.textMuted, fontSize: typography.caption, flexShrink: 1 },
  timerValue: { color: colors.text, fontSize: typography.heading, fontVariant: ["tabular-nums"], flexShrink: 1 },
  sessionActions: { flexDirection: "row", flex: 2, gap: spacing.sm },
  sessionActionsCompact: { flex: 0 },
  sessionActionsLargeText: { flexDirection: "column", flex: 0 },
  sessionAction: { flex: 1, minWidth: layout.minTouchTarget },
  endButton: { backgroundColor: colors.danger },
  confirmOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  confirmCard: { backgroundColor: colors.surface, borderRadius: radii.card, width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "90%" },
  confirmContent: { padding: spacing.lg, gap: spacing.md },
  sessionLoading: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  sessionCard: {
    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radii.card, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.md,
  },
  sessionMessage: { color: colors.textMuted, fontSize: typography.label },
  sessionButton: {
    backgroundColor: colors.primaryDark, borderRadius: radii.button,
    alignItems: "center", justifyContent: "center", minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  sessionButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
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
  // Room for the floating "Coach's note" button so it never covers the last actions.
  contentWithNoteButton: { paddingBottom: spacing.xl + spacing.md + layout.minTouchTarget + spacing.lg },
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
  headerProgress: { gap: spacing.sm, marginBottom: spacing.md },
  headerProgressSummary: { color: colors.textMuted, fontSize: typography.caption, flex: 1, marginRight: spacing.sm },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  progressTrack: {
    backgroundColor: colors.progressTrack,
    borderRadius: radii.control,
    height: spacing.sm,
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
