import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CurrentGoalCard } from "@/components/CurrentGoalCard";
import { AssignedWorkoutCard } from "@/components/AssignedWorkoutCard";
import { ThemedBackground } from "@/components/ThemedBackground";
import { getClientAssignedWorkout, getWorkoutById, workoutBelongsToClient } from "@/workouts/workoutSource";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { DemoWorkoutClientPicker } from "@/components/DemoWorkoutClientPicker";
import { WorkoutHistorySection } from "@/components/WorkoutHistorySection";
import { BuilderButton, builderStyles } from "@/components/WorkoutBuilderControls";
import { useCoachClients } from "@/clients/clientStore";
import { isWorkoutInProgress, loadActiveWorkoutSession, loadWorkoutSession, type WorkoutSession } from "@/workouts/workoutSession";
import { mockCurrentGoal } from "@/goals/mockGoal";
import { RecentMessagesWidget } from "@/components/RecentMessagesWidgetClient";
import { defaultProfile } from "@/profile/profile";
import { loadProfile } from "@/profile/profileStorage";
import { colors, layout, radii, spacing, typography } from "@/theme";

export default function ClientHome() {
  const router = useRouter();
  const focused = useIsFocused();
  const library = useWorkoutLibraryState();
  const previewClientId = library.data.previewClientId;
  const clients = useCoachClients();
  const assignedWorkout = getClientAssignedWorkout(previewClientId);
  const [firstName, setFirstName] = useState(defaultProfile.fullName.split(" ")[0]);
  const demoFirstName = library.data.assignments.length
    ? clients.find((client) => client.id === previewClientId)?.name.trim().split(/\s+/)[0]
    : undefined;
  const greetingName = demoFirstName || firstName;
  const [sessionState, setSessionState] = useState<{
    active: WorkoutSession | null; assigned: WorkoutSession | null; loading: boolean; error: boolean; clientId: string;
  }>({ active: null, assigned: null, loading: true, error: false, clientId: previewClientId });
  const [sessionRetry, setSessionRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    loadProfile()
      .then((saved) => {
        if (active) setFirstName(saved.fullName.trim().split(/\s+/)[0]);
      })
      .catch(() => {
        if (active) setFirstName(defaultProfile.fullName.split(" ")[0]);
      });
    return () => { active = false; };
  }, []));

  useEffect(() => {
    if (!focused || library.status !== "ready") return;
    let active = true;
    async function refreshSession() {
      setSessionState({ active: null, assigned: null, loading: true, error: false, clientId: previewClientId });
      try {
        const [session, assigned] = await Promise.all([
          loadActiveWorkoutSession((id) => workoutBelongsToClient(id, previewClientId)),
          assignedWorkout ? loadWorkoutSession(assignedWorkout.id) : Promise.resolve(null),
        ]);
        if (active) setSessionState({ active: session, assigned, loading: false, error: false, clientId: previewClientId });
      } catch {
        if (active) setSessionState({ active: null, assigned: null, loading: false, error: true, clientId: previewClientId });
      }
    }
    void refreshSession();
    return () => { active = false; };
  }, [assignedWorkout, focused, sessionRetry, library.status, library.data, previewClientId]);

  const matchingClient = sessionState.clientId === previewClientId;
  const displayedSession = matchingClient ? sessionState.active ?? sessionState.assigned : null;
  const displayedWorkout = matchingClient && sessionState.active ? getWorkoutById(sessionState.active.workoutId) ?? assignedWorkout : assignedWorkout;
  const openWorkout = (workoutId: string) => router.push({
    pathname: "/client/home/workout/[workoutId]",
    params: { workoutId, ...(isWorkoutInProgress(displayedSession) ? { resume: String(Date.now()) } : {}) },
  });



  return (
    <ThemedBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.content}>
          <Text style={styles.brand}>KEYS2FITNESS</Text>
          <Text style={styles.title}>Good morning, {greetingName}</Text>
          <Text style={styles.subtitle}>Let&apos;s build strength!</Text>

          <View style={styles.goalSection}>
            <DemoWorkoutClientPicker />
            <Text style={styles.sectionTitle}>Assigned workout</Text>
            {(matchingClient && sessionState.error) || library.status === "error" ? (
              <View style={styles.sessionFeedback}>
                <Text accessibilityRole="alert" style={styles.sessionError}>
                  {library.status === "error" ? library.error : "We couldn't check your saved workout. Please try again."}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Retry loading workout"
                  onPress={() => library.status === "error" ? void workoutLibrary.load() : setSessionRetry((current) => current + 1)}
                  style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}>
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              </View>
            ) : <AssignedWorkoutCard workout={displayedWorkout} session={displayedSession}
              loading={library.status !== "ready" || !matchingClient || sessionState.loading} onOpen={openWorkout} />}
          </View>

          {library.status === "ready" && <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>Your assigned workouts</Text>
            {library.data.assignments.filter((assignment) => assignment.clientId === previewClientId).map((assignment) =>
              <View key={assignment.id} style={[builderStyles.card, { marginBottom: spacing.md }]}>
                <Text style={builderStyles.heading}>{assignment.workout.title}</Text>
                <Text style={builderStyles.muted}>Assigned {new Date(assignment.assignedAt).toLocaleString()} · {assignment.workout.exercises.length} exercises</Text>
                <BuilderButton label={`Open ${assignment.workout.title}`} accessibilityLabel={`Open assigned workout ${assignment.workout.title} from ${new Date(assignment.assignedAt).toLocaleString()}`}
                  onPress={() => router.push({ pathname: "/client/home/workout/[workoutId]", params: { workoutId: assignment.id } })} />
              </View>)}
            {!library.data.assignments.some((assignment) => assignment.clientId === previewClientId) &&
              <Text style={builderStyles.muted}>No coach-built workouts assigned yet.</Text>}
          </View>}

          <View style={styles.goalSection}>
            <CurrentGoalCard
              goal={mockCurrentGoal}
              onViewProgress={() => router.push("/client/progress")}
              onMessageCoach={() => router.push("/client/messages")}
            />
          </View>

          <RecentMessagesWidget />
          <View style={styles.goalSection}><WorkoutHistorySection /></View>

        </View>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  sessionFeedback: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  sessionError: { color: colors.text, fontSize: typography.body },
  retryButton: { minHeight: layout.minTouchTarget, borderRadius: radii.button, justifyContent: "center", padding: spacing.md, backgroundColor: colors.primaryDark },
  retryPressed: { backgroundColor: colors.primaryDeep },
  retryLabel: { color: colors.surface, fontSize: typography.body, textAlign: "center", fontWeight: "700" },
  screen: {
    flex: 1,
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
  },
  goalSection: {
    marginTop: spacing.lg,
  },
  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
    marginTop: spacing.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
});
