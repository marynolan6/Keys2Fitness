import type { WorkoutExercise } from "./workout";

export function getWorkoutProgress(exercises: Pick<WorkoutExercise, "completed">[]) {
  const total = exercises.length;
  const completed = exercises.filter((exercise) => exercise.completed).length;
  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    isComplete: total > 0 && completed === total,
  };
}
