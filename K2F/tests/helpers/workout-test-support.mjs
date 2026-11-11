import { registerHooks } from "node:module";

// Match Metro's extensionless TypeScript resolution in Node's strip-types runner.
export function registerWorkoutTypes() {
  return registerHooks({ resolve(specifier, context, next) {
    return next(context.parentURL?.includes("/src/workouts/") && specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)
      ? specifier + ".ts" : specifier, context);
  } });
}

export function memoryStorage() {
  const entries = new Map();
  const writes = [];
  const storage = {
    async getItem(key) { return entries.get(key) ?? null; },
    async setItem(key, value) { writes.push([key, value]); entries.set(key, value); },
    async removeItem(key) { entries.delete(key); },
    async getAllKeys() { return [...entries.keys()]; },
  };
  return { storage, entries, writes };
}

export const libraryData = () => ({ templates: [], assignments: [], previewClientId: "1" });
export const workoutDraft = () => ({ title: "Integration strength", durationMinutes: "35", notes: "Keep a controlled tempo.", exercises: [{
  id: "bench", name: "Bench Press", sets: "3", reps: "8", weightLb: "135", instructions: "Keep feet planted.",
  coachNotes: "Pause briefly at the bottom.", alternative: "Push-up",
}] });

export const legacySession = (workoutId = "today") => ({ workoutId, paused: true, updatedAt: 100,
  timer: { status: "paused", elapsedMs: 65000, runningSince: null },
  exercises: [{ id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: false,
    actualSets: [{ id: "bench-row-1", actualReps: "7", actualWeightLb: "127.5", completed: true }] }],
});
