import type { PerformedSet, WorkoutExercise } from "./workout";

export type PerformanceField = "actualReps" | "actualWeightLb";

export function isValidPerformanceValue(field: PerformanceField, value: string): boolean {
  if (value === "") return true; // Empty means not recorded; zero is a real entry.
  const pattern = field === "actualReps" ? /^\d+$/ : /^\d+(?:\.\d*)?$/;
  const numeric = Number(value);
  return pattern.test(value) && Number.isFinite(numeric) && numeric <= Number.MAX_SAFE_INTEGER;
}

export function isValidPerformedSets(value: unknown): value is PerformedSet[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((row: unknown) => {
    if (!row || typeof row !== "object") return false;
    const set = row as Record<string, unknown>;
    if (typeof set.id !== "string" || !set.id || ids.has(set.id) ||
        typeof set.actualReps !== "string" || typeof set.actualWeightLb !== "string" ||
        !isValidPerformanceValue("actualReps", set.actualReps) ||
        !isValidPerformanceValue("actualWeightLb", set.actualWeightLb) ||
        (set.completed !== undefined && typeof set.completed !== "boolean")) return false;
    ids.add(set.id);
    return true;
  });
}

export function initializeSetPerformance(exercise: WorkoutExercise): WorkoutExercise {
  if (exercise.actualSets !== undefined && exercise.actualSets.every((set) => set.completed !== undefined)) {
    const complete = exercise.actualSets.length > 0 && exercise.actualSets.every((set) => set.completed);
    return exercise.completed === complete ? exercise : withSets(exercise, exercise.actualSets);
  }
  const rows: PerformedSet[] = exercise.actualSets ?? Array.from({ length: exercise.sets }, (_, index) => ({
    id: `${exercise.id}-set-${index + 1}`, actualReps: "", actualWeightLb: "",
  }));
  // Legacy completion flags identify completed rows, not how many reps or pounds were logged.
  return withSets(exercise, rows.map((set) => ({ ...set, completed: set.completed ?? exercise.completed })));
}

export function prescribedSetDefaults(exercise: WorkoutExercise): Pick<PerformedSet, "actualReps" | "actualWeightLb"> {
  const weight = exercise.weight?.trim() ?? "";
  const reps = String(exercise.reps);
  const lb = weight.match(/^(\d+(?:\.\d+)?)\s*(?:lbs?)?$/i)?.[1] ?? (/^(?:body\s?weight|bw|no weight)$/i.test(weight) ? "0" : "");
  return {
    actualReps: isValidPerformanceValue("actualReps", reps) ? reps : "",
    actualWeightLb: isValidPerformanceValue("actualWeightLb", lb) ? lb : "",
  };
}

function withSets(exercise: WorkoutExercise, actualSets: PerformedSet[]): WorkoutExercise {
  return { ...exercise, actualSets, completed: actualSets.length > 0 && actualSets.every((set) => set.completed === true) };
}

// Only an explicit confirmation accepts hints. Loading, editing and archiving never fill a blank.
function setConfirmation(row: PerformedSet, completed: boolean, targets: ReturnType<typeof prescribedSetDefaults>): PerformedSet {
  if (row.completed === completed) return row;
  return completed ? { ...row, completed, actualReps: row.actualReps || targets.actualReps,
    actualWeightLb: row.actualWeightLb || targets.actualWeightLb } : { ...row, completed };
}

export function togglePerformedSet(exercise: WorkoutExercise, setId: string): WorkoutExercise {
  const current = initializeSetPerformance(exercise);
  if (!current.actualSets!.some((set) => set.id === setId)) return exercise;
  const targets = prescribedSetDefaults(current);
  return withSets(current, current.actualSets!.map((set) => set.id === setId ? setConfirmation(set, !set.completed, targets) : set));
}

export function toggleExercisePerformance(exercise: WorkoutExercise): WorkoutExercise {
  const current = initializeSetPerformance(exercise);
  const completed = !current.completed;
  const targets = prescribedSetDefaults(current);
  return withSets(current, current.actualSets!.map((set) => setConfirmation(set, completed, targets)));
}

export function updateSetPerformance(
  exercise: WorkoutExercise, setId: string, field: PerformanceField, value: string,
): WorkoutExercise {
  if (!isValidPerformanceValue(field, value)) return exercise;
  const initialized = initializeSetPerformance(exercise);
  const row = initialized.actualSets!.find((set) => set.id === setId);
  if (!row || row[field] === value) return exercise;
  return withSets(initialized, initialized.actualSets!.map((set) => set.id === setId && set[field] !== value
    ? { ...set, [field]: value, completed: false } : set));
}

export function addPerformedSet(exercise: WorkoutExercise, id: string): WorkoutExercise {
  const initialized = initializeSetPerformance(exercise);
  if (initialized.actualSets!.some((set) => set.id === id)) return initialized;
  return withSets(initialized, [...initialized.actualSets!, { id, actualReps: "", actualWeightLb: "", completed: false }]);
}

export function removeLastPerformedSet(exercise: WorkoutExercise): WorkoutExercise {
  const initialized = initializeSetPerformance(exercise);
  return withSets(initialized, initialized.actualSets!.slice(0, -1));
}

export function resetSetPerformance(exercise: WorkoutExercise): WorkoutExercise {
  return initializeSetPerformance({ ...exercise, completed: false, actualSets: undefined });
}
