import type { ClientWorkoutAssignment, WorkoutTemplate } from "./workoutLibraryModel";

export type AssignmentReview = {
  template: WorkoutTemplate;
  clients: { id: string; name: string }[];
};
export type WorkoutAssignmentState =
  | { status: "idle" }
  | { status: "review" | "saving"; review: AssignmentReview; error: string }
  | { status: "saved"; review: AssignmentReview; assignments: ClientWorkoutAssignment[] };
export type WorkoutAssignmentAction =
  | { type: "review"; review: AssignmentReview }
  | { type: "cancel" }
  | { type: "confirm" }
  | { type: "failed"; error: string }
  | { type: "saved"; assignments: ClientWorkoutAssignment[] };

export function workoutAssignmentReducer(state: WorkoutAssignmentState, action: WorkoutAssignmentAction): WorkoutAssignmentState {
  switch (action.type) {
    case "review": return state.status === "saving" ? state : { status: "review", review: JSON.parse(JSON.stringify(action.review)), error: "" };
    case "cancel": return state.status === "review" ? { status: "idle" } : state;
    case "confirm": return state.status === "review" ? { ...state, status: "saving", error: "" } : state;
    case "failed": return state.status === "saving" ? { ...state, status: "review", error: action.error } : state;
    case "saved": return state.status === "saving" ? { status: "saved", review: state.review, assignments: action.assignments } : state;
  }
}
