import { useEffect, useReducer, useRef } from "react";

import { exerciseRecommendationReducer, type ExerciseRecommendationState } from "@/workouts/exerciseRecommendationReducer";
import { workoutLibraryService } from "@/workouts/workoutLibraryStore";

export function useExerciseRecommendation(scope: { clientId: string; assignmentId: string; exerciseId: string }, onSaved: () => void) {
  const [state, dispatch] = useReducer(exerciseRecommendationReducer, { status: "loading" } as ExerciseRecommendationState);
  const pending = useRef(false);
  const lifetime = useRef({ active: true });
  const delivered = useRef(false);
  const { clientId, assignmentId, exerciseId } = scope;
  useEffect(() => {
    const current = { active: true };
    lifetime.current = current;
    return () => { current.active = false; };
  }, [clientId, assignmentId, exerciseId]);
  useEffect(() => {
    if (state.status !== "loading") return;
    let active = true;
    workoutLibraryService.openExerciseRecommendation({ clientId, assignmentId, exerciseId })
      .then((details) => { if (active) dispatch({ type: "loaded", details }); })
      .catch((error) => { if (active) dispatch({ type: "load-failed", error: error instanceof Error ? error.message : "Recommendation could not be loaded." }); });
    return () => { active = false; };
  }, [clientId, assignmentId, exerciseId, state.status]);
  useEffect(() => {
    if (state.status === "saved" && !delivered.current) { delivered.current = true; onSaved(); }
  }, [state.status, onSaved]);

  async function save() {
    if (pending.current || state.status !== "editing") return;
    pending.current = true;
    const active = lifetime.current;
    const { details, draft } = state;
    dispatch({ type: "saving" });
    try {
      await workoutLibraryService.saveExerciseRecommendation({ clientId, assignmentId, exerciseId,
        recommendation: draft, expectedRecommendation: details.exercise.recommendation });
      if (active.active) dispatch({ type: "saved" });
    } catch (error) {
      if (active.active) dispatch({ type: "failed", error: error instanceof Error ? error.message : "Recommendation could not be saved. Try again." });
    } finally { pending.current = false; }
  }
  return { state, save, change: (value: string) => dispatch({ type: "changed", value }), retry: () => dispatch({ type: "retry" }) };
}
