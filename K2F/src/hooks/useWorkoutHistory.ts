import { useIsFocused } from "expo-router";
import { useEffect, useReducer, useRef } from "react";
import { findWorkoutHistoryEntry, getClientWorkoutHistory } from "@/workouts/workoutHistory";
import { initialWorkoutHistoryState, workoutHistoryReducer } from "@/workouts/workoutHistoryReducer";
import { workoutSessionService } from "@/workouts/workoutSession";

export function useWorkoutHistory(clientId: string | null) {
  const focused = useIsFocused();
  const request = useRef(0);
  const [state, dispatch] = useReducer(workoutHistoryReducer, initialWorkoutHistoryState);
  useEffect(() => {
    if (!focused) dispatch({ type: "leave" });
  }, [focused]);
  useEffect(() => {
    if (clientId === null) {
      dispatch({ type: "clear" });
      return;
    }
    if (!focused) return;
    let active = true;
    const requestId = ++request.current;
    dispatch({ type: "load-started", clientId, requestId });
    workoutSessionService.listHistory(clientId).then((entries) => {
      if (active) dispatch({ type: "loaded", clientId, requestId, entries });
    }).catch(() => {
      if (active) dispatch({ type: "failed", clientId, requestId });
    });
    return () => { active = false; };
  }, [focused, clientId, state.retry]);

  // Suppress old data in the render that precedes the client-change effect.
  const matching = clientId !== null && state.clientId === clientId;
  const entries = matching && state.status === "ready" ? state.entries : [];
  const selection = matching && focused && state.view.type === "detail" ? state.view.key : null;
  return {
    status: matching ? state.status : "loading" as const,
    entries,
    visibleEntries: getClientWorkoutHistory(entries, clientId ?? "", state.filter),
    detail: selection ? findWorkoutHistoryEntry(entries, clientId!, selection) : null,
    detailOpen: selection !== null,
    filter: state.filter,
    expanded: state.expanded,
    dispatch,
    retry: () => dispatch({ type: "retry" }),
  };
}
