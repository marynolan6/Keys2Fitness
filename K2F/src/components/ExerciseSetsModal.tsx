import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExerciseSetEntries } from "@/components/ExerciseSetEntries";
import { RecordedSets } from "@/components/RecordedSets";
import { WorkoutProgressIndicator } from "@/components/WorkoutProgressIndicator";
import type { getWorkoutProgress } from "@/workouts/workoutProgress";
import { colors, layout, radii, spacing, typography } from "@/theme";
import type { WorkoutExercise } from "@/workouts/workout";
import type { PerformanceField } from "@/workouts/setPerformance";
import { countLabel, prescriptionLabel } from "@/workouts/workoutLabels";
import type { WorkoutTimer } from "@/workouts/workoutTimer";

type Props = {
  exercise: WorkoutExercise | null;
  disabled: boolean;
  status: WorkoutTimer["status"];
  progress: ReturnType<typeof getWorkoutProgress>;
  onClose: () => void;
  onChange: (setId: string, field: PerformanceField, value: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onToggle: (setId: string) => void;
};

export function ExerciseSetsModal({ exercise, disabled, status, progress, onClose, ...actions }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={exercise !== null} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.overlay, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.heading}>Workout sets</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close workout sets" onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <WorkoutProgressIndicator progress={progress} />
          {exercise && <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>{exercise.name}</Text>
            <View style={styles.prescription}>
              <Text style={styles.heading}>Coach prescribed</Text>
              <Text style={styles.body}>{prescriptionLabel(exercise)}</Text>
              {exercise.restSeconds !== undefined && <Text style={styles.body}>Rest: {countLabel(exercise.restSeconds, "second")}</Text>}
            </View>
            {status === "running" ? <ExerciseSetEntries key={exercise.id} exercise={exercise} disabled={disabled} {...actions} />
              : <>
                <Text style={styles.heading}>Your log</Text>
                {status !== "ended" && <Text style={styles.body}>{status === "ready" ? "Start the workout to log sets." : "Resume the workout to edit your sets."}</Text>}
                <RecordedSets exercise={exercise} />
              </>}
          </ScrollView>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", padding: spacing.sm },
  card: { flex: 1, width: "100%", maxWidth: layout.maxContentWidth, backgroundColor: colors.surface, borderRadius: radii.card, overflow: "hidden" },
  scroll: { flex: 1 },
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
