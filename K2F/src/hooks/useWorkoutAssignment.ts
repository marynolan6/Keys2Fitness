import { useReducer, useRef } from "react";

import { workoutAssignmentReducer, type AssignmentReview, type WorkoutAssignmentState } from "@/workouts/workoutAssignmentReducer";
import { workoutLibraryService } from "@/workouts/workoutLibraryStore";

export function useWorkoutAssignment() {
  const [state, dispatch] = useReducer(workoutAssignmentReducer, { status: "idle" } as WorkoutAssignmentState);
  const pending = useRef(false);

  async function confirm() {
    if (pending.current || state.status !== "review") return;
    pending.current = true;
    dispatch({ type: "confirm" });
    try {
      const assignments = await workoutLibraryService.assignTemplate({ templateId: state.review.template.id,
        expectedTemplateUpdatedAt: state.review.template.updatedAt, clientIds: state.review.clients.map((client) => client.id) });
      dispatch({ type: "saved", assignments });
    } catch (cause) {
      dispatch({ type: "failed", error: cause instanceof Error ? cause.message : "Assignment could not be saved. Try again." });
    } finally { pending.current = false; }
  }

  return { state, confirm, review: (review: AssignmentReview) => dispatch({ type: "review", review }),
    cancel: () => dispatch({ type: "cancel" }) };
}
