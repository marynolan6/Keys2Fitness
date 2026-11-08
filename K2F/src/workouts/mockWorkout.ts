import type { AssignedWorkout } from "./workout";

// Shared prototype assignment until client assignments are supplied by the backend.
export const mockAssignedWorkout: AssignedWorkout | null = {
  id: "today",
  title: "Upper Body Strength",
  status: "current",
  scheduleLabel: "Week 5, Day 3",
  durationMinutes: 45,
  notes:
    "Focus on controlled movement and rest for 90 seconds between sets.\n\n" +
    "Last week your bench press slowed down on the final reps, so keep the same weight today and aim for clean, even reps rather than adding load. " +
    "If your shoulder feels tight during the incline press, drop to 35 lb and let me know in Messages after the session.",
  notesAuthor: "Coach Keys",
  notesUpdatedAt: "2026-11-06",
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

// Other assignments for the same client, so each workout carries its own coach note (or none).
const otherMockWorkouts: AssignedWorkout[] = [
  {
    id: "lower-body-next",
    title: "Lower Body Strength",
    status: "upcoming",
    scheduleLabel: "Week 5, Day 4",
    durationMinutes: 50,
    notes: "Warm up with 5 minutes on the bike before squats. Keep squats at a depth you can control; we'll work on going deeper next week.",
    notesAuthor: "Coach Keys",
    notesUpdatedAt: "2026-11-06",
    exercises: [
      { id: "back-squat", name: "Back Squat", sets: 4, reps: 6, weight: "155 lb", completed: false },
      { id: "romanian-deadlift", name: "Romanian Deadlift", sets: 3, reps: 8, weight: "115 lb", completed: false },
    ],
  },
  {
    id: "mobility-recovery",
    title: "Mobility & Recovery",
    status: "upcoming",
    scheduleLabel: "Week 5, Day 5",
    durationMinutes: 25,
    exercises: [
      { id: "hip-flexor-stretch", name: "Hip Flexor Stretch", sets: 2, reps: 30, weight: "", completed: false },
    ],
  },
];

const mockWorkouts: AssignedWorkout[] = [
  ...(mockAssignedWorkout ? [mockAssignedWorkout] : []),
  ...otherMockWorkouts,
];

export function getWorkoutById(id: string): AssignedWorkout | undefined {
  return mockWorkouts.find((workout) => workout.id === id);
}
