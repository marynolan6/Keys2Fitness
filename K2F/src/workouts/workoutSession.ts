import AsyncStorage from "@react-native-async-storage/async-storage";

import { createWorkoutSessionStore } from "./workoutSessionStore";

export type { WorkoutSession } from "./workoutSessionStore";
export { getWorkoutCardLabels, isWorkoutInProgress } from "./workoutSessionStore";

// Keep the existing on-device keys, including legacy paused checkpoints.
export const { saveWorkoutSession, loadWorkoutSession, loadActiveWorkoutSession, clearWorkoutSession } =
  createWorkoutSessionStore(AsyncStorage);
