import type { AssignedWorkout } from "./workout";

export type WorkoutCoachNote = {
  workoutId: string;
  text: string;
  author?: string;
  // e.g. "Nov 6"
  updatedLabel?: string;
};

// Values that mean "no note" but would otherwise render as if the coach wrote something.
const PLACEHOLDER_NOTES = new Set(["null", "undefined", "none", "n/a", "na", "-", "--", "—", "tbd"]);

// Trims the note, collapses runs of blank lines, and returns `undefined` when nothing real is left.
export function cleanNoteText(raw: string | null | undefined): string | undefined {
  const text = raw
    ?.replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text || PLACEHOLDER_NOTES.has(text.toLowerCase())) return undefined;
  return text;
}

// The coach's session note for this workout, or `null` when none is attached
// (missing, blank, or a placeholder like "N/A"). Callers render nothing in that case.
export function getWorkoutCoachNote(workout: AssignedWorkout): WorkoutCoachNote | null {
  const text = cleanNoteText(workout.notes);
  if (!text) return null;

  return {
    workoutId: workout.id,
    text,
    author: workout.notesAuthor?.trim() || undefined,
    updatedLabel: workout.notesUpdatedAt ? formatNoteDate(workout.notesUpdatedAt) : undefined,
  };
}

// "2026-11-06" -> "Nov 6". Parsed as a local date so it doesn't shift a day in US time zones.
function formatNoteDate(date: string): string | undefined {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
