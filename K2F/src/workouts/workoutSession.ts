// Save and load workout checkpoints, including active-time and ended state.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AssignedWorkout } from "./workout";
import type { WorkoutTimer } from "./workoutTimer";

// K2F-43: Defines the saved information for one workout.
// We save the entire exercise array to preserve completion
// status, prescribed values, and any recorded performance.
export type WorkoutSession = {
  workoutId: string;
  exercises: AssignedWorkout["exercises"];
  paused: boolean;
  timer?: WorkoutTimer;
};

// Gives each workout its own storage key.
function getStorageKey(workoutId: string): string {
  return `keys2fitness:workout-session:${workoutId}`;
}

// K2F-185: Save the current workout progress when paused.
// JSON.stringify converts the workout data into a string.
export async function saveWorkoutSession(
  session: WorkoutSession
): Promise<void> {
  const key = getStorageKey(session.workoutId);

  await AsyncStorage.setItem(key, JSON.stringify(session));
}

// K2F-186: Read a previously saved workout session.
// Legacy paused records without a timer restore at zero elapsed time.
export async function loadWorkoutSession(
  workoutId: string
): Promise<WorkoutSession | null> {
  const saved = await AsyncStorage.getItem(
    getStorageKey(workoutId)
  );

  if (!saved) {
    return null;
  }

  // Parse the stored JSON into workout data.
  const session: unknown = JSON.parse(saved);

  // Check the stored structure before using it.
  if (
    !session ||
    typeof session !== "object" ||
    !("workoutId" in session) ||
    session.workoutId !== workoutId ||
    !("paused" in session) ||
    typeof session.paused !== "boolean" ||
    !("exercises" in session) ||
    !Array.isArray(session.exercises) ||
    !session.exercises.every(
      (exercise: unknown) =>
        exercise !== null &&
        typeof exercise === "object" &&
        "id" in exercise &&
        typeof exercise.id === "string" &&
        "completed" in exercise &&
        typeof exercise.completed === "boolean"
    )
  ) {
    return null;
  }

  const restored = session as WorkoutSession;
  if (restored.timer) {
    const timer = restored.timer;
    if (!["running", "paused", "ended"].includes(timer.status) ||
        !Number.isFinite(timer.elapsedMs) || timer.elapsedMs < 0 ||
        (timer.status === "running"
          ? typeof timer.runningSince !== "number" || !Number.isFinite(timer.runningSince)
          : timer.runningSince !== null)) return null;
  } else if (!restored.paused) {
    return null;
  }
  return restored;
}

// Clears the paused session once the client resumes.
// This avoids reopening an old paused session after resume.
export async function clearWorkoutSession(
  workoutId: string
): Promise<void> {
  await AsyncStorage.removeItem(getStorageKey(workoutId));
}
