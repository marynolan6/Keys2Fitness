import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BuilderButton, BuilderField, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { useExerciseRecommendation } from "@/hooks/useExerciseRecommendation";
import { spacing } from "@/theme";

export function ExerciseRecommendationEditor({ clientId, clientName, assignmentId, exerciseId, onClose, onSaved }: {
  clientId: string; clientName: string; assignmentId: string; exerciseId: string; onClose: () => void; onSaved: () => void;
}) {
  const editor = useExerciseRecommendation({ clientId, assignmentId, exerciseId }, onSaved);
  const { state } = editor;
  const saving = state.status === "saving" || state.status === "saved";
  const insets = useSafeAreaInsets();
  const content = state.status === "editing" || state.status === "saving" ? state : null;
  const exercise = content?.details.exercise;
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
    <KeyboardAvoidingView style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View accessibilityViewIsModal style={styles.modal}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.field}>
          <Text accessibilityRole="header" style={styles.heading}>Edit client recommendation</Text>
          <Text style={styles.label}>Client: {clientName}</Text>
          {state.status === "loading" && <Text style={styles.muted}>Loading assigned exercise…</Text>}
          {state.status === "load-error" && <>
            <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
            <BuilderButton label="Retry recommendation" onPress={editor.retry} />
          </>}
          {content && exercise && <>
            <Text style={styles.label}>Workout: {content.details.workoutTitle}</Text>
            <Text style={styles.heading}>Exercise: {exercise.name}</Text>
            <Text style={styles.muted}>{exercise.sets} × {exercise.reps} · {exercise.weight || "No weight prescribed"}{exercise.restSeconds === undefined ? "" : ` · Rest ${exercise.restSeconds} seconds`}</Text>
            <Text style={styles.label}>Exercise instructions (read-only)</Text>
            <Text style={styles.muted}>{exercise.instructions || "No instructions provided."}</Text>
            <BuilderField label="Client-specific coach recommendation" value={content.draft} onChange={editor.change} multiline disabled={saving} />
            <Text style={styles.muted}>Only this client&apos;s exercise in this assigned workout is updated. Leave blank to remove the recommendation. Prescriptions and reusable instructions are separate.</Text>
            {content.error && <Text accessibilityRole="alert" style={styles.error}>{content.error}</Text>}
          </>}
        </ScrollView>
        {content && <BuilderButton label={saving ? "Saving…" : "Save recommendation"} disabled={saving} onPress={() => { void editor.save(); }} />}
        <BuilderButton label="Cancel recommendation" secondary disabled={saving} onPress={onClose} />
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
