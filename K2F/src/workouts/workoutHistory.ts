import type { PerformedSet } from "./workout";
import type { WorkoutHistoryEntry } from "./workoutSessionModel";

export type WorkoutHistoryFilter = "completed" | "all";
export type WorkoutHistoryKey = { workoutId: string; sessionId: string };

// Enforce ownership and ordering at the use-case boundary as well as in the
// local adapter. A different repository must not change the client-facing rules.
export function getClientWorkoutHistory(entries: readonly WorkoutHistoryEntry[], clientId: string,
  filter: WorkoutHistoryFilter = "all"): WorkoutHistoryEntry[] {
  if (!clientId.trim()) return [];
  return entries.filter((entry) => entry.clientId === clientId && entry.session.timer.status === "ended" &&
    (filter === "all" || entry.session.outcome === "completed"))
    .sort((a, b) => b.session.finishedAt - a.session.finishedAt ||
      a.session.workoutId.localeCompare(b.session.workoutId) || a.id.localeCompare(b.id));
}

// Attempt IDs and exercise IDs are not workout IDs. Never fall back to a live
// assignment/session, or to a similarly named record belonging to another client.
export function findWorkoutHistoryEntry(entries: readonly WorkoutHistoryEntry[], clientId: string,
  key: WorkoutHistoryKey): WorkoutHistoryEntry | null {
  return entries.find((entry) => entry.clientId === clientId && entry.session.workoutId === key.workoutId &&
    entry.id === key.sessionId && entry.session.sessionId === key.sessionId) ?? null;
}

export function recordedSetResult(set: PerformedSet) {
  const reps = set.actualReps.trim();
  const weight = set.actualWeightLb.trim();
  return {
    reps: reps === "" ? "Reps not recorded" : `${reps} reps`,
    weight: weight === "" ? "Weight not recorded" : `${weight} lb`,
    status: set.completed ? "Confirmed" : "Unconfirmed",
  };
}
