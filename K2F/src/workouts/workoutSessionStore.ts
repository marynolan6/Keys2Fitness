import type { AssignedWorkout } from "./workout";
import type { WorkoutTimer } from "./workoutTimer";
import { isValidPerformedSets } from "./setPerformance";

export type WorkoutSession = {
  workoutId: string;
  exercises: AssignedWorkout["exercises"];
  paused: boolean;
  timer?: WorkoutTimer;
  updatedAt?: number;
};

type SessionStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
  getAllKeys: () => Promise<readonly string[]>;
};

const storagePrefix = "keys2fitness:workout-session:";

export function isWorkoutInProgress(session: WorkoutSession | null): boolean {
  if (!session) return false;
  return session.timer
    ? session.timer.status === "running" || session.timer.status === "paused"
    : session.paused;
}

export function getWorkoutCardLabels(workout: AssignedWorkout, session: WorkoutSession | null) {
  const matchingSession = session?.workoutId === workout.id ? session : null;
  const continuing = isWorkoutInProgress(matchingSession);
  return {
    continuing,
    status: continuing ? "Current workout"
      : matchingSession?.timer?.status === "ended" ? "Workout ended"
        : workout.status === "upcoming" ? "Upcoming workout" : "Today's workout",
    action: continuing ? "Continue workout" : "View workout",
  };
}

// Ignore malformed checkpoints individually rather than hiding every valid session.
export function parseWorkoutSession(saved: string | null, workoutId: string): WorkoutSession | null {
  if (!saved) return null;
  let value: unknown;
  try { value = JSON.parse(saved); } catch { return null; }
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<WorkoutSession>;
  if (session.workoutId !== workoutId || typeof session.paused !== "boolean" ||
      !Array.isArray(session.exercises) || !session.exercises.every((exercise) =>
        exercise && typeof exercise === "object" && typeof exercise.id === "string" &&
        typeof exercise.name === "string" && typeof exercise.completed === "boolean" &&
        Number.isInteger(exercise.sets) && exercise.sets >= 0 &&
        Number.isInteger(exercise.reps) && exercise.reps >= 0 &&
        (exercise.weight === undefined || typeof exercise.weight === "string") &&
        (exercise.actualSets === undefined || isValidPerformedSets(exercise.actualSets)))) return null;
  if (session.updatedAt !== undefined && (!Number.isFinite(session.updatedAt) || session.updatedAt < 0)) return null;
  if (session.timer) {
    const timer = session.timer;
    if (!["ready", "running", "paused", "ended"].includes(timer.status) ||
        !Number.isFinite(timer.elapsedMs) || timer.elapsedMs < 0 ||
        (timer.status === "running"
          ? typeof timer.runningSince !== "number" || !Number.isFinite(timer.runningSince)
          : timer.runningSince !== null)) return null;
  } else if (!session.paused) return null;
  return session as WorkoutSession;
}

// One ordered write stream prevents a delayed edit checkpoint from overwriting
// a later Pause/End, and lets dashboard reads wait for outstanding checkpoints.
// Storage injection keeps the real persistence behavior testable without native modules.
export function createWorkoutSessionStore(storage: SessionStorage, now = Date.now) {
  let writes: Promise<unknown> = Promise.resolve();
  let lastUpdatedAt = 0;

  function enqueue(write: () => Promise<unknown>) {
    const result = writes.then(write);
    writes = result.catch(() => undefined);
    return result;
  }

  async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
    // Serialize at call time so later edits cannot mutate a queued checkpoint.
    lastUpdatedAt = Math.max(now(), lastUpdatedAt + 1);
    const saved = JSON.stringify({ ...session, updatedAt: lastUpdatedAt });
    await enqueue(() => storage.setItem(storagePrefix + session.workoutId, saved));
  }

  async function loadWorkoutSession(workoutId: string): Promise<WorkoutSession | null> {
    await writes;
    return parseWorkoutSession(await storage.getItem(storagePrefix + workoutId), workoutId);
  }

  async function loadActiveWorkoutSession(isAvailable: (id: string) => boolean = () => true): Promise<WorkoutSession | null> {
    await writes;
    const keys = (await storage.getAllKeys()).filter((key) => key.startsWith(storagePrefix));
    const sessions = await Promise.all(keys.map(async (key) => {
      const id = key.slice(storagePrefix.length);
      return isAvailable(id) ? parseWorkoutSession(await storage.getItem(key), id) : null;
    }));
    return sessions.filter((session): session is WorkoutSession => session !== null && isWorkoutInProgress(session))
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.workoutId.localeCompare(b.workoutId))[0] ?? null;
  }

  async function clearWorkoutSession(workoutId: string): Promise<void> {
    await enqueue(() => storage.removeItem(storagePrefix + workoutId));
  }

  return { saveWorkoutSession, loadWorkoutSession, loadActiveWorkoutSession, clearWorkoutSession };
}
