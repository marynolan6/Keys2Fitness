export type PerformedSet = {
  id: string;
  actualReps: string;
  actualWeightLb: string;
  completed?: boolean; // Optional when restoring checkpoints created before per-set completion.
};

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: string;
  completed: boolean;
  instructions?: string;
  demonstrationAvailable?: boolean;
  coachNotes?: string;
  // Client entries are separate from the coach's read-only sets/reps/weight.
  actualSets?: PerformedSet[];
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
