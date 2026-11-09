import { useState } from "react";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, layout, radii, spacing, typography } from "@/theme";
import type { WorkoutCoachNote } from "@/workouts/coachNote";

type Props = {
  note: WorkoutCoachNote;
  // e.g. "Upper Body Strength · Week 5, Day 3", so the client knows which session the note is for.
  sessionLabel: string;
  style?: StyleProp<ViewStyle>;
  collapsible?: boolean;
};

export function WorkoutCoachNoteCard({ note, sessionLabel, style, collapsible = false }: Props) {
  const [expanded, setExpanded] = useState(!collapsible);
  const byline = [note.author ? `From ${note.author}` : "From your coach", note.updatedLabel && `Updated ${note.updatedLabel}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={[styles.card, collapsible && styles.collapsibleCard, style]}
      accessible={!collapsible}
      accessibilityLabel={collapsible ? undefined : `Note from your coach for ${sessionLabel}. ${byline}. ${note.text}`}
    >
      {collapsible ? (
        <Pressable accessibilityRole="button"
          accessibilityLabel={`${expanded ? "Collapse" : "Expand"} coach's note`}
          accessibilityHint={`Note for ${sessionLabel}`}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>COACH&apos;S NOTE</Text>
            {expanded && <Text style={styles.session}>For {sessionLabel}</Text>}
          </View>
          <SymbolView name={expanded
            ? { ios: "chevron.up", android: "expand_less", web: "expand_less" }
            : { ios: "chevron.down", android: "expand_more", web: "expand_more" }}
            size={spacing.lg} tintColor={colors.primaryDark} />
        </Pressable>
      ) : <>
        <Text style={styles.eyebrow}>COACH&apos;S NOTE</Text>
        <Text style={styles.session}>For {sessionLabel}</Text>
      </>}
      {(!collapsible || expanded) && <>
      {/* Full text, never truncated; selectable so long notes can be copied. */}
      <Text style={styles.text} selectable>
        {note.text}
      </Text>
      <Text style={styles.byline}>{byline}</Text>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsibleCard: { padding: spacing.md },
  toggle: { flexDirection: "row", alignItems: "center", gap: spacing.md,
    minHeight: layout.minTouchTarget, borderRadius: radii.control },
  heading: { flex: 1 },
  pressed: { backgroundColor: colors.surfaceMuted },
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
    fontSize: typography.caption,
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
    lineHeight: typography.bodyLineHeight,
    marginTop: spacing.sm,
  },
  byline: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.md,
  },
});
