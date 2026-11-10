import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getCoachTip } from "@/workouts/coachTips";
import type { WorkoutExercise } from "@/workouts/workout";
import { useWorkoutLibraryState } from "@/workouts/workoutLibraryStore";
import { colors, layout, radii, spacing, typography } from "@/theme";

type ExerciseDetailsModalProps = {
  exercise: WorkoutExercise | null;
  onClose: () => void;
};

export function ExerciseDetailsModal({ exercise, onClose }: ExerciseDetailsModalProps) {
  // K2F-108: the tip is for the client whose workout is open (demo client for now)
  const library = useWorkoutLibraryState();
  const coachTip = exercise ? getCoachTip(library.data, library.data.previewClientId, exercise) : null;

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


            {/* K2F-166: Display the prescribed sets, repetitions,
                and weight for the selected exercise.
                Weight is only shown when applicable.
            */}
            <View style={styles.prescriptionRow}>

              {/* Display the number of assigned sets. */}
              <View style={styles.prescriptionItem}>
                <Text style={styles.label}>Sets</Text>
                <Text style={styles.value}>{exercise.sets}</Text>
              </View>

              {/* Display the number of repetitions. */}
              <View style={styles.prescriptionItem}>
                <Text style={styles.label}>Reps</Text>
                <Text style={styles.value}>{exercise.reps}</Text>
              </View>

              {/* Only show weight if the exercise has one assigned. */}
              {exercise.weight?.trim() ? (
                <View style={styles.prescriptionItem}>
                  <Text style={styles.label}>Weight</Text>
                  <Text style={styles.value}>{exercise.weight}</Text>
                </View>
              ) : null}

            </View>

            {/* K2F-167: Display instructions for the selected exercise.
                K2F-107: Keep the section when instructions are missing and say so.
            */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {exercise.instructions?.trim() ? (
                <Text style={styles.body}>{exercise.instructions}</Text>
              ) : (
                <Text style={[styles.body, styles.emptyText]}>
                  No instructions for this exercise yet.
                </Text>
              )}
            </View>

              {exercise.demonstrationAvailable && <VideoPlaceholder />}
              {exercise.alternative?.trim() && <View style={styles.notesCard}>
                <Text style={styles.sectionTitle}>Alternative exercise</Text>
                <Text style={styles.body}>{exercise.alternative}</Text>
              </View>}


            {/* K2F-108: Coach tip for this client and this exercise only.
                No tip means no card, never another client's tip.
            */}
            {coachTip ? (
              <View style={styles.tipCard}>
                <Text style={styles.tipEyebrow}>JUST FOR YOU · {exercise.name.toUpperCase()}</Text>
                <Text style={styles.sectionTitle}>Coach recommendation</Text>
                <Text style={styles.tipText}>{coachTip}</Text>
              </View>
            ) : null}

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

  // K2F-168: Display prescription values in a flexible row.
  // Allows the values to wrap on smaller mobile screens.
  prescriptionRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
  },
  // Each prescription field has space for its label and value.
  // Prevents sets, repetitions, and weights from overlapping.
  prescriptionItem: {
    flexGrow: 1,
    flexBasis: 90,
    minWidth: 0,
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
  emptyText: {
    fontStyle: "italic",
  },
  // Coach tip stands out from the general instructions and the alternative card
  tipCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderRadius: radii.button,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  tipEyebrow: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
  },
  tipText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
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
