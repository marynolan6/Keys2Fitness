import { assignmentForDisplay } from "./workoutAssignmentLookup";
import type { ClientWorkoutAssignment, WorkoutLibraryData, WorkoutTemplate } from "./workoutLibraryModel";

export type WorkoutLibraryItemKind = "template" | "workout";
export const libraryItemLabels: Record<WorkoutLibraryItemKind, string> = {
  template: "Reusable template",
  workout: "Assigned workout",
};

type LibraryContents = Pick<WorkoutLibraryData, "templates" | "assignments">;

function workoutEntry(assignment: ClientWorkoutAssignment, templates: readonly WorkoutTemplate[]) {
  return { kind: "workout" as const, assignment, workout: assignmentForDisplay(assignment, templates) };
}

export type WorkoutLibraryItem = { kind: "template"; template: WorkoutTemplate } | ReturnType<typeof workoutEntry>;

export function searchWorkoutLibrary(data: LibraryContents, search: string, clientNames: ReadonlyMap<string, string>) {
  const query = search.trim().toLowerCase();
  const matches = (...fields: string[]) => !query || fields.some((field) => field.toLowerCase().includes(query));
  return {
    templates: data.templates.filter((template) => matches(template.title, ...template.exercises.map((exercise) => exercise.name))),
    // Include every assignment snapshot, even if it was built for one client or its template was deleted.
    workouts: data.assignments.map((assignment) => workoutEntry(assignment, data.templates)).filter(({ assignment, workout }) =>
      matches(workout.title, clientNames.get(assignment.clientId) ?? "", ...workout.exercises.map((exercise) => exercise.name))),
  };
}

export function findWorkoutLibraryItem(data: LibraryContents, kind: string | undefined, itemId: string | undefined): WorkoutLibraryItem | null {
  // Titles can be reused, so resolve by kind and ID even when a template and workout share a name.
  if (kind === "template") {
    const template = data.templates.find((item) => item.id === itemId);
    return template ? { kind, template } : null;
  }
  if (kind === "workout") {
    const assignment = data.assignments.find((item) => item.id === itemId);
    return assignment ? workoutEntry(assignment, data.templates) : null;
  }
  return null;
}
