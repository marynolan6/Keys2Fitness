import AsyncStorage from "@react-native-async-storage/async-storage";

import { createWorkoutSessionStore } from "./workoutSessionStore";
import { createWorkoutSessionService } from "./workoutSessionService";
import { makeWorkoutId } from "./exerciseCatalog";
import { workoutLibraryRepository } from "./workoutLibraryStore";

export type { WorkoutSession } from "./workoutSessionModel";
export { getWorkoutCardLabels, isWorkoutInProgress } from "./workoutSessionModel";

// Keep the existing on-device keys, including legacy paused checkpoints.
export const workoutSessionRepository = createWorkoutSessionStore(AsyncStorage);
export const workoutSessionService = createWorkoutSessionService(workoutSessionRepository, Date.now, {
  makeId: () => makeWorkoutId("attempt"),
  getClientId: (id) => {
    const data = workoutLibraryRepository.getState().data;
    const assignment = data.assignments.find((entry) => entry.id === id);
    if (assignment) return assignment.clientId;
    if (data.previewClientId === "1") return "1";
    throw new Error("This workout does not belong to the selected demo client.");
  },
});
export const { saveWorkoutSession, loadWorkoutSession, loadActiveWorkoutSession, clearWorkoutSession } = workoutSessionRepository;
