import { getClientWorkoutHistory, type WorkoutHistoryFilter, type WorkoutHistoryKey } from "./workoutHistory";
import type { WorkoutHistoryEntry } from "./workoutSessionModel";

type HistoryView = { type: "list" } | { type: "detail"; key: WorkoutHistoryKey };
type HistoryScope = {
  clientId: string | null;
  requestId: number;
  retry: number;
  filter: WorkoutHistoryFilter;
  expanded: boolean;
  view: HistoryView;
};
export type WorkoutHistoryState = HistoryScope & (
  | { status: "idle" | "loading" | "error"; entries: [] }
  | { status: "ready"; entries: WorkoutHistoryEntry[] }
);
export const initialWorkoutHistoryState: WorkoutHistoryState = {
  clientId: null, requestId: 0, retry: 0, status: "idle", entries: [],
  filter: "completed", expanded: false, view: { type: "list" },
};
type Action =
  | { type: "clear" | "leave" }
  | { type: "load-started"; clientId: string; requestId: number }
  | { type: "loaded"; clientId: string; requestId: number; entries: WorkoutHistoryEntry[] }
  | { type: "failed"; clientId: string; requestId: number }
  | { type: "retry" }
  | { type: "filter"; filter: WorkoutHistoryFilter }
  | { type: "toggle-expanded" }
  | { type: "select"; key: WorkoutHistoryKey }
  | { type: "back" };

export function workoutHistoryReducer(state: WorkoutHistoryState, action: Action): WorkoutHistoryState {
  switch (action.type) {
    case "clear":
      return { ...initialWorkoutHistoryState, requestId: state.requestId };
    case "leave":
      // A hidden route must not later reopen its old modal. In-flight results
      // are invalid even if they arrive before the effect's cleanup completes.
      return state.status === "loading"
        ? { ...state, status: "idle", entries: [], view: { type: "list" } }
        : { ...state, view: { type: "list" } };
    case "load-started":
      if (action.requestId <= state.requestId) return state;
      return { ...(state.clientId === action.clientId ? state : initialWorkoutHistoryState),
        clientId: action.clientId, requestId: action.requestId, retry: state.retry, status: "loading", entries: [] };
    case "loaded":
    case "failed":
      if (state.status !== "loading" || action.clientId !== state.clientId || action.requestId !== state.requestId) return state;
      return action.type === "loaded"
        ? { ...state, status: "ready", entries: getClientWorkoutHistory(action.entries, action.clientId) }
        : { ...state, status: "error", entries: [] };
    case "retry":
      // Invalidate the failed request immediately, before the next effect starts.
      return state.status === "error" ? { ...state, status: "idle", entries: [], retry: state.retry + 1 } : state;
    case "filter":
      return state.status === "ready" ? { ...state, filter: action.filter, expanded: false, view: { type: "list" } } : state;
    case "toggle-expanded":
      return state.status === "ready" ? { ...state, expanded: !state.expanded } : state;
    case "select":
      // Store identity, not a cached object. Missing records get an explicit view.
      return state.status === "ready" ? { ...state, view: { type: "detail", key: { ...action.key } } } : state;
    case "back":
      return { ...state, view: { type: "list" } };
  }
}
