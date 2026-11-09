import type { AssignedWorkout } from "./workout";
import type { WorkoutLibraryData } from "./workoutLibraryModel";

export function resolveWorkoutById(data: WorkoutLibraryData, id: string, mockLookup: (id: string) => AssignedWorkout | undefined) {
  return data.assignments.find((assignment) => assignment.id === id)?.workout ?? mockLookup(id);
}

export function resolveClientWorkout(data: WorkoutLibraryData, clientId: string, defaultWorkout: AssignedWorkout | null) {
  return data.assignments.find((assignment) => assignment.clientId === clientId)?.workout
    ?? (clientId === "1" ? defaultWorkout : null);
}

export function canPreviewWorkout(data: WorkoutLibraryData, id: string, clientId: string,
  mockLookup: (id: string) => AssignedWorkout | undefined): boolean {
  const assignment = data.assignments.find((item) => item.id === id);
  return assignment ? assignment.clientId === clientId : clientId === "1" && Boolean(mockLookup(id));
}
