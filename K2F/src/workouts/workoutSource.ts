import { getWorkoutById as getMockWorkoutById, mockAssignedWorkout } from "./mockWorkout";
import { workoutLibrary } from "./workoutLibraryStore";
import { canPreviewWorkout, clientHomeWorkoutRows, resolveClientWorkout, resolveWorkoutById } from "./workoutAssignmentLookup";
import type { WorkoutLibraryData } from "./workoutLibraryModel";

export function getWorkoutById(id: string) {
  return resolveWorkoutById(workoutLibrary.getState().data, id, getMockWorkoutById);
}

export function getClientAssignedWorkout(clientId: string) {
  return resolveClientWorkout(workoutLibrary.getState().data, clientId, mockAssignedWorkout);
}

export function getClientHomeWorkouts(data: WorkoutLibraryData, activeId?: string) {
  return clientHomeWorkoutRows(data, activeId, mockAssignedWorkout, getMockWorkoutById);
}

export function workoutBelongsToClient(id: string, clientId: string): boolean {
  return canPreviewWorkout(workoutLibrary.getState().data, id, clientId, getMockWorkoutById);
}
