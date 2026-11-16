import { useIsFocused } from "expo-router";
import { useEffect, useReducer, useRef } from "react";
import { workoutLibrary } from "@/workouts/workoutLibraryStore";
import { workoutPreviewReducer } from "@/workouts/workoutPreviewReducer";

export function useWorkoutPreview() {
  const focused = useIsFocused();
  const [state, dispatch] = useReducer(workoutPreviewReducer, { status: "closed" });
  const scope = useRef({ active: false, pending: false });
  useEffect(() => {
    const current = { active: focused, pending: false };
    scope.current = current;
    dispatch({ type: "reset" });
    return () => { current.active = false; };
  }, [focused]);

  async function choose(clientId: string) {
    const current = scope.current;
    if (!current.active || current.pending || (state.status !== "choosing" && state.status !== "error")) return;
    current.pending = true;
    dispatch({ type: "choose", clientId });
    try {
      await workoutLibrary.setPreviewClient(clientId);
      if (current.active) dispatch({ type: "saved", clientId });
    } catch {
      if (current.active) dispatch({ type: "failed", clientId });
    } finally { current.pending = false; }
  }
  return { state, dispatch, choose, visible: focused && state.status !== "closed", busy: state.status === "saving" };
}
