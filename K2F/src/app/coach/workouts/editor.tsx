import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

import { useCoachClientsState } from "@/clients/clientStore";
import { ThemedBackground } from "@/components/ThemedBackground";
import { WorkoutAssignmentConfirmation } from "@/components/WorkoutAssignmentConfirmation";
import { BuilderButton, BuilderField, ClientAssignmentPicker, ExercisePicker, PrescriptionStepper, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { useWorkoutEditor } from "@/hooks/useWorkoutEditor";
import { isCompactLayout, layout } from "@/theme";
import type { WorkoutTemplate } from "@/workouts/workoutLibraryModel";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";

export default function WorkoutEditorScreen() {
  const { templateId, clientId } = useLocalSearchParams<{ templateId?: string; clientId?: string }>();
  const state = useWorkoutLibraryState();
  const template = state.data.templates.find((item) => item.id === templateId);
  if (state.status !== "ready" || (templateId && !template)) return <ThemedBackground><View style={styles.content}>
    <Text style={styles.heading}>{state.status === "loading" ? "Loading workout…" : templateId && !template && state.status === "ready" ? "Template unavailable" : "Library unavailable"}</Text>
    {state.status === "error" && <><Text style={styles.error}>{state.error}</Text>
      <BuilderButton label="Retry library" onPress={() => { void workoutLibrary.load(); }} /></>}
  </View></ThemedBackground>;
  return <WorkoutEditorForm key={`${templateId || "new"}:${clientId ?? ""}`} template={template} initialClientId={clientId} />;
}

function WorkoutEditorForm({ template, initialClientId }: { template?: WorkoutTemplate; initialClientId?: string }) {
  const router = useRouter();
  const { clients, loadStatus } = useCoachClientsState();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const wideControls = !compact && width >= layout.maxContentWidth;
  const editor = useWorkoutEditor({ template, initialClientId, availableClientIds: clients.map((client) => client.id),
    onSaved: (result) => router.replace({ pathname: "/coach/workouts", params: { saved: String(Date.now()), clientId: result.assignments[0]?.clientId ?? "" } }) });
  const { draft, selectedClients, reusable, picker, errors, feedback, saving: savingNow, editExercise, setSelectedClients } = editor;
  const saving = savingNow || editor.reviewClients !== null;

  return <ThemedBackground><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>KEYS2FITNESS / COACH</Text>
      <Text style={styles.title}>{template ? "Edit Workout" : "Build Workout"}</Text>
      <Text style={styles.muted}>Build a reusable plan or assign a fresh copy to selected demo clients. All weights are in pounds.</Text>
      <BuilderField label="Workout name" value={draft.title} disabled={saving} error={errors.title}
        onChange={(title) => editor.editField("title", title)} />
      <BuilderField label="Estimated duration (minutes, optional)" value={draft.durationMinutes} disabled={saving}
        error={errors.durationMinutes} keyboardType="number-pad" onChange={(durationMinutes) => editor.editField("durationMinutes", durationMinutes)} />
      <BuilderField label="Coach's workout note (shown to the client)" value={draft.notes} multiline disabled={saving}
        onChange={(notes) => editor.editField("notes", notes)} />
      <Text style={styles.heading}>Exercises</Text>
      {errors.exercises && <Text accessibilityRole="alert" style={styles.error}>{errors.exercises}</Text>}
      {!draft.exercises.length && <Text style={styles.muted}>Add an exercise from the catalog or use a custom name.</Text>}
      {draft.exercises.map((exercise) => <View key={exercise.id} style={styles.card}>
        <Text style={styles.heading}>{exercise.name}</Text>
        <BuilderField label="Exercise name" accessibilityLabel={`Exercise name for ${exercise.name}`} value={exercise.name} disabled={saving}
          error={errors[exercise.id + ".name"]} onChange={(name) => editExercise(exercise.id, { name })} />
        <View style={wideControls ? styles.actions : styles.field}>
          <PrescriptionStepper label="Sets" exerciseName={exercise.name} value={exercise.sets} min={1} max={50} disabled={saving}
            error={errors[exercise.id + ".sets"]} onChange={(sets) => editExercise(exercise.id, { sets })} />
          <PrescriptionStepper label="Reps" exerciseName={exercise.name} value={exercise.reps} min={1} max={200} disabled={saving}
            error={errors[exercise.id + ".reps"]} onChange={(reps) => editExercise(exercise.id, { reps })} />
          <PrescriptionStepper label="Weight (lb)" exerciseName={exercise.name} value={exercise.weightLb} min={0} max={2000} step={5} disabled={saving}
            error={errors[exercise.id + ".weightLb"]} onChange={(weightLb) => editExercise(exercise.id, { weightLb })} />
          <PrescriptionStepper label="Rest (seconds)" exerciseName={exercise.name} value={exercise.restSeconds ?? ""} min={0} max={3600} step={15} disabled={saving}
            error={errors[exercise.id + ".restSeconds"]} onChange={(restSeconds) => editExercise(exercise.id, { restSeconds })} />
        </View>
        <Text style={styles.muted}>Rest is the recovery after each set / before the next exercise. Leave weight or rest blank when not prescribed; 0 lb means bodyweight and 0 seconds means no rest.</Text>
        <BuilderField label="Instructions" accessibilityLabel={`Instructions for ${exercise.name}`} value={exercise.instructions} multiline disabled={saving}
          onChange={(instructions) => editExercise(exercise.id, { instructions })} />
        <BuilderField label="Default coach recommendation (copied to new assignments)" accessibilityLabel={`Coach notes for ${exercise.name}`} value={exercise.coachNotes} multiline disabled={saving}
          onChange={(coachNotes) => editExercise(exercise.id, { coachNotes })} />
        {exercise.alternative && <Text style={styles.muted}>Alternative: {exercise.alternative}</Text>}
        <View style={[styles.actions, compact && styles.stacked]}>
          <BuilderButton label={exercise.alternative ? "Change alternative" : "Add alternative"} accessibilityLabel={`Choose alternative for ${exercise.name}`} secondary disabled={saving} onPress={() => editor.openPicker({ kind: "alternative", id: exercise.id })} />
          {exercise.alternative && <BuilderButton label="Remove alternative" accessibilityLabel={`Remove alternative for ${exercise.name}`} secondary disabled={saving}
            onPress={() => editExercise(exercise.id, { alternative: undefined })} />}
          <BuilderButton label="Remove exercise" accessibilityLabel={`Remove ${exercise.name}`} secondary disabled={saving}
            onPress={() => editor.removeExercise(exercise.id)} />
        </View>
      </View>)}
      <BuilderButton label="Add exercise" secondary disabled={saving} onPress={() => editor.openPicker({ kind: "add" })} />
      <View style={styles.card}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="Save as reusable template" accessibilityState={{ checked: reusable, disabled: saving }}
          disabled={saving} onPress={editor.toggleReusable} style={({ pressed }) => [styles.clientRow, pressed && styles.pressed]}>
          <View style={[styles.checkbox, reusable && styles.checkboxChecked]}>{reusable && <Text style={styles.check}>✓</Text>}</View>
          <Text style={[styles.label, styles.flex]}>Save as reusable template</Text>
        </Pressable>
        <Text style={styles.heading}>Assign to clients</Text>
        <ClientAssignmentPicker clients={clients} loadStatus={loadStatus} selected={selectedClients} onChange={setSelectedClients} disabled={saving} />
      </View>
      {feedback && <Text accessibilityRole="alert" style={styles.error}>{feedback}</Text>}
      {!reusable && !selectedClients.length && <Text style={styles.muted}>Select clients to assign without saving a reusable template.</Text>}
      <BuilderButton label={saving ? "Saving…" : selectedClients.length ? `Assign workout · ${selectedClients.length} selected` : "Save template"}
        disabled={saving || (!reusable && !selectedClients.length) || (selectedClients.length > 0 && loadStatus !== "ready")}
        onPress={() => editor.requestSave(clients)} />
    </ScrollView>
    {picker && <ExercisePicker title={picker.kind === "add" ? "Add exercise" : "Choose alternative exercise"}
      onClose={editor.closePicker} onSelect={editor.selectExercise} />}
    {editor.reviewClients && editor.state.workflow.status !== "saved" && <WorkoutAssignmentConfirmation title={draft.title.trim()}
      summary={`${draft.exercises.length} ${draft.exercises.length === 1 ? "exercise" : "exercises"}${draft.durationMinutes ? ` · ${draft.durationMinutes} min` : ""}${reusable ? " · Also saves a reusable template" : ""}`}
      clients={editor.reviewClients} saving={savingNow} error={feedback} onConfirm={() => { void editor.confirmSave(); }} onCancel={editor.cancelSave} />}
  </KeyboardAvoidingView></ThemedBackground>;
}
