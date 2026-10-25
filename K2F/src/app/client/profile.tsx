import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { mockCheckIns } from "@/checkins/mockCheckIns";
import { CheckInHistory } from "@/components/CheckInHistory";
import { ProgressEmptyState } from "@/components/ProgressEmptyState";
import { ProgressStatsSection } from "@/components/ProgressStatsSection";
import { mockClientStats } from "@/profile/mockStats";
import { ClientStats, hasRecordedProgress } from "@/profile/stats";
import { colors, radii, spacing, typography } from "@/theme";

function describeProfileDetails(stats: ClientStats): string | undefined {
  const parts = [
    stats.heightCm !== null ? `${stats.heightCm} cm` : null,
    stats.age !== null ? `${stats.age} years old` : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export default function Profile() {
  const router = useRouter();
  const stats = mockClientStats;
  const checkIns = mockCheckIns;
  const hasProgress = hasRecordedProgress(stats) || checkIns.length > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Text style={styles.brand}>KEYS2FITNESS</Text>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.subtitle}>Your fitness journey, all in one place</Text>

      {hasProgress ? (
        <>
          <ProgressStatsSection stats={stats} />
          <View style={styles.section}>
            <CheckInHistory checkIns={checkIns} />
          </View>
        </>
      ) : (
        <ProgressEmptyState
          profileDetails={describeProfileDetails(stats)}
          onMessageCoach={() => router.push("/client/messages")}
        />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/client/progress")}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
      >
        <Text style={styles.secondaryButtonText}>View Progress</Text>
      </Pressable>
    </ScrollView>
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
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
