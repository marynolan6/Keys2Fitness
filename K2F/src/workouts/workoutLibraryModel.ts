import type { AssignedWorkout } from "./workout";

export type TemplateExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightLb: number;
  instructions: string;
  coachNotes: string;
  alternative?: string;
};

export type WorkoutTemplate = {
  id: string;
  title: string;
  durationMinutes?: number;
  notes: string;
  exercises: TemplateExercise[];
  updatedAt: string;
};

export type DraftExercise = Omit<TemplateExercise, "sets" | "reps" | "weightLb"> & {
  sets: string; reps: string; weightLb: string;
};

export type WorkoutDraft = {
  title: string;
  durationMinutes: string;
  notes: string;
  exercises: DraftExercise[];
};

export type ClientWorkoutAssignment = {
  id: string;
  clientId: string;
  templateId: string;
  assignedAt: string;
  workout: AssignedWorkout;
};

export type WorkoutLibraryData = {
  version: 1;
  templates: WorkoutTemplate[];
  assignments: ClientWorkoutAssignment[];
  previewClientId: string;
};

export const emptyWorkoutDraft = (): WorkoutDraft => ({ title: "", durationMinutes: "", notes: "", exercises: [] });

export function draftFromTemplate(template: WorkoutTemplate): WorkoutDraft {
  return {
    title: template.title, durationMinutes: template.durationMinutes?.toString() ?? "", notes: template.notes,
    exercises: template.exercises.map((exercise) => ({ ...exercise,
      sets: String(exercise.sets), reps: String(exercise.reps), weightLb: String(exercise.weightLb) })),
  };
}

export function validateWorkoutDraft(draft: WorkoutDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = "Enter a workout name.";
  if (draft.title.length > 100) errors.title = "Use 100 characters or fewer.";
  if (draft.durationMinutes !== "" && (!/^\d+$/.test(draft.durationMinutes) || Number(draft.durationMinutes) < 1 || Number(draft.durationMinutes) > 480)) {
    errors.durationMinutes = "Use a whole number from 1 to 480 minutes, or leave blank.";
  }
  if (draft.exercises.length === 0) errors.exercises = "Add at least one exercise.";
  const ids = new Set<string>();
  for (const exercise of draft.exercises) {
    if (!exercise.id || ids.has(exercise.id)) errors.exercises = "Each exercise row needs a unique ID.";
    ids.add(exercise.id);
    if (!exercise.name.trim()) errors[exercise.id + ".name"] = "Enter an exercise name.";
    for (const [field, max] of [["sets", 50], ["reps", 200]] as const) {
      if (!/^\d+$/.test(exercise[field]) || Number(exercise[field]) < 1 || Number(exercise[field]) > max) {
        errors[exercise.id + "." + field] = `Use a whole number from 1 to ${max}.`;
      }
    }
    if (!/^\d+(?:\.\d+)?$/.test(exercise.weightLb) || Number(exercise.weightLb) > 2000) {
      errors[exercise.id + ".weightLb"] = "Use 0–2000 lb. Zero means bodyweight / no added weight.";
    }
  }
  return errors;
}

export function templateFromDraft(draft: WorkoutDraft, id: string, updatedAt: string): WorkoutTemplate {
  const errors = validateWorkoutDraft(draft);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    id, updatedAt, title: draft.title.trim(), durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : undefined,
    notes: draft.notes.trim(), exercises: draft.exercises.map((exercise) => ({
      ...exercise, name: exercise.name.trim(), sets: Number(exercise.sets), reps: Number(exercise.reps),
      weightLb: Number(exercise.weightLb), instructions: exercise.instructions.trim(), coachNotes: exercise.coachNotes.trim(),
      alternative: exercise.alternative?.trim() || undefined,
    })),
  };
}

export function assignmentFromTemplate(template: WorkoutTemplate, clientId: string, id: string, assignedAt: string, author: string): ClientWorkoutAssignment {
  return {
    id, clientId, templateId: template.id, assignedAt,
    workout: {
      id, title: template.title, status: "current", durationMinutes: template.durationMinutes,
      notes: template.notes || undefined, notesAuthor: template.notes ? author.trim() || "Coach" : undefined,
      notesUpdatedAt: template.notes ? assignedAt.slice(0, 10) : undefined,
      exercises: template.exercises.map((exercise) => ({
        id: `${id}-${exercise.id}`, name: exercise.name, sets: exercise.sets, reps: exercise.reps,
        weight: exercise.weightLb ? `${exercise.weightLb} lb` : "Bodyweight", completed: false,
        instructions: exercise.instructions || undefined, coachNotes: exercise.coachNotes || undefined,
        alternative: exercise.alternative,
      })),
    },
  };
}

export function workoutTemplateSummary(template: WorkoutTemplate): string {
  const sets = template.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  return [`${template.exercises.length} ${template.exercises.length === 1 ? "exercise" : "exercises"}`, `${sets} ${sets === 1 ? "set" : "sets"}`,
    template.durationMinutes ? `${template.durationMinutes} min` : null].filter(Boolean).join(" · ");
}

export function parseWorkoutLibrary(raw: string): WorkoutLibraryData {
  const data = JSON.parse(raw) as WorkoutLibraryData;
  const validTemplate = (template: WorkoutTemplate) => {
    if (!template || typeof template.id !== "string" || !template.id || typeof template.title !== "string" ||
        typeof template.notes !== "string" || typeof template.updatedAt !== "string" || !Number.isFinite(Date.parse(template.updatedAt)) ||
        (template.durationMinutes !== undefined && (typeof template.durationMinutes !== "number" || !Number.isInteger(template.durationMinutes))) ||
        !Array.isArray(template.exercises)) return false;
    if (!template.exercises.every((exercise) => exercise && typeof exercise.id === "string" && typeof exercise.name === "string" &&
        typeof exercise.instructions === "string" && typeof exercise.coachNotes === "string" &&
        typeof exercise.sets === "number" && typeof exercise.reps === "number" && typeof exercise.weightLb === "number" &&
        (exercise.alternative === undefined || typeof exercise.alternative === "string"))) return false;
    return Object.keys(validateWorkoutDraft(draftFromTemplate(template))).length === 0;
  };
  if (!data || data.version !== 1 || typeof data.previewClientId !== "string" || !data.previewClientId ||
      !Array.isArray(data.templates) || !data.templates.every(validTemplate) ||
      new Set(data.templates.map((template) => template.id)).size !== data.templates.length ||
      !Array.isArray(data.assignments) || !data.assignments.every((assignment) => assignment &&
        typeof assignment.id === "string" && assignment.id && typeof assignment.clientId === "string" && assignment.clientId &&
        typeof assignment.templateId === "string" && typeof assignment.assignedAt === "string" && assignment.workout &&
        assignment.workout.id === assignment.id && typeof assignment.workout.title === "string" && assignment.workout.status === "current" &&
        [assignment.workout.notes, assignment.workout.notesAuthor, assignment.workout.notesUpdatedAt].every((text) => text === undefined || typeof text === "string") &&
        Array.isArray(assignment.workout.exercises) && assignment.workout.exercises.every((exercise) => exercise &&
          typeof exercise.id === "string" && typeof exercise.name === "string" && Number.isInteger(exercise.sets) && exercise.sets > 0 &&
          Number.isInteger(exercise.reps) && exercise.reps > 0 && typeof exercise.weight === "string" && exercise.completed === false &&
          [exercise.instructions, exercise.coachNotes, exercise.alternative].every((text) => text === undefined || typeof text === "string"))) ||
      new Set(data.assignments.map((assignment) => assignment.id)).size !== data.assignments.length) {
    throw new Error("Saved workout library could not be read. Your saved data has not been replaced.");
  }
  return data;
}
