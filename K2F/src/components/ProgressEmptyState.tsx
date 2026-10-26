import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

const TRACKED_ITEMS = [
  "Weight from each check-in",
  "Body measurements like waist and hips",
  "Workouts completed and consistency",
];

type ProgressEmptyStateProps = {
  // Real profile details (e.g. "5'6\" · 29 years old"), shown only when recorded.
  profileDetails?: string;
  onMessageCoach: () => void;
};

export function ProgressEmptyState({ profileDetails, onMessageCoach }: ProgressEmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>PROGRESS</Text>
      <Text style={styles.title} accessibilityRole="header">
        No progress recorded yet
      </Text>
      <Text style={styles.body}>
        Your stats and check-in history will appear here after your first check-in with your coach.
      </Text>

      <View style={styles.trackedBox}>
        <Text style={styles.trackedHeading}>What we&apos;ll track</Text>
        {TRACKED_ITEMS.map((item) => (
          <View key={item} style={styles.trackedRow}>
            <View style={styles.bullet} />
            <Text style={styles.trackedText}>{item}</Text>
          </View>
        ))}
      </View>

      {profileDetails && (
        <Text style={styles.details}>
          <Text style={styles.detailsLabel}>Your details: </Text>
          {profileDetails}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onMessageCoach}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>Book your first check-in</Text>
      </Pressable>
      <Text style={styles.hint}>Opens Messages so you can arrange it with your coach.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
    marginTop: spacing.xs,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.sm,
  },
  trackedBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm + spacing.xs,
  },
  trackedHeading: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "700",
    marginBottom: 2,
  },
  trackedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  bullet: {
    backgroundColor: colors.primaryDark,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  trackedText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.label,
  },
  details: {
    color: colors.text,
    fontSize: typography.label,
    marginTop: spacing.md,
  },
  detailsLabel: {
    color: colors.textMuted,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
