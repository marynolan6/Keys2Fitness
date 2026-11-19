import type { WorkoutExercise } from "./workout";

export function getWorkoutProgress(exercises: readonly Pick<WorkoutExercise, "completed" | "actualSets">[]) {
  const total = exercises.length;
  // When rows exist they are the completion source of truth. A stale aggregate
  // flag must not display 100% while a set is still unchecked (or none remain).
  const completed = exercises.filter((exercise) => exercise.actualSets === undefined ? exercise.completed
    : exercise.actualSets.length > 0 && exercise.actualSets.every((set) => set.completed ?? exercise.completed)).length;
  const isComplete = total > 0 && completed === total;
  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : isComplete ? 100 : Math.min(99, Math.round((completed / total) * 100)),
    isComplete,
  };
}
