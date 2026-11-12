import { draftFromTemplate, emptyWorkoutDraft, type DraftExercise, type WorkoutDraft, type WorkoutTemplate } from "./workoutLibraryModel";
import type { SaveWorkoutResult } from "./workoutLibraryService";

export type ExercisePickerState = { kind: "add" } | { kind: "alternative"; id: string } | null;
type EditorWorkflow = { status: "editing" } | { status: "confirming" } | { status: "saving" } | { status: "saved"; result: SaveWorkoutResult } | { status: "error"; message: string };
export type WorkoutEditorState = {
  draft: WorkoutDraft;
  selectedClients: string[];
  reusable: boolean;
  picker: ExercisePickerState;
  errors: Record<string, string>;
  workflow: EditorWorkflow;
};

export type WorkoutEditorAction =
  | { type: "field-changed"; field: "title" | "durationMinutes" | "notes"; value: string }
  | { type: "exercise-changed"; id: string; update: Partial<DraftExercise> }
  | { type: "exercise-added"; exercise: DraftExercise }
  | { type: "exercise-removed"; id: string }
  | { type: "clients-selected"; ids: string[] }
  | { type: "reusable-toggled" }
  | { type: "picker-opened"; picker: Exclude<ExercisePickerState, null> }
  | { type: "picker-closed" }
  | { type: "validation-failed"; errors: Record<string, string> }
  | { type: "confirmation-requested" }
  | { type: "confirmation-canceled" }
  | { type: "save-started" }
  | { type: "save-succeeded"; result: SaveWorkoutResult }
  | { type: "save-failed"; error: string };

export function createWorkoutEditorState(options: { template?: WorkoutTemplate; initialClientId?: string; availableClientIds: readonly string[] }): WorkoutEditorState {
  return {
    draft: options.template ? draftFromTemplate(options.template) : emptyWorkoutDraft(),
    selectedClients: options.initialClientId && options.availableClientIds.includes(options.initialClientId) ? [options.initialClientId] : [],
    reusable: true, picker: null, errors: {}, workflow: { status: "editing" },
  };
}

export function workoutEditorReducer(state: WorkoutEditorState, action: WorkoutEditorAction): WorkoutEditorState {
  if (action.type === "save-succeeded") return state.workflow.status === "saving" ? { ...state, workflow: { status: "saved", result: action.result } } : state;
  if (action.type === "save-failed") return state.workflow.status === "saving" ? { ...state, workflow: { status: "error", message: action.error } } : state;
  if (state.workflow.status === "saving" || state.workflow.status === "saved") return state;
  if (action.type === "confirmation-canceled") return { ...state, workflow: { status: "editing" } };
  if (state.workflow.status === "confirming" && action.type !== "save-started") return state;
  const edited = { ...state, workflow: { status: "editing" } as const };
  switch (action.type) {
    case "field-changed": {
      const errors = { ...state.errors }; delete errors[action.field];
      return { ...edited, errors, draft: { ...state.draft, [action.field]: action.value } };
    }
    case "exercise-changed": return { ...edited, draft: { ...state.draft,
      exercises: state.draft.exercises.map((exercise) => exercise.id === action.id ? { ...exercise, ...action.update } : exercise) } };
    case "exercise-added": return { ...edited, picker: null, errors: {}, draft: { ...state.draft, exercises: [...state.draft.exercises, action.exercise] } };
    case "exercise-removed": return { ...edited, draft: { ...state.draft, exercises: state.draft.exercises.filter((exercise) => exercise.id !== action.id) } };
    case "clients-selected": return { ...edited, selectedClients: [...new Set(action.ids)] };
    case "reusable-toggled": return { ...edited, reusable: !state.reusable };
    case "picker-opened": return { ...state, picker: action.picker };
    case "picker-closed": return { ...state, picker: null };
    case "validation-failed": return { ...state, errors: action.errors, workflow: { status: "error", message: "Check the highlighted workout fields." } };
    case "save-started": return { ...state, errors: {}, workflow: { status: "saving" } };
    case "confirmation-requested": return { ...state, errors: {}, workflow: { status: "confirming" } };
  }
}
