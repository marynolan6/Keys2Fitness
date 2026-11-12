import type { AssignedWorkout } from "./workout";
import type { WorkoutTimer } from "./workoutTimer";

// Canonical application state. Legacy `paused` flags belong to storage migrations.
export type WorkoutSession = {
  workoutId: string;
  exercises: AssignedWorkout["exercises"];
  timer: WorkoutTimer;
  updatedAt?: number;
  sessionId?: string;
  startedAt?: number;
  finishedAt?: number;
  outcome?: "completed" | "ended-early";
};

export type WorkoutHistoryEntry = {
  id: string;
  clientId: string;
  title: string;
  session: WorkoutSession & { sessionId: string; finishedAt: number; outcome: "completed" | "ended-early" };
};

export function workoutHistoryTotals(entries: readonly WorkoutHistoryEntry[]) {
  const completed = entries.filter((entry) => entry.session.outcome === "completed");
  return { completed: completed.length, endedEarly: entries.length - completed.length,
    activeMs: completed.reduce((total, entry) => total + entry.session.timer.elapsedMs, 0) };
}

export function isWorkoutInProgress(session: WorkoutSession | null): boolean {
  return session !== null && (session.timer.status === "running" || session.timer.status === "paused");
}

export function getWorkoutCardLabels(workout: AssignedWorkout, session: WorkoutSession | null) {
  const matchingSession = session?.workoutId === workout.id ? session : null;
  const continuing = isWorkoutInProgress(matchingSession);
  return {
    continuing,
    status: continuing ? "Current workout"
      : matchingSession?.outcome === "completed" ? "Workout completed"
      : matchingSession?.timer.status === "ended" ? "Workout ended"
        : workout.status === "upcoming" ? "Upcoming workout" : "Today's workout",
    action: continuing ? "Continue workout" : "View workout",
  };
}
