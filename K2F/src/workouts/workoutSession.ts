import AsyncStorage from "@react-native-async-storage/async-storage";

import { createWorkoutSessionStore } from "./workoutSessionStore";
import { createWorkoutSessionService } from "./workoutSessionService";

export type { WorkoutSession } from "./workoutSessionModel";
export { getWorkoutCardLabels, isWorkoutInProgress } from "./workoutSessionModel";

// Keep the existing on-device keys, including legacy paused checkpoints.
export const workoutSessionRepository = createWorkoutSessionStore(AsyncStorage);
export const workoutSessionService = createWorkoutSessionService(workoutSessionRepository);
export const { saveWorkoutSession, loadWorkoutSession, loadActiveWorkoutSession, clearWorkoutSession } = workoutSessionRepository;
