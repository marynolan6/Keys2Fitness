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
    {
      id: "bench-press",
      name: "Bench Press",
      sets: 3,
      reps: 8,
      weight: "135 lb",
      completed: true,
      instructions: "Keep your feet planted, lower the bar with control, and press evenly from both sides.",
      demonstrationAvailable: true,
      coachNotes: "Focus on a steady lowering phase and keep your wrists stacked over your elbows.",
    },
    {
      id: "incline-bench-press",
      name: "Incline Dumbbell Press",
      sets: 3,
      reps: 10,
      weight: "40 lb",
      completed: true,
      instructions: "Set the bench to a low incline, brace your core, and press the dumbbells up without locking out abruptly.",
      demonstrationAvailable: true,
    },
    {
      id: "seated-cable-row",
      name: "Seated Cable Row",
      sets: 3,
      reps: 10,
      weight: "100 lb",
      completed: false,
      instructions: "Sit tall, keep your shoulders relaxed, and pull the handle toward your ribs while squeezing your back.",
      demonstrationAvailable: true,
      coachNotes: "Avoid leaning backward as you pull; keep the movement controlled in both directions.",
    },
    {
      id: "hammer-curl",
      name: "Hammer Curl",
      sets: 3,
      reps: 10,
      weight: "25 lb",
      completed: false,
      instructions: "Keep your palms facing inward, pin your elbows by your sides, and curl without swinging your arms.",
      demonstrationAvailable: true,
    },
  ],
};

export function getWorkoutById(id: string): AssignedWorkout | undefined {
  return mockAssignedWorkout?.id === id ? mockAssignedWorkout : undefined;
}
