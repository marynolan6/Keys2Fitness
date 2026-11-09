import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { WorkoutCoachNoteCard } from "@/components/WorkoutCoachNoteCard";
import { colors, layout, radii, spacing, typography } from "@/theme";
import type { WorkoutCoachNote } from "@/workouts/coachNote";

type Props = {
  note: WorkoutCoachNote;
  sessionLabel: string;
  visible: boolean;
  // Reassures the client that the workout is untouched, e.g. "Workout running · 12:34 · 2 of 4 exercises complete".
  statusText: string;
  onClose: () => void;
};

// Shown over the workout screen (never a navigation), so the timer, sets, and progress stay exactly as they were.
export function CoachNoteSheet({ note, sessionLabel, visible, statusText, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Close coach's note"
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <WorkoutCoachNoteCard note={note} sessionLabel={sessionLabel} style={styles.card} />
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {statusText}
            </Text>
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backButtonText}>Back to workout</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type ButtonProps = {
  onPress: () => void;
};

// Floating shortcut to the note while the inline note card is scrolled out of view.
export function CoachNoteButton({ onPress }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open coach's note"
      accessibilityHint="Shows the note without leaving or pausing your workout"
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Text style={styles.fabText}>Coach&apos;s note</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    maxHeight: "85%",
    maxWidth: layout.maxContentWidth,
    paddingBottom: spacing.lg,
    width: "100%",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  card: {
    marginBottom: 0,
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.md,
    textAlign: "center",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    minHeight: layout.minTouchTarget + spacing.sm,
  },
  backButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
  fab: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    bottom: spacing.lg,
    elevation: 4,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    position: "absolute",
    right: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: {
    color: colors.surface,
    fontSize: typography.label,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});
