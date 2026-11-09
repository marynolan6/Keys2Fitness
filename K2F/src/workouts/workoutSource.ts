import { getWorkoutById as getMockWorkoutById, mockAssignedWorkout } from "./mockWorkout";
import { workoutLibrary } from "./workoutLibraryStore";
import { canPreviewWorkout, resolveClientWorkout, resolveWorkoutById } from "./workoutAssignmentLookup";

export function getWorkoutById(id: string) {
  return resolveWorkoutById(workoutLibrary.getState().data, id, getMockWorkoutById);
}

export function getClientAssignedWorkout(clientId: string) {
  return resolveClientWorkout(workoutLibrary.getState().data, clientId, mockAssignedWorkout);
}

export function workoutBelongsToClient(id: string, clientId: string): boolean {
  return canPreviewWorkout(workoutLibrary.getState().data, id, clientId, getMockWorkoutById);
}
