import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CurrentGoalCard } from "@/components/CurrentGoalCard";
import { AssignedWorkoutCard } from "@/components/AssignedWorkoutCard";
import { ThemedBackground } from "@/components/ThemedBackground";
import { mockAssignedWorkout } from "@/workouts/mockWorkout";
import { mockCurrentGoal } from "@/goals/mockGoal";
import { RecentMessagesWidget } from "@/components/RecentMessagesWidgetClient";
import { defaultProfile } from "@/profile/profile";
import { loadProfile } from "@/profile/profileStorage";
import { colors, layout, spacing, typography } from "@/theme";

export default function ClientHome() {
  const router = useRouter();
  const assignedWorkout = mockAssignedWorkout;
  const [firstName, setFirstName] = useState(defaultProfile.fullName.split(" ")[0]);

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
  const openWorkout = (workoutId: string) => router.push({
    pathname: "/client/home/workout/[workoutId]",
    params: { workoutId },
  });



  return (
    <ThemedBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.content}>
          <Text style={styles.brand}>KEYS2FITNESS</Text>
          <Text style={styles.title}>Good morning, {firstName}</Text>
          <Text style={styles.subtitle}>Let&apos;s build strength!</Text>

          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>Assigned workout</Text>
            <AssignedWorkoutCard workout={assignedWorkout} onOpen={openWorkout} />
          </View>

          <View style={styles.goalSection}>
            <CurrentGoalCard
              goal={mockCurrentGoal}
              onViewProgress={() => router.push("/client/progress")}
              onMessageCoach={() => router.push("/client/messages")}
            />
          </View>

          <RecentMessagesWidget />

        </View>
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
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
