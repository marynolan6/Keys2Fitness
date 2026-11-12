import { useEffect, useReducer, useRef, useState } from "react";

import { newDraftExercise } from "@/workouts/exerciseCatalog";
import { validateWorkoutDraft, type DraftExercise, type WorkoutTemplate } from "@/workouts/workoutLibraryModel";
import { createWorkoutEditorState, workoutEditorReducer, type ExercisePickerState } from "@/workouts/workoutEditorReducer";
import { workoutLibraryService } from "@/workouts/workoutLibraryStore";
import type { SaveWorkoutResult, WorkoutLibraryService } from "@/workouts/workoutLibraryService";

export function useWorkoutEditor(options: {
  template?: WorkoutTemplate;
  initialClientId?: string;
  availableClientIds: readonly string[];
  onSaved: (result: SaveWorkoutResult) => void;
  service?: WorkoutLibraryService;
}) {
  const service = options.service ?? workoutLibraryService;
  const { onSaved } = options;
  const [state, dispatch] = useReducer(workoutEditorReducer, options, createWorkoutEditorState);
  const pending = useRef(false);
  const [reviewClients, setReviewClients] = useState<{ id: string; name: string }[] | null>(null);
  const deliveredResult = useRef<SaveWorkoutResult | null>(null);
  useEffect(() => {
    if (state.workflow.status === "saved" && deliveredResult.current !== state.workflow.result) {
      deliveredResult.current = state.workflow.result;
      onSaved(state.workflow.result);
    }
  }, [state.workflow, onSaved]);

  function requestSave(clients: readonly { id: string; name: string }[]) {
    if (pending.current || state.workflow.status === "saved" || reviewClients) return;
    const errors = validateWorkoutDraft(state.draft);
    if (Object.keys(errors).length) { dispatch({ type: "validation-failed", errors }); return; }
    if (!state.selectedClients.length) { void save(); return; }
    setReviewClients(state.selectedClients.map((id) => ({ id, name: clients.find((client) => client.id === id)?.name ?? "Unavailable client" })));
    dispatch({ type: "confirmation-requested" });
  }

  async function save(): Promise<void> {
    if (pending.current || state.workflow.status === "saved") return;
    if (state.selectedClients.length && !reviewClients) return;
    const errors = validateWorkoutDraft(state.draft);
    if (Object.keys(errors).length) { dispatch({ type: "validation-failed", errors }); return; }
    pending.current = true;
    dispatch({ type: "save-started" });
    try {
      const result = await service.saveWorkout({ draft: state.draft, clientIds: state.selectedClients,
        reusable: state.reusable, existingTemplateId: options.template?.id });
      // React Activity can hide this tab while preserving its reducer state.
      // Retain the result; the effect delivers navigation when the view is active.
      dispatch({ type: "save-succeeded", result });
    } catch (error) {
      dispatch({ type: "save-failed", error: error instanceof Error ? error.message : "Your workout could not be saved. Try again." });
    } finally { pending.current = false; }
  }

  return {
    state, draft: state.draft, selectedClients: state.selectedClients, reusable: state.reusable, picker: state.picker, errors: state.errors,
    saving: state.workflow.status === "saving" || state.workflow.status === "saved",
    feedback: state.workflow.status === "error" ? state.workflow.message : "",
    requestSave, confirmSave: save, reviewClients,
    cancelSave: () => { if (!pending.current) { setReviewClients(null); dispatch({ type: "confirmation-canceled" }); } },
    editField: (field: "title" | "durationMinutes" | "notes", value: string) => dispatch({ type: "field-changed", field, value }),
    editExercise: (id: string, update: Partial<DraftExercise>) => dispatch({ type: "exercise-changed", id, update }),
    removeExercise: (id: string) => dispatch({ type: "exercise-removed", id }),
    setSelectedClients: (ids: string[]) => dispatch({ type: "clients-selected", ids }),
    toggleReusable: () => dispatch({ type: "reusable-toggled" }),
    openPicker: (picker: Exclude<ExercisePickerState, null>) => dispatch({ type: "picker-opened", picker }),
    closePicker: () => dispatch({ type: "picker-closed" }),
    selectExercise: (exercise: { name: string; instructions: string }) => {
      if (state.picker?.kind === "add") dispatch({ type: "exercise-added", exercise: newDraftExercise(exercise.name, exercise.instructions) });
      else if (state.picker?.kind === "alternative") {
        dispatch({ type: "exercise-changed", id: state.picker.id, update: { alternative: exercise.name } });
        dispatch({ type: "picker-closed" });
      }
    },
  };
}
