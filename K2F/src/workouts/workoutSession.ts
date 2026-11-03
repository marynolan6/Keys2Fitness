// K2F-43: Save and load paused workout sessions for the client app.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AssignedWorkout } from "./workout";

// K2F-43: Defines the saved information for one workout.
// We save the entire exercise array to preserve completion
// status, prescribed values, and any recorded performance.
export type WorkoutSession = {
  workoutId: string;
  exercises: AssignedWorkout["exercises"];
  paused: boolean;
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
// Returns null when no paused session exists.
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
    session.paused !== true ||
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

  return session as WorkoutSession;
}

// Clears the paused session once the client resumes.
// This avoids reopening an old paused session after resume.
export async function clearWorkoutSession(
  workoutId: string
): Promise<void> {
  await AsyncStorage.removeItem(getStorageKey(workoutId));
}