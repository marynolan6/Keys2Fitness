export type WorkoutPreviewState =
  | { status: "closed" | "choosing" }
  | { status: "saving"; clientId: string }
  | { status: "error"; message: string };
type Action =
  | { type: "open" | "close" | "reset" }
  | { type: "choose"; clientId: string }
  | { type: "saved"; clientId: string }
  | { type: "failed"; clientId: string };

export function workoutPreviewReducer(state: WorkoutPreviewState, action: Action): WorkoutPreviewState {
  switch (action.type) {
    case "reset": return { status: "closed" };
    case "open": return state.status === "closed" ? { status: "choosing" } : state;
    case "close": return state.status === "saving" ? state : { status: "closed" };
    case "choose": return state.status === "choosing" || state.status === "error"
      ? { status: "saving", clientId: action.clientId } : state;
    case "saved": return state.status === "saving" && state.clientId === action.clientId ? { status: "closed" } : state;
    case "failed": return state.status === "saving" && state.clientId === action.clientId
      ? { status: "error", message: "The demo client could not be changed. Try again." } : state;
  }
}
