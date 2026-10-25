export type WorkoutExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: string;
  completed: boolean;
};

export type AssignedWorkout = {
  id: string;
  title: string;
  status: "current" | "upcoming";
  scheduleLabel?: string;
  durationMinutes?: number;
  notes?: string;
  exercises: WorkoutExercise[];
};
