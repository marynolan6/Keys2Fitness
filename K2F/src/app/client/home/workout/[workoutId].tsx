import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { BrandedPage } from "@/components/BrandedPage";
import { ExerciseDetailsModal } from "@/components/ExerciseDetailsModal";
import { ExerciseSetsModal } from "@/components/ExerciseSetsModal";
import { RecordedSets } from "@/components/RecordedSets";
import { CoachNoteButton, CoachNoteSheet } from "@/components/CoachNoteSheet";
import { WorkoutCoachNoteCard } from "@/components/WorkoutCoachNoteCard";
import { WorkoutProgressIndicator } from "@/components/WorkoutProgressIndicator";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getWorkoutCardLabels } from "@/workouts/workoutSessionModel";
import { elapsedWorkoutTime, formatWorkoutTime } from "@/workouts/workoutTimer";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import type { WorkoutTimerAction } from "@/workouts/workoutSessionService";

import { getWorkoutCoachNote } from "@/workouts/coachNote";
import { assignmentForDisplay } from "@/workouts/workoutAssignmentLookup";
import { getWorkoutById, workoutBelongsToClient } from "@/workouts/workoutSource";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { getWorkoutProgress } from "@/workouts/workoutProgress";
import { countLabel, prescriptionLabel } from "@/workouts/workoutLabels";
import type { AssignedWorkout } from "@/workouts/workout";

export default function WorkoutDetails() {
    const { workoutId, resume } = useLocalSearchParams<{ workoutId: string; resume?: string }>();
    const router = useRouter();
    const library = useWorkoutLibraryState();
    const savedWorkout = workoutBelongsToClient(workoutId, library.data.previewClientId) ? getWorkoutById(workoutId) : undefined;
    const assignment = library.data.assignments.find((item) => item.id === savedWorkout?.id);
    const workout = useMemo(() => assignment ? assignmentForDisplay(assignment, library.data.templates) : savedWorkout,
      [assignment, library.data.templates, savedWorkout]);

    if (library.status !== "ready") return <BrandedPage underNativeHeader title={library.status === "loading" ? "Loading workout…" : "Workout unavailable"}>
      {library.status === "error" && <><Text accessibilityRole="alert" style={styles.subtitle}>{library.error}</Text>
        <Pressable accessibilityRole="button" onPress={() => { void workoutLibrary.load(); }} style={styles.sessionButton}>
        <Text style={styles.sessionButtonText}>Retry workout library</Text>
      </Pressable></>}
    </BrandedPage>;

    if (!workout) {
      return (
        <BrandedPage underNativeHeader title="Workout unavailable">
          <Text style={styles.subtitle}>This workout could not be found.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.finishButton}
            onPress={() => router.replace("/client/home")}
          >
            <Text style={styles.finishButtonText}>Back to dashboard</Text>
          </Pressable>
        </BrandedPage>
      );
    }

    return <WorkoutContent key={workout.id} workout={workout} resumeRequest={resume} />;
}

type WorkoutOverlay = { kind: "details" | "sets"; exerciseId: string } | { kind: "note" | "finish" | "end" };

function WorkoutContent({ workout, resumeRequest }: { workout: AssignedWorkout; resumeRequest?: string }) {
    const { width, fontScale } = useWindowDimensions();
    const compact = isCompactLayout(width, fontScale);
    const insets = useSafeAreaInsets();
    const session = useWorkoutSession(workout, resumeRequest);
    const { exercises, timer, outcome, now, isLoadingSession, isSavingSession, sessionLoadFailed,
      sessionError, progressSaveError, sessionDisabled, toggleExercise } = session;
    const [overlay, setOverlay] = useState<WorkoutOverlay | null>(null);
    const [noteScrolledAway, setNoteScrolledAway] = useState(false);
    const noteCardBottom = useRef<number | null>(null);
    const selectedExercise = overlay && "exerciseId" in overlay
      ? exercises.find((exercise) => exercise.id === overlay.exerciseId) ?? null : null;
    const confirmation = overlay?.kind === "finish" || overlay?.kind === "end" ? overlay.kind : null;
    const isPaused = timer.status === "paused";
    async function changeSession(action: WorkoutTimerAction) {
      if (await session.changeSession(action)) setOverlay(null);
    }

    const summary = getWorkoutProgress(exercises);
    const coachNote = getWorkoutCoachNote(workout);
    const sessionLabel = [workout.title, workout.scheduleLabel].filter(Boolean).join(" · ");
    const noteStatusText = [
      { ready: "Workout not started", running: "Workout running", paused: "Workout paused", ended: "Workout ended" }[timer.status],
      timer.status === "ready" ? undefined : formatWorkoutTime(elapsedWorkoutTime(timer, now)),
      `${summary.completed} of ${countLabel(summary.total, "exercise")} complete`,
    ].filter(Boolean).join(" · ");
    const workoutStatus = getWorkoutCardLabels(workout, { workoutId: workout.id, exercises, timer, outcome }).status;

if (isLoadingSession) {
  return (
    <BrandedPage underNativeHeader title="Loading workout…">
        <ActivityIndicator size="large" color={colors.primary} />
    </BrandedPage>
  );
}

if (sessionLoadFailed) {
  return (
    <BrandedPage underNativeHeader title="Workout unavailable">
        <Text accessibilityRole="alert" style={styles.subtitle}>{session.loadError}</Text>
        <Pressable accessibilityRole="button" onPress={session.retryLoad}
          style={({ pressed }) => [styles.sessionButton, pressed && styles.buttonPressed]}>
          <Text style={styles.sessionButtonText}>Try again</Text>
        </Pressable>
    </BrandedPage>
  );
}

return (
    <ThemedBackground>
      <View style={styles.pinnedProgress}><K2FBrand /><WorkoutProgressIndicator progress={summary} /></View>
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
        <PageTitle style={styles.title}>{workout.title}</PageTitle>
        <View style={[styles.subtitleRow, compact && styles.subtitleRowCompact]}>
          <Text style={[styles.subtitle, styles.subtitleText]}>
            {[workoutStatus, workout.scheduleLabel].filter(Boolean).join(" · ")}
          </Text>
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
                {summary.isComplete && timer.status !== "ready" ? <Pressable accessibilityRole="button" disabled={isSavingSession}
                  onPress={() => setOverlay({ kind: "finish" })}
                  style={({ pressed }) => [styles.sessionButton, styles.sessionAction, pressed && styles.buttonPressed]}>
                  <Text style={styles.sessionButtonText}>Finish Workout</Text>
                </Pressable> : isPaused && <Pressable accessibilityRole="button" disabled={isSavingSession}
                  onPress={() => setOverlay({ kind: "end" })}
                  style={({ pressed }) => [styles.sessionButton, styles.sessionAction, styles.endButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.sessionButtonText}>End Workout</Text>
                </Pressable>}
              </>}
            </View>
          </View>
          {sessionError ? <Text accessibilityRole="alert" style={styles.sessionMessage}>{sessionError}</Text> : null}
          {progressSaveError ? <View>
            <Text accessibilityRole="alert" style={styles.sessionMessage}>{progressSaveError}</Text>
            <Pressable accessibilityRole="button" onPress={session.retrySave}
              style={({ pressed }) => [styles.leaveButton, pressed && styles.buttonPressed]}>
              <Text style={styles.leaveButtonText}>Retry saving progress</Text>
            </Pressable>
          </View> : null}
          {isPaused && <Text style={styles.sessionMessage}>Workout paused. Your progress is saved.</Text>}
          {timer.status === "ended" && (
            <Text accessibilityLiveRegion="polite" style={styles.sessionMessage}>
              {outcome === "completed" ? "Workout completed successfully! Saved to your workout history."
                : outcome === "ended-early" ? `Workout ended early. ${summary.completed} of ${countLabel(summary.total, "exercise")} completed. Saved to history; not counted as a completed workout.`
                : `Workout ended. ${summary.completed} of ${countLabel(summary.total, "exercise")} completed.`}
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
                  Target: {prescriptionLabel(exercise)}
                </Text>
                {exercise.restSeconds !== undefined && <Text style={styles.exerciseStatus}>Rest: {countLabel(exercise.restSeconds, "second")}</Text>}
                <Text style={styles.exerciseStatus}>
                  {exercise.actualSets?.filter((set) => set.completed ?? exercise.completed).length ?? 0}/{countLabel(exercise.actualSets?.length ?? 0, "set")} complete
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`${exercise.name} completed`}
                disabled={sessionDisabled || exercise.actualSets?.length === 0}
                accessibilityState={{ checked: exercise.completed, disabled: sessionDisabled || exercise.actualSets?.length === 0 }}
                onPress={() => toggleExercise(exercise.id)}
                accessibilityHint="Checks or unchecks every set. Checking accepts suggested values for any empty fields on unconfirmed sets."
                style={({ pressed }) => [
                  styles.checkbox,
                  exercise.completed && styles.checkboxCompleted,
                  pressed && styles.buttonPressed,
                ]}
              >
                {exercise.completed && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            </View>
            {timer.status !== "ready" && <RecordedSets exercise={exercise} preview={timer.status !== "ended"} />}

            <View style={[styles.buttonRow, compact && styles.buttonRowCompact]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${exercise.name} details`}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => setOverlay({ kind: "details", exerciseId: exercise.id })}
            >
              <Text style={styles.secondaryButtonText}>Exercise details</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`View ${exercise.name} sets`}
              onPress={() => setOverlay({ kind: "sets", exerciseId: exercise.id })}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
              <Text style={styles.secondaryButtonText}>{timer.status === "running" ? "Log sets" : "View sets"}</Text>
            </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      </KeyboardAvoidingView>
      {coachNote && noteScrolledAway && !overlay && (
        <CoachNoteButton onPress={() => setOverlay({ kind: "note" })} />
      )}
      {coachNote && (
        <CoachNoteSheet
          note={coachNote}
          sessionLabel={sessionLabel}
          visible={overlay?.kind === "note"}
          statusText={noteStatusText}
          onClose={() => setOverlay(null)}
        />
      )}
      <ExerciseDetailsModal
        exercise={overlay?.kind === "details" ? selectedExercise : null}
        onClose={() => setOverlay(null)}
      />
      <ExerciseSetsModal
        exercise={overlay?.kind === "sets" ? selectedExercise : null}
        status={timer.status}
        progress={summary}
        disabled={sessionDisabled}
        onClose={() => setOverlay(null)}
        onChange={(setId, field, value) => {
          if (selectedExercise) session.updateSet(selectedExercise.id, setId, field, value);
        }}
        onToggle={(setId) => {
          if (selectedExercise) session.toggleSet(selectedExercise.id, setId);
        }}
        onAdd={() => { if (selectedExercise) session.addSet(selectedExercise.id); }}
        onRemove={() => { if (selectedExercise) session.removeSet(selectedExercise.id); }}
      />
      <Modal transparent visible={confirmation !== null} animationType="fade"
        onRequestClose={() => { if (!isSavingSession) setOverlay(null); }}>
        <View style={[styles.confirmOverlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
          <View accessibilityViewIsModal style={styles.confirmCard}>
            <ScrollView contentContainerStyle={styles.confirmContent}>
              <Text accessibilityRole="header" style={styles.exerciseName}>{confirmation === "finish" ? "Confirm workout completion?" : "End this workout early?"}</Text>
              <Text style={styles.progressSummary}>
                {confirmation === "finish"
                  ? `${summary.total === 1 ? "Your exercise is complete" : `All ${summary.total} exercises are complete`}. Confirm to save your performed sets and active time to workout history.`
                  : `You have ${summary.remaining} incomplete ${summary.remaining === 1 ? "exercise" : "exercises"}. Your progress will be recorded as ended early, not completed.`}
              </Text>
              <Text accessibilityRole="header" style={styles.reviewHeading}>Review your log</Text>
              {confirmation && exercises.map((exercise) => <View key={exercise.id} style={styles.reviewExercise}>
                <Text accessibilityRole="header" style={styles.reviewHeading}>{exercise.name}</Text>
                <RecordedSets exercise={exercise} />
              </View>)}
            </ScrollView>
            <View style={styles.confirmActions}>
              <Pressable accessibilityRole="button" disabled={isSavingSession}
                onPress={() => { if (confirmation) void changeSession(confirmation); }}
                style={({ pressed }) => [styles.sessionButton, confirmation === "end" && styles.endButton, pressed && styles.buttonPressed]}>
                <Text style={styles.sessionButtonText}>{isSavingSession ? "Saving..." : confirmation === "finish" ? "Confirm completion" : "End Anyway"}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isSavingSession}
                onPress={() => setOverlay(null)}
                style={({ pressed }) => [styles.leaveButton, pressed && styles.buttonPressed]}>
                <Text style={styles.leaveButtonText}>Keep Workout</Text>
              </Pressable>
              {sessionError ? <Text accessibilityRole="alert" style={styles.progressSummary}>{sessionError}</Text> : null}
            </View>
          </View>
        </View>
      </Modal>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  pinnedProgress: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
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
  confirmCard: { backgroundColor: colors.surface, borderRadius: radii.card, width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "100%", overflow: "hidden" },
  confirmContent: { padding: spacing.md, gap: spacing.md },
  confirmActions: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  reviewHeading: { color: colors.text, fontSize: typography.body, fontWeight: "700" },
  reviewExercise: { backgroundColor: colors.surfaceMuted, borderRadius: radii.control, padding: spacing.md, gap: spacing.sm },
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
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
    marginTop: spacing.sm,
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
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
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
