import { addPerformedSet, removeLastPerformedSet, toggleExercisePerformance, togglePerformedSet, updateSetPerformance, type PerformanceField } from "./setPerformance";
import type { WorkoutSession } from "./workoutSessionModel";

type CheckpointState = { status: "saved" } | { status: "saving"; revision: number } | { status: "error"; revision: number; message: string };
type SessionContent = {
  attempt: number;
  session: WorkoutSession;
  revision: number;
  persistedRevision: number;
  saveRetry: number;
  checkpoint: CheckpointState;
  transitionError: string;
};

export type WorkoutSessionState =
  | { status: "loading"; attempt: number }
  | { status: "load-error"; attempt: number; error: string }
  | (SessionContent & { status: "ready" })
  | (SessionContent & { status: "transitioning" });

export type WorkoutSessionAction =
  | { type: "load-started"; attempt: number }
  | { type: "loaded"; attempt: number; session: WorkoutSession }
  | { type: "load-failed"; attempt: number; error: string }
  | { type: "retry-load" }
  | { type: "toggle-exercise"; exerciseId: string }
  | { type: "toggle-set"; exerciseId: string; setId: string }
  | { type: "update-set"; exerciseId: string; setId: string; field: PerformanceField; value: string }
  | { type: "add-set"; exerciseId: string; setId: string }
  | { type: "remove-set"; exerciseId: string }
  | { type: "checkpoint-started"; revision: number }
  | { type: "checkpoint-saved"; revision: number }
  | { type: "checkpoint-failed"; revision: number; error: string }
  | { type: "retry-save" }
  | { type: "transition-started" }
  | { type: "transition-succeeded"; session: WorkoutSession }
  | { type: "transition-cancelled" }
  | { type: "transition-failed"; error: string };

export const initialWorkoutSessionState: WorkoutSessionState = { status: "loading", attempt: 0 };

export function workoutSessionReducer(state: WorkoutSessionState, action: WorkoutSessionAction): WorkoutSessionState {
  switch (action.type) {
    case "retry-load": return { status: "loading", attempt: state.attempt + 1 };
    case "load-started": return action.attempt === state.attempt ? { status: "loading", attempt: state.attempt } : state;
    case "loaded": return action.attempt === state.attempt ? {
      status: "ready", attempt: state.attempt, session: action.session, revision: 0, persistedRevision: 0,
      saveRetry: 0, checkpoint: { status: "saved" }, transitionError: "",
    } : state;
    case "load-failed": return action.attempt === state.attempt ? { status: "load-error", attempt: state.attempt, error: action.error } : state;
  }
  if (state.status === "loading" || state.status === "load-error") return state;
  switch (action.type) {
    case "transition-started": return state.status === "ready" ? { ...state, status: "transitioning", transitionError: "" } : state;
    case "transition-succeeded": return state.status === "transitioning" ? {
      ...state, status: "ready", session: action.session, revision: state.revision + 1,
      persistedRevision: state.revision + 1, checkpoint: { status: "saved" }, transitionError: "",
    } : state;
    case "transition-cancelled": return state.status === "transitioning" ? { ...state, status: "ready" } : state;
    case "transition-failed": return state.status === "transitioning" ? { ...state, status: "ready", transitionError: action.error } : state;
  }
  if (state.status !== "ready") return state;
  switch (action.type) {
    case "checkpoint-started": return action.revision === state.revision && state.revision > state.persistedRevision
      ? { ...state, checkpoint: { status: "saving", revision: action.revision } } : state;
    case "checkpoint-saved": return action.revision <= state.revision ? {
      ...state, persistedRevision: Math.max(state.persistedRevision, action.revision),
      checkpoint: action.revision === state.revision ? { status: "saved" } : state.checkpoint,
    } : state;
    case "checkpoint-failed": return action.revision === state.revision
      ? { ...state, checkpoint: { status: "error", revision: action.revision, message: action.error } } : state;
    case "retry-save": return { ...state, saveRetry: state.saveRetry + 1 };
  }
  if (!("exerciseId" in action) || state.session.timer.status !== "running") return state;
  const exercises = state.session.exercises.map((exercise) => {
    if (exercise.id !== action.exerciseId) return exercise;
    switch (action.type) {
      case "toggle-exercise": return toggleExercisePerformance(exercise);
      case "toggle-set": return togglePerformedSet(exercise, action.setId);
      case "update-set": return updateSetPerformance(exercise, action.setId, action.field, action.value);
      case "add-set": return addPerformedSet(exercise, action.setId);
      case "remove-set": return removeLastPerformedSet(exercise);
    }
  });
  if (exercises.every((exercise, index) => exercise === state.session.exercises[index])) return state;
  return { ...state, session: { ...state.session, exercises }, revision: state.revision + 1 };
}
