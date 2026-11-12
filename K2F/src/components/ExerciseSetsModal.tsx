import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ExerciseSetEntries } from "@/components/ExerciseSetEntries";
import { colors, layout, radii, spacing, typography } from "@/theme";
import type { WorkoutExercise } from "@/workouts/workout";
import type { PerformanceField } from "@/workouts/setPerformance";

type Props = {
  exercise: WorkoutExercise | null;
  disabled: boolean;
  onClose: () => void;
  onChange: (setId: string, field: PerformanceField, value: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onToggle: (setId: string) => void;
};

export function ExerciseSetsModal({ exercise, disabled, onClose, ...actions }: Props) {
  return (
    <Modal transparent visible={exercise !== null} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.heading}>Workout sets</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close workout sets" onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          {exercise && <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>{exercise.name}</Text>
            <View style={styles.prescription}>
              <Text style={styles.heading}>Coach prescribed</Text>
              <Text style={styles.body}>{exercise.sets} sets × {exercise.reps} reps · {exercise.weight?.trim() || "Bodyweight / no weight prescribed"}</Text>
              {exercise.restSeconds !== undefined && <Text style={styles.body}>Rest: {exercise.restSeconds} seconds between sets / exercises</Text>}
            </View>
            {disabled && <Text style={styles.body}>Start or resume the workout to edit and confirm sets.</Text>}
            <ExerciseSetEntries key={exercise.id} exercise={exercise} disabled={disabled} {...actions} />
          </ScrollView>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: spacing.sm },
  card: { width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "92%", backgroundColor: colors.surface, borderRadius: radii.card, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  heading: { color: colors.text, fontSize: typography.body, fontWeight: "700", flexShrink: 1 },
  close: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  closeText: { color: colors.primaryDark, fontSize: typography.body, fontWeight: "700" },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "700" },
  prescription: { backgroundColor: colors.surfaceMuted, borderRadius: radii.control, padding: spacing.md, gap: spacing.sm },
  body: { color: colors.textMuted, fontSize: typography.body },
  pressed: { opacity: 0.75 },
});
