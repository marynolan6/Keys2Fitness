import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CurrentGoalCard } from "@/components/CurrentGoalCard";
import { AssignedWorkoutCard } from "@/components/AssignedWorkoutCard";
import { ThemedBackground } from "@/components/ThemedBackground";
import { K2FBrand } from "@/components/K2FBrand";
import { getClientAssignedWorkout, getClientHomeWorkouts, workoutBelongsToClient } from "@/workouts/workoutSource";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { DemoWorkoutClientPicker } from "@/components/DemoWorkoutClientPicker";
import { WorkoutHistorySection } from "@/components/WorkoutHistorySection";
import { useCoachClients } from "@/clients/clientStore";
import { loadActiveWorkoutSession, loadWorkoutSession, type WorkoutSession } from "@/workouts/workoutSession";
import { mockCurrentGoal } from "@/goals/mockGoal";
import { RecentMessagesWidget } from "@/components/RecentMessagesWidgetClient";
import { defaultProfile } from "@/profile/profile";
import { loadProfile } from "@/profile/profileStorage";
import { colors, layout, radii, spacing, typography } from "@/theme";

type HomeSessions = { clientId: string } & (
  | { status: "loading" | "error" }
  | { status: "ready"; active: WorkoutSession | null; assigned: WorkoutSession | null }
);

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
  const [sessionState, setSessionState] = useState<HomeSessions>({ status: "loading", clientId: previewClientId });
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
      setSessionState({ status: "loading", clientId: previewClientId });
      try {
        const [session, assigned] = await Promise.all([
          loadActiveWorkoutSession((id) => workoutBelongsToClient(id, previewClientId)),
          assignedWorkout ? loadWorkoutSession(assignedWorkout.id) : Promise.resolve(null),
        ]);
        if (active) setSessionState({ status: "ready", active: session, assigned, clientId: previewClientId });
      } catch {
        if (active) setSessionState({ status: "error", clientId: previewClientId });
      }
    }
    void refreshSession();
    return () => { active = false; };
  }, [assignedWorkout, focused, sessionRetry, library.status, library.data, previewClientId]);

  const sessions = sessionState.clientId === previewClientId ? sessionState : null;
  const workoutStatus = library.status === "ready" ? sessions?.status ?? "loading" : library.status;
  const restored = sessions?.status === "ready" ? sessions : null;
  const checkpoints = restored ? [restored.active, restored.assigned] : [];
  const workouts = getClientHomeWorkouts(library.data, restored?.active?.workoutId);
  const openWorkout = (workoutId: string, resume: boolean) => router.push({
    pathname: "/client/home/workout/[workoutId]",
    params: { workoutId, ...(resume ? { resume: String(Date.now()) } : {}) },
  });
  return (
    <ThemedBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.content}>
          <K2FBrand />
          <Text style={styles.title}>Good morning, {greetingName}</Text>
          <Text style={styles.subtitle}>Let&apos;s build strength!</Text>

          <View style={[styles.goalSection, styles.workoutList]}>
            <DemoWorkoutClientPicker />
            <Text accessibilityRole="header" style={styles.sectionTitle}>Your assigned workouts</Text>
            {workoutStatus === "error" && (
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
            )}
            {workoutStatus === "loading" ? (
              <Text accessibilityLiveRegion="polite" style={styles.subtitle}>Checking your workouts…</Text>
            ) : library.status === "ready" && (workouts.length ? workouts.map(({ workout, assignedAt }, index) => (
              <AssignedWorkoutCard key={workout.id} workout={workout} assignedAt={assignedAt} featured={index === 0 && !!restored}
                session={checkpoints.find((checkpoint) => checkpoint?.workoutId === workout.id)}
                onOpen={openWorkout} />
            )) : restored && <AssignedWorkoutCard workout={null} onOpen={openWorkout} />)}
          </View>

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
  workoutList: { gap: spacing.md },
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
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
});
