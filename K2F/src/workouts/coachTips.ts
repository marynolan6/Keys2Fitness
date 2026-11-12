import type { WorkoutExercise } from "./workout";
import type { WorkoutLibraryData } from "./workoutLibraryModel";

// K2F-108: Per-client coach tips for the exercise details modal
// General instructions stay on the exercise so they can be reused for every client.
// Tips are looked up by client AND exercise, so a client never sees someone else's tip.

// Demo data until coach-client linking is in Firebase
// Client IDs match src/clients/mockClients.ts (1 = Spencer, 2 = Alex, 3 = Jordan)
// Keyed by exercise name since assigned copies get new exercise IDs
const demoCoachTips: Record<string, Record<string, string>> = {
  "1": {
    "bench-press": "Focus on a steady lowering phase and keep your wrists stacked over your elbows.",
    "seated-cable-row": "Avoid leaning backward as you pull; keep the movement controlled in both directions.",
  },
  // Same bench press as Spencer, different tip
  "2": {
    "bench-press": "Start lighter than last week and pause the bar on your chest for one second to build control.",
  },
  // Jordan has no tips yet, to check the no-tip state
  "3": {},
};

// "Bench Press" -> "bench-press"
export function exerciseKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function getDemoCoachTip(clientId: string, exerciseName: string): string | null {
  return demoCoachTips[clientId]?.[exerciseKey(exerciseName)] ?? null;
}

// A note the coach typed in the workout editor wins, but only if the exercise is in
// one of this client's own assignments. Otherwise use the demo tip. No other fallback.
export function getCoachTip(
  data: Pick<WorkoutLibraryData, "assignments">,
  clientId: string,
  exercise: Pick<WorkoutExercise, "id" | "name">,
): string | null {
  const assigned = data.assignments
    .filter((assignment) => assignment.clientId === clientId)
    .flatMap((assignment) => assignment.workout.exercises)
    .find((item) => item.id === exercise.id);
  if (assigned?.recommendation !== undefined) return assigned.recommendation.trim() || null;
  const coachNote = assigned?.coachNotes?.trim();
  if (coachNote) return coachNote;
  return getDemoCoachTip(clientId, exercise.name);
}
