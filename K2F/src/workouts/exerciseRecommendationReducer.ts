import type { ExerciseRecommendationDetails } from "./workoutLibraryService";

type Content = { details: ExerciseRecommendationDetails; draft: string; error: string };
export type ExerciseRecommendationState =
  | { status: "loading" }
  | { status: "load-error"; error: string }
  | (Content & { status: "editing" | "saving" })
  | { status: "saved" };
type Action =
  | { type: "loaded"; details: ExerciseRecommendationDetails }
  | { type: "load-failed"; error: string }
  | { type: "retry" }
  | { type: "changed"; value: string }
  | { type: "saving" }
  | { type: "failed"; error: string }
  | { type: "saved" };

export function exerciseRecommendationReducer(state: ExerciseRecommendationState, action: Action): ExerciseRecommendationState {
  switch (action.type) {
    case "retry": return state.status === "load-error" ? { status: "loading" } : state;
    case "loaded": return state.status === "loading" ? { status: "editing", details: action.details, draft: action.details.recommendation, error: "" } : state;
    case "load-failed": return state.status === "loading" ? { status: "load-error", error: action.error } : state;
    case "changed": return state.status === "editing" ? { ...state, draft: action.value, error: "" } : state;
    case "saving": return state.status === "editing" ? { ...state, status: "saving", error: "" } : state;
    case "failed": return state.status === "saving" ? { ...state, status: "editing", error: action.error } : state;
    case "saved": return state.status === "saving" ? { status: "saved" } : state;
  }
}
