import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { CurrentGoalCard } from "@/components/CurrentGoalCard";
import { AssignedWorkoutCard } from "@/components/AssignedWorkoutCard";
import { ThemedBackground } from "@/components/ThemedBackground";
import { mockAssignedWorkout } from "@/workouts/mockWorkout";
import { mockCurrentGoal } from "@/goals/mockGoal";

import { RecentMessagesWidget } from "@/components/RecentMessagesWidget";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

type QuickAccessCardProps = {
  label: string;
  description: string;
  onPress: () => void;
  compact: boolean;
};

function QuickAccessCard({ label, description, onPress, compact }: QuickAccessCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      accessibilityLabel={`${label}: ${description}`}
      style={({ pressed }) => [styles.quickAccessCard, compact && styles.quickAccessCardCompact, pressed && styles.quickAccessCardPressed]}
    >
      <Text style={styles.quickAccessLabel}>{label}</Text>
      <Text style={styles.quickAccessDescription}>{description}</Text>
    </Pressable>
  );
}


export default function ClientHome() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const assignedWorkout = mockAssignedWorkout;
  const openWorkout = (workoutId: string) => router.push({
    pathname: "/client/home/workout/[workoutId]",
    params: { workoutId },
  });



  return (
    <ThemedBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.content}>
          <Text style={styles.brand}>KEYS2FITNESS</Text>
          <Text style={styles.title}>Good morning, Spencer</Text>
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

          <View style={styles.quickAccessSection}>
            <Text style={styles.sectionTitle}>Quick access</Text>
            <View style={styles.quickAccessGrid}>
              {assignedWorkout && (
                <QuickAccessCard
                  label="Workout"
                  description="Continue training"
                  compact={compact}
                  onPress={() => openWorkout(assignedWorkout.id)}
                />
              )}
              <QuickAccessCard
                label="Messages"
                description="Talk to your coach"
                compact={compact}
                onPress={() => router.push("/client/messages")}
              />
              <QuickAccessCard
                label="Progress"
                description="Review your progress"
                compact={compact}
                onPress={() => router.push("/client/progress")}
              />
            </View>
          </View>
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
  quickAccessSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  quickAccessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickAccessCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    width: "48%",
    justifyContent: "center",
    minHeight: layout.minTouchTarget * 2,
    padding: spacing.md,
  },
  quickAccessCardCompact: {
    width: "100%",
    minHeight: layout.minTouchTarget,
  },
  quickAccessCardPressed: {
    backgroundColor: colors.border,
  },
  quickAccessLabel: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  quickAccessDescription: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.sm,
    textAlign: "center",
  },

});
