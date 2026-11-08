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
  // Session-level note from the coach for this specific workout.
  notes?: string;
  // Who wrote the note and when it was last updated ("YYYY-MM-DD"), when known.
  notesAuthor?: string;
  notesUpdatedAt?: string;
  exercises: WorkoutExercise[];
};
