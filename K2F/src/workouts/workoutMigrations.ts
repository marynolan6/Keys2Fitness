import { isValidPerformedSets } from "./setPerformance";
import { draftFromTemplate, validateWorkoutDraft } from "./workoutLibraryModel";
import type { WorkoutLibraryData, WorkoutTemplate } from "./workoutLibraryModel";
import type { WorkoutSession } from "./workoutSessionModel";
import type { WorkoutExercise } from "./workout";

export const workoutSchemaVersion = 2;
type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue => value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const optionalText = (value: unknown) => value === undefined || typeof value === "string";
const integer = (value: unknown, min: number) => typeof value === "number" && Number.isInteger(value) && value >= min;

function invalid(kind: string): never {
  throw new Error(`Saved ${kind} could not be read. Your saved data has not been replaced.`);
}

function validateTemplate(value: unknown): value is WorkoutTemplate {
  if (!isRecord(value) || !nonempty(value.id) || typeof value.title !== "string" || typeof value.notes !== "string" ||
      typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt)) ||
      (value.durationMinutes !== undefined && !integer(value.durationMinutes, 1)) || !Array.isArray(value.exercises)) return false;
  if (!value.exercises.every((exercise) => isRecord(exercise) && nonempty(exercise.id) && typeof exercise.name === "string" &&
      typeof exercise.instructions === "string" && typeof exercise.coachNotes === "string" &&
      integer(exercise.sets, 1) && integer(exercise.reps, 1) && typeof exercise.weightLb === "number" && optionalText(exercise.alternative))) return false;
  // Structural checks precede conversion into the domain validation function.
  return Object.keys(validateWorkoutDraft(draftFromTemplate(value as unknown as WorkoutTemplate))).length === 0;
}

function validateLibrary(value: unknown): WorkoutLibraryData {
  if (!isRecord(value) || !nonempty(value.previewClientId) || !Array.isArray(value.templates) || !value.templates.every(validateTemplate) ||
      new Set(value.templates.map((template) => template.id)).size !== value.templates.length || !Array.isArray(value.assignments) ||
      !value.assignments.every((assignment) => {
        if (!isRecord(assignment) || !nonempty(assignment.id) || !nonempty(assignment.clientId) || !nonempty(assignment.templateId) ||
            typeof assignment.assignedAt !== "string" || !Number.isFinite(Date.parse(assignment.assignedAt)) || !isRecord(assignment.workout)) return false;
        const workout = assignment.workout;
        return workout.id === assignment.id && nonempty(workout.title) && workout.status === "current" &&
          (workout.durationMinutes === undefined || integer(workout.durationMinutes, 1)) &&
          [workout.notes, workout.notesAuthor, workout.notesUpdatedAt].every(optionalText) &&
          Array.isArray(workout.exercises) && workout.exercises.length > 0 && workout.exercises.every((exercise) =>
            isRecord(exercise) && nonempty(exercise.id) && nonempty(exercise.name) && integer(exercise.sets, 1) && integer(exercise.reps, 1) &&
            typeof exercise.weight === "string" && exercise.completed === false &&
            [exercise.instructions, exercise.coachNotes, exercise.alternative].every(optionalText));
      }) || new Set(value.assignments.map((assignment) => assignment.id)).size !== value.assignments.length) return invalid("workout library");
  return { templates: value.templates, assignments: value.assignments, previewClientId: value.previewClientId } as WorkoutLibraryData;
}

// V1 stored the schema marker beside the domain fields. V2 uses an envelope so
// application models no longer carry storage-version metadata.
export function migrateWorkoutLibraryV1(value: unknown) {
  if (!isRecord(value) || value.version !== 1) return invalid("workout library");
  return { schemaVersion: workoutSchemaVersion, data: validateLibrary(value) };
}

export function decodeWorkoutLibrary(raw: string): { data: WorkoutLibraryData; migrated: boolean } {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) return invalid("workout library");
  if (value.schemaVersion !== undefined) {
    if (value.schemaVersion !== workoutSchemaVersion) throw new Error("This workout library uses an unsupported storage version. Your saved data has not been replaced.");
    return { data: validateLibrary(value.data), migrated: false };
  }
  return { data: migrateWorkoutLibraryV1(value).data, migrated: true };
}

export const encodeWorkoutLibrary = (data: WorkoutLibraryData) => JSON.stringify({ schemaVersion: workoutSchemaVersion, data });
export const parseWorkoutLibrary = (raw: string) => decodeWorkoutLibrary(raw).data;

export function normalizeWorkoutSession(value: unknown, workoutId: string, legacy = false): WorkoutSession {
  if (!isRecord(value) || value.workoutId !== workoutId || !Array.isArray(value.exercises) || !value.exercises.every((exercise) =>
      isRecord(exercise) && nonempty(exercise.id) && typeof exercise.name === "string" && typeof exercise.completed === "boolean" &&
      integer(exercise.sets, 0) && integer(exercise.reps, 0) && optionalText(exercise.weight) &&
      [exercise.instructions, exercise.coachNotes, exercise.alternative].every(optionalText) &&
      (exercise.actualSets === undefined || isValidPerformedSets(exercise.actualSets)))) return invalid("workout checkpoint");
  if (value.updatedAt !== undefined && (typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) || value.updatedAt < 0)) return invalid("workout checkpoint");
  const timer = value.timer ?? (legacy && value.paused === true ? { status: "paused", elapsedMs: 0, runningSince: null } : null);
  if (!isRecord(timer) || !["ready", "running", "paused", "ended"].includes(String(timer.status)) ||
      typeof timer.elapsedMs !== "number" || !Number.isFinite(timer.elapsedMs) || timer.elapsedMs < 0 ||
      (timer.status === "running" ? typeof timer.runningSince !== "number" || !Number.isFinite(timer.runningSince) : timer.runningSince !== null)) return invalid("workout checkpoint");
  return {
    workoutId, exercises: value.exercises.map((exercise) => ({ ...exercise, weight: exercise.weight ?? "" })) as WorkoutExercise[],
    timer: { status: timer.status, elapsedMs: timer.elapsedMs, runningSince: timer.runningSince } as WorkoutSession["timer"],
    ...(value.updatedAt === undefined ? {} : { updatedAt: value.updatedAt as number }),
  };
}

export function migrateWorkoutSessionV1(value: unknown, workoutId: string): WorkoutSession {
  if (!isRecord(value) || typeof value.paused !== "boolean") return invalid("workout checkpoint");
  return normalizeWorkoutSession(value, workoutId, true);
}

export function decodeWorkoutSession(raw: string, workoutId: string): { data: WorkoutSession; migrated: boolean } {
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value)) return invalid("workout checkpoint");
  if (value.schemaVersion !== undefined) {
    if (value.schemaVersion !== workoutSchemaVersion) throw new Error("This workout checkpoint uses an unsupported storage version. Your saved data has not been replaced.");
    return { data: normalizeWorkoutSession(value.data, workoutId), migrated: false };
  }
  return { data: migrateWorkoutSessionV1(value, workoutId), migrated: true };
}

export const encodeWorkoutSession = (data: WorkoutSession) => JSON.stringify({ schemaVersion: workoutSchemaVersion, data });

// Tolerant inspection is used only for scanning unrelated checkpoints.
// Opening a specific workout goes through the strict decoder and exposes errors.
export function parseWorkoutSession(raw: string | null, workoutId: string): WorkoutSession | null {
  if (!raw) return null;
  try { return decodeWorkoutSession(raw, workoutId).data; } catch { return null; }
}
