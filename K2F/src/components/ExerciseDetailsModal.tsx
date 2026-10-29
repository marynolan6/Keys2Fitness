import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { WorkoutExercise } from "@/workouts/workout";
import { colors, layout, radii, spacing, typography } from "@/theme";

type ExerciseDetailsModalProps = {
  exercise: WorkoutExercise | null;
  onClose: () => void;
};

export function ExerciseDetailsModal({ exercise, onClose }: ExerciseDetailsModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={exercise !== null}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Exercise details</Text>
            <Pressable
              accessibilityLabel="Close exercise details"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          {exercise && (
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.title}>{exercise.name}</Text>

              <View style={styles.prescriptionRow}>
                <View style={styles.prescriptionItem}>
                  <Text style={styles.label}>Sets</Text>
                  <Text style={styles.value}>{exercise.sets}</Text>
                </View>
                <View style={styles.prescriptionItem}>
                  <Text style={styles.label}>Reps</Text>
                  <Text style={styles.value}>{exercise.reps}</Text>
                </View>
                <View style={styles.prescriptionItem}>
                  <Text style={styles.label}>Weight</Text>
                  <Text style={styles.value}>{exercise.weight}</Text>
                </View>
              </View>

              {exercise.instructions && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  <Text style={styles.body}>{exercise.instructions}</Text>
                </View>
              )}

              {exercise.demonstrationAvailable && <VideoPlaceholder />}

              {exercise.coachNotes && (
                <View style={styles.notesCard}>
                  <Text style={styles.sectionTitle}>Coach recommendation</Text>
                  <Text style={styles.body}>{exercise.coachNotes}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function VideoPlaceholder() {
  return (
    <View accessibilityLabel="Exercise demonstration video coming soon" style={styles.videoPlaceholder}>
      <View style={styles.playIcon}>
        <Text style={styles.playIconText}>▶</Text>
      </View>
      <Text style={styles.videoTitle}>Exercise demonstration</Text>
      <Text style={styles.videoSubtitle}>Video coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    maxHeight: "88%",
    width: "100%",
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    paddingHorizontal: spacing.sm,
  },
  closeButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
  },
  prescriptionRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  prescriptionItem: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
  },
  value: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  videoPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 180,
    padding: spacing.lg,
  },
  playIcon: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  playIconText: {
    color: colors.surface,
    fontSize: 24,
    marginLeft: spacing.xs,
  },
  videoTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  videoSubtitle: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  notesCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    gap: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
