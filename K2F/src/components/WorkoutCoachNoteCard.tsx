import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";
import type { WorkoutCoachNote } from "@/workouts/coachNote";

type Props = {
  note: WorkoutCoachNote;
  // e.g. "Upper Body Strength · Week 5, Day 3", so the client knows which session the note is for.
  sessionLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function WorkoutCoachNoteCard({ note, sessionLabel, style }: Props) {
  const byline = [note.author ? `From ${note.author}` : "From your coach", note.updatedLabel && `Updated ${note.updatedLabel}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={[styles.card, style]}
      accessible
      accessibilityLabel={`Note from your coach for ${sessionLabel}. ${byline}. ${note.text}`}
    >
      <Text style={styles.eyebrow}>COACH&apos;S NOTE</Text>
      <Text style={styles.session}>For {sessionLabel}</Text>
      {/* Full text, never truncated; selectable so long notes can be copied. */}
      <Text style={styles.text} selectable>
        {note.text}
      </Text>
      <Text style={styles.byline}>{byline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftColor: colors.primaryDark,
    borderLeftWidth: 5,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  session: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  text: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  byline: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.md,
  },
});
