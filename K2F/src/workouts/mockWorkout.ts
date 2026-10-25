import type { AssignedWorkout } from "./workout";

// Shared prototype assignment until client assignments are supplied by the backend.
export const mockAssignedWorkout: AssignedWorkout | null = {
  id: "today",
  title: "Upper Body Strength",
  status: "current",
  scheduleLabel: "Week 5, Day 3",
  durationMinutes: 45,
  notes: "Focus on controlled movement and rest for 90 seconds between sets.",
  exercises: [
    { id: "bench-press", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: true },
    { id: "incline-bench-press", name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: "40 lb", completed: true },
    { id: "seated-cable-row", name: "Seated Cable Row", sets: 3, reps: 10, weight: "100 lb", completed: false },
    { id: "hammer-curl", name: "Hammer Curl", sets: 3, reps: 10, weight: "25 lb", completed: false },
  ],
};

export function getWorkoutById(id: string): AssignedWorkout | undefined {
  return mockAssignedWorkout?.id === id ? mockAssignedWorkout : undefined;
}
