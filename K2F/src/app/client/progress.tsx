import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GoalProgressBar } from "@/components/GoalProgressBar";
import { GoalAchievedBanner, GoalNoDataNotice } from "@/components/GoalStatusBanner";
import {
  describeGoalProgress,
  FitnessGoal,
  formatGoalDate,
  formatMeasurement,
  formatShortGoalDate,
  formatSignedMeasurement,
  getGoalProgress,
  sortEntriesNewestFirst,
} from "@/goals/goal";
import { mockCurrentGoal } from "@/goals/mockGoal";
import { colors, radii, spacing, typography } from "@/theme";

const RECENT_ENTRY_COUNT = 5;

export default function Progress() {
  const router = useRouter();
  const goal = mockCurrentGoal;
  const messageCoach = () => router.push("/client/messages");

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Text style={styles.brand}>KEYS2FITNESS</Text>
      <Text style={styles.title}>Your Progress</Text>
      <Text style={styles.subtitle}>Small steps. Stronger every week.</Text>

      {goal ? (
        <GoalProgressSection goal={goal} onMessageCoach={messageCoach} />
      ) : (
        <View style={[styles.card, styles.firstCard]}>
          <Text style={styles.cardTitle}>Goal progress</Text>
          <Text style={styles.emptyTitle}>No active goal yet</Text>
          <Text style={styles.emptyBody}>
            Once your coach sets a goal with you, your progress toward it will show up here.
          </Text>
          <SecondaryButton label="Message your coach" onPress={messageCoach} />
        </View>
      )}
    </ScrollView>
  );
}

type GoalProgressSectionProps = {
  goal: FitnessGoal;
  onMessageCoach: () => void;
};

function GoalProgressSection({ goal, onMessageCoach }: GoalProgressSectionProps) {
  const progress = getGoalProgress(goal);
  const achieved = progress.status === "achieved";
  const entries = sortEntriesNewestFirst(goal.entries);
  const recent = entries.slice(0, RECENT_ENTRY_COUNT);
  const netChange = progress.currentValue - goal.startValue;

  return (
    <>
      <View style={[styles.card, styles.firstCard]}>
        <Text style={styles.cardTitle}>Goal progress</Text>
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
              body="Progress is measured from your check-ins. After your first one is recorded, you'll see how far you've come."
            />
            <SecondaryButton label="Ask your coach to log a check-in" onPress={onMessageCoach} />
          </>
        ) : (
          <>
            {achieved && (
              <GoalAchievedBanner
                detail={
                  progress.achievedOn
                    ? `You hit ${formatMeasurement(goal.targetValue, goal.unit)} on ${formatGoalDate(progress.achievedOn)}.`
                    : undefined
                }
              />
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {formatMeasurement(progress.currentValue, goal.unit)}
                </Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, achieved ? styles.achievedValue : styles.targetValue]}>
                  {formatMeasurement(goal.targetValue, goal.unit)}
                </Text>
                <Text style={styles.statLabel}>{achieved ? "Target ✓" : "Target"}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatSignedMeasurement(netChange, goal.unit)}</Text>
                <Text style={styles.statLabel}>Since {formatShortGoalDate(goal.startDate)}</Text>
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

            <Text style={[styles.progressHeadline, achieved && styles.achievedHeadline]}>
              {achieved ? "100% · Goal complete" : `${progress.percent}% of goal reached`}
            </Text>
            <Text style={styles.summary}>{describeGoalProgress(goal, progress)}</Text>
            <Text style={styles.asOf}>
              Based on your latest measurement, {formatGoalDate(progress.asOf)}
            </Text>
            {achieved && (
              <SecondaryButton label="Plan your next goal with your coach" onPress={onMessageCoach} />
            )}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recorded measurements</Text>
        {recent.length === 0 ? (
          <Text style={styles.emptyBody}>
            No check-ins yet. Measurements you or your coach record will appear here, newest first.
          </Text>
        ) : (
          recent.map((entry, index) => {
            // Compare against the next-older entry, or the start value for the oldest one.
            const previous = entries[index + 1]?.value ?? goal.startValue;
            const isAchievedEntry = entry.date === progress.achievedOn;
            return (
              <View key={entry.date} style={styles.entryRow}>
                <Text style={styles.entryDate}>{formatShortGoalDate(entry.date)}</Text>
                <View style={styles.entryMain}>
                  <Text style={styles.entryValue}>{formatMeasurement(entry.value, goal.unit)}</Text>
                  {isAchievedEntry && <Text style={styles.entryTag}>✓ Target reached</Text>}
                </View>
                <Text style={styles.entryChange}>
                  {formatSignedMeasurement(entry.value - previous, goal.unit)}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </>
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
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenContent: {
    padding: spacing.lg,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  firstCard: {
    marginTop: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
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
    fontSize: 26,
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
  progressHeadline: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  achievedHeadline: {
    color: colors.achieved,
  },
  summary: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  asOf: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  entryRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  entryDate: {
    color: colors.textMuted,
    fontSize: typography.label,
    width: 64,
  },
  entryMain: {
    flex: 1,
  },
  entryValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  entryTag: {
    color: colors.achieved,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  entryChange: {
    color: colors.textMuted,
    fontSize: typography.label,
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
