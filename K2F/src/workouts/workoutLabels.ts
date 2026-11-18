import type { WorkoutExercise } from "./workout";

export function countLabel(count: number | string, unit: "exercise" | "set" | "rep" | "second" | "recorded set") {
  return `${count} ${unit}${Number(count) === 1 ? "" : "s"}`;
}

export function prescriptionLabel(exercise: Pick<WorkoutExercise, "sets" | "reps" | "weight">) {
  return `${countLabel(exercise.sets, "set")} × ${countLabel(exercise.reps, "rep")} · ${exercise.weight?.trim() || "No weight prescribed"}`;
}
