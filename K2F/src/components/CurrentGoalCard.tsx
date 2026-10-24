import { Pressable, StyleSheet, Text, View } from "react-native";

import { GoalProgressBar } from "@/components/GoalProgressBar";
import { GoalAchievedBanner, GoalNoDataNotice } from "@/components/GoalStatusBanner";
import {
  describeGoalProgress,
  FitnessGoal,
  formatGoalDate,
  formatMeasurement,
  formatShortGoalDate,
  getGoalProgress,
} from "@/goals/goal";
import { colors, radii, spacing, typography } from "@/theme";

type CurrentGoalCardProps = {
  goal: FitnessGoal | null;
  onViewProgress: () => void;
  onMessageCoach: () => void;
};

export function CurrentGoalCard({
  goal,
  onViewProgress,
  onMessageCoach,
}: CurrentGoalCardProps) {
  if (!goal) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your current goal</Text>
        <Text style={styles.emptyTitle}>No active goal yet</Text>
        <Text style={styles.emptyBody}>
          Your coach will set a goal with you. Send them a message to get started.
        </Text>
        <SecondaryButton label="Message your coach" onPress={onMessageCoach} />
      </View>
    );
  }

  const progress = getGoalProgress(goal);
  const achieved = progress.status === "achieved";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Your current goal</Text>
        <Pressable accessibilityRole="link" onPress={onViewProgress} hitSlop={spacing.sm}>
          <Text style={styles.link}>View progress</Text>
        </Pressable>
      </View>

      <Text style={styles.goalTitle}>{goal.title}</Text>

      {progress.status === "no-data" ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatMeasurement(goal.startValue, goal.unit)}</Text>
              <Text style={styles.statLabel}>Starting point</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, styles.targetValue]}>
                {formatMeasurement(goal.targetValue, goal.unit)}
              </Text>
              <Text style={styles.statLabel}>Target</Text>
            </View>
          </View>
          <GoalNoDataNotice
            title="No measurements yet"
            body="Your progress will show here after your first check-in."
          />
          <SecondaryButton label="Ask your coach to log one" onPress={onMessageCoach} />
        </>
      ) : (
        <>
          {achieved && (
            <GoalAchievedBanner
              detail={progress.achievedOn ? `Reached ${formatGoalDate(progress.achievedOn)}` : undefined}
            />
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatMeasurement(progress.currentValue, goal.unit)}
              </Text>
              <Text style={styles.statLabel}>
                {goal.metricLabel} · {formatShortGoalDate(progress.asOf)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, achieved && styles.achievedValue]}>
                {progress.percent}%
              </Text>
              <Text style={styles.statLabel}>Goal progress</Text>
            </View>
          </View>

          <GoalProgressBar
            fraction={progress.fraction}
            percent={progress.percent}
            startValue={goal.startValue}
            currentValue={progress.currentValue}
            targetValue={goal.targetValue}
            unit={goal.unit}
            achieved={achieved}
          />

          <Text style={styles.summary}>{describeGoalProgress(goal, progress)}</Text>
          {achieved && <SecondaryButton label="Plan your next goal" onPress={onMessageCoach} />}
        </>
      )}
    </View>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
    >
      <Text style={styles.emptyButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
  },
  link: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "600",
  },
  goalTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "300",
  },
  targetValue: {
    color: colors.primaryDark,
    fontWeight: "500",
  },
  achievedValue: {
    color: colors.achieved,
    fontWeight: "500",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  summary: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  emptyButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  emptyButtonPressed: {
    opacity: 0.8,
  },
  emptyButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
