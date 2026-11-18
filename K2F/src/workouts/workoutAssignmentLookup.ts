import type { AssignedWorkout } from "./workout";
import type { ClientWorkoutAssignment, WorkoutLibraryData, WorkoutTemplate } from "./workoutLibraryModel";

// Some early demo copies stored the coach's note as the title. Recognize only
// an exact match on the linked template, never guess from title length or wording.
export function assignmentForDisplay({ workout, templateId }: ClientWorkoutAssignment, templates: readonly WorkoutTemplate[]): AssignedWorkout {
  if (workout.notes?.trim()) return workout;
  const source = templates.find((template) => template.id === templateId);
  if (!source?.notes.trim() || source.notes.trim() !== workout.title.trim() || source.title === workout.title) return workout;
  return { ...workout, title: source.title, notes: workout.title };
}

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

type HomeWorkoutRow = { workout: AssignedWorkout; assignedAt?: string };

// Pin Continue (or the latest assignment) in the same list. A repeated assignment
// of the same template is a different workout; identity is its ID, never its title.
export function clientHomeWorkoutRows(data: WorkoutLibraryData, activeId: string | undefined,
  defaultWorkout: AssignedWorkout | null, mockLookup: (id: string) => AssignedWorkout | undefined): HomeWorkoutRow[] {
  const clientId = data.previewClientId;
  const rows = data.assignments.filter((item) => item.clientId === clientId).map((item) => ({
    workout: assignmentForDisplay(item, data.templates), assignedAt: item.assignedAt,
  }));
  const active = rows.find((row) => row.workout.id === activeId);
  if (active) return [active, ...rows.filter((row) => row !== active)];
  if (clientId === "1") {
    // A demo session can also be active without having a coach-built assignment.
    const sample = activeId && !data.assignments.some((item) => item.id === activeId) ? mockLookup(activeId) : undefined;
    if (sample) return [{ workout: sample }, ...rows];
    if (!rows.length && defaultWorkout) return [{ workout: defaultWorkout }];
  }
  return rows;
}
