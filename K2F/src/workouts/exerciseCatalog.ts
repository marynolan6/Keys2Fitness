import type { DraftExercise } from "./workoutLibraryModel";

export const exerciseCatalog = [
  { name: "Bench Press", instructions: "Keep your feet planted and lower the bar with control." },
  { name: "Incline Dumbbell Press", instructions: "Use a low incline, brace your core, and press without locking out abruptly." },
  { name: "Seated Cable Row", instructions: "Sit tall and pull toward your ribs without leaning backward." },
  { name: "Hammer Curl", instructions: "Keep palms facing inward and elbows close to your sides." },
  { name: "Back Squat", instructions: "Brace your core and lower only as far as you can with control." },
  { name: "Romanian Deadlift", instructions: "Hinge at your hips, keep the weights close, and maintain a neutral back." },
  { name: "Leg Press", instructions: "Keep your back against the pad and avoid locking your knees." },
  { name: "Push-up", instructions: "Keep your body in a straight line and lower your chest with control." },
  { name: "Kettlebell Swing", instructions: "Hinge at the hips and let hip drive move the kettlebell." },
  { name: "Plank", instructions: "Brace your core and keep your hips aligned with your shoulders." },
  { name: "Glute Bridge", instructions: "Press through your heels and squeeze your glutes at the top." },
  { name: "Shoulder Press", instructions: "Brace your core and press overhead without arching your back." },
] as const;

let sequence = 0;
export function makeWorkoutId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newDraftExercise(name: string, instructions = ""): DraftExercise {
  return { id: makeWorkoutId("exercise"), name: name.trim(), instructions, coachNotes: "", sets: "3", reps: "10", weightLb: "0", restSeconds: "" };
}
