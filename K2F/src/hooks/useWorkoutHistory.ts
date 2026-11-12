import { useIsFocused } from "expo-router";
import { useEffect, useReducer } from "react";
import { workoutSessionService } from "@/workouts/workoutSession";
import type { WorkoutHistoryEntry } from "@/workouts/workoutSessionModel";

type State = { clientId: string; status: "loading" | "ready" | "error"; entries: WorkoutHistoryEntry[]; retry: number };
type Action = { type: "loading"; clientId: string } | { type: "loaded"; clientId: string; entries: WorkoutHistoryEntry[] }
  | { type: "failed"; clientId: string } | { type: "retry" };
function reducer(state: State, action: Action): State {
  if (action.type === "retry") return { ...state, retry: state.retry + 1 };
  if (action.type === "loaded") return { ...state, clientId: action.clientId, status: "ready", entries: action.entries };
  return { ...state, clientId: action.clientId, status: action.type === "loading" ? "loading" : "error", entries: [] };
}

export function useWorkoutHistory(clientId: string) {
  const focused = useIsFocused();
  const [state, dispatch] = useReducer(reducer, { clientId, status: "loading", entries: [], retry: 0 });
  useEffect(() => {
    if (!focused) return;
    let active = true;
    async function load() {
      dispatch({ type: "loading", clientId });
      try {
        const entries = await workoutSessionService.listHistory(clientId);
        if (active) dispatch({ type: "loaded", clientId, entries });
      } catch { if (active) dispatch({ type: "failed", clientId }); }
    }
    void load();
    return () => { active = false; };
  }, [focused, clientId, state.retry]);
  return { status: state.clientId === clientId ? state.status : "loading" as const,
    entries: state.clientId === clientId ? state.entries : [], retry: () => dispatch({ type: "retry" }) };
}
