import type { AssignedWorkout } from "./workout";
import type { WorkoutTimer } from "./workoutTimer";

// Canonical application state. Legacy `paused` flags belong to storage migrations.
export type WorkoutSession = {
  workoutId: string;
  exercises: AssignedWorkout["exercises"];
  timer: WorkoutTimer;
  updatedAt?: number;
};

export function isWorkoutInProgress(session: WorkoutSession | null): boolean {
  return session !== null && (session.timer.status === "running" || session.timer.status === "paused");
}

export function getWorkoutCardLabels(workout: AssignedWorkout, session: WorkoutSession | null) {
  const matchingSession = session?.workoutId === workout.id ? session : null;
  const continuing = isWorkoutInProgress(matchingSession);
  return {
    continuing,
    status: continuing ? "Current workout"
      : matchingSession?.timer.status === "ended" ? "Workout ended"
        : workout.status === "upcoming" ? "Upcoming workout" : "Today's workout",
    action: continuing ? "Continue workout" : "View workout",
  };
}
