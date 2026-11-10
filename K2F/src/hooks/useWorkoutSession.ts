import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { AssignedWorkout } from "@/workouts/workout";
import type { PerformanceField } from "@/workouts/setPerformance";
import { makeWorkoutId } from "@/workouts/exerciseCatalog";
import { workoutSessionService } from "@/workouts/workoutSession";
import { initialWorkoutSessionState, workoutSessionReducer } from "@/workouts/workoutSessionReducer";
import { createNewWorkoutSession, type WorkoutSessionService, type WorkoutTimerAction } from "@/workouts/workoutSessionService";

export function useWorkoutSession(workout: AssignedWorkout, resumeRequest?: string, dependencies: {
  service?: WorkoutSessionService; now?: () => number; makeId?: (prefix: string) => string;
} = {}) {
  const service = dependencies.service ?? workoutSessionService;
  const clock = dependencies.now ?? Date.now;
  const makeId = dependencies.makeId ?? makeWorkoutId;
  const [state, dispatch] = useReducer(workoutSessionReducer, initialWorkoutSessionState);
  const [now, setNow] = useState(clock);
  const operationScope = useRef({ active: false });
  const transitionPending = useRef(false);
  const consumedResumeRequest = useRef<string | undefined>(undefined);
  const emptySession = useMemo(() => createNewWorkoutSession(workout), [workout]);
  const content = state.status === "ready" || state.status === "transitioning" ? state : null;
  const session = content?.session ?? emptySession;
  const revision = content?.revision ?? 0;
  const persistedRevision = content?.persistedRevision ?? 0;
  const saveRetry = content?.saveRetry ?? 0;
  const attempt = state.attempt;

  useEffect(() => {
    const scope = { active: true };
    operationScope.current = scope;
    transitionPending.current = false;
    async function restore() {
      dispatch({ type: "load-started", attempt });
      try {
        const resume = Boolean(resumeRequest) && consumedResumeRequest.current !== resumeRequest;
        const restored = await service.openWorkout(workout, resume);
        if (scope.active) {
          if (resume) consumedResumeRequest.current = resumeRequest;
          dispatch({ type: "loaded", attempt, session: restored }); setNow(clock());
        }
      } catch (error) {
        if (scope.active) dispatch({ type: "load-failed", attempt,
          error: error instanceof Error ? error.message : "Your saved workout could not be opened. Please try again." });
      }
    }
    void restore();
    return () => { scope.active = false; };
  }, [workout, resumeRequest, attempt, service, clock]);

  useEffect(() => {
    if (session.timer.status !== "running") return;
    const interval = setInterval(() => setNow(clock()), 1000);
    return () => clearInterval(interval);
  }, [session.timer.status, clock]);

  useEffect(() => {
    if (state.status !== "ready" || revision <= persistedRevision || session.timer.status === "ready") return;
    let active = true;
    async function checkpoint() {
      if (transitionPending.current) return;
      dispatch({ type: "checkpoint-started", revision });
      try {
        await service.checkpoint(session);
        if (active) dispatch({ type: "checkpoint-saved", revision });
      } catch {
        if (active) dispatch({ type: "checkpoint-failed", revision,
          error: "Your latest progress could not be saved. Try again before leaving." });
      }
    }
    void checkpoint();
    return () => { active = false; };
  }, [state.status, session, revision, persistedRevision, saveRetry, service]);

  async function changeSession(action: WorkoutTimerAction): Promise<boolean> {
    if (state.status !== "ready" || transitionPending.current) return false;
    transitionPending.current = true;
    const scope = operationScope.current;
    dispatch({ type: "transition-started" });
    try {
      const next = await service.changeSession(workout, state.session, action);
      if (!scope.active) return false;
      dispatch(next === state.session ? { type: "transition-cancelled" } : { type: "transition-succeeded", session: next });
      setNow(clock());
      return next !== state.session;
    } catch (error) {
      if (scope.active) dispatch({ type: "transition-failed",
        error: error instanceof Error ? error.message : "Your workout could not be saved. Please try again." });
      return false;
    } finally {
      if (scope.active) transitionPending.current = false;
    }
  }

  return {
    state, exercises: session.exercises, timer: session.timer, now,
    isLoadingSession: state.status === "loading", sessionLoadFailed: state.status === "load-error",
    loadError: state.status === "load-error" ? state.error : "",
    isSavingSession: state.status === "transitioning",
    sessionDisabled: state.status !== "ready" || session.timer.status !== "running",
    sessionError: content?.transitionError ?? "",
    progressSaveError: content?.checkpoint.status === "error" ? content.checkpoint.message : "",
    changeSession, retryLoad: () => dispatch({ type: "retry-load" }), retrySave: () => dispatch({ type: "retry-save" }),
    toggleExercise: (exerciseId: string) => dispatch({ type: "toggle-exercise", exerciseId }),
    toggleSet: (exerciseId: string, setId: string) => dispatch({ type: "toggle-set", exerciseId, setId }),
    updateSet: (exerciseId: string, setId: string, field: PerformanceField, value: string) => dispatch({ type: "update-set", exerciseId, setId, field, value }),
    addSet: (exerciseId: string) => dispatch({ type: "add-set", exerciseId, setId: makeId("set") }),
    removeSet: (exerciseId: string) => dispatch({ type: "remove-set", exerciseId }),
  };
}
