import type { AssignedWorkout } from "./workout";
import type { WorkoutSession } from "./workoutSessionModel";
import type { WorkoutSessionRepository } from "./workoutRepositories";
import { initializeSetPerformance, resetSetPerformance } from "./setPerformance";
import { initialWorkoutTimer, transitionWorkoutTimer } from "./workoutTimer";
import { getWorkoutProgress } from "./workoutProgress";

export type WorkoutTimerAction = "start" | "pause" | "resume" | "end" | "finish";
export type WorkoutSessionService = ReturnType<typeof createWorkoutSessionService>;

export function createNewWorkoutSession(workout: AssignedWorkout): WorkoutSession {
  return { workoutId: workout.id, exercises: workout.exercises.map(initializeSetPerformance), timer: { ...initialWorkoutTimer } };
}

export function createWorkoutSessionService(repository: WorkoutSessionRepository, now = Date.now, context: {
  makeId?: () => string; getClientId?: (workoutId: string) => string;
} = {}) {
  let sequence = 0;
  const makeId = context.makeId ?? (() => `attempt-${now()}-${++sequence}`);
  const getClientId = context.getClientId ?? (() => "1");
  async function openWorkout(workout: AssignedWorkout, resume = false): Promise<WorkoutSession> {
    const saved = await repository.loadWorkoutSession(workout.id);
    if (!saved) return createNewWorkoutSession(workout);
    const session = { ...saved, exercises: saved.exercises.map(initializeSetPerformance) };
    // Stable identity for a previously started legacy checkpoint; do not invent
    // successful completion records for old ended sessions.
    if (!session.sessionId && session.timer.status !== "ready") {
      session.sessionId = `legacy-${workout.id}-${session.timer.runningSince ?? session.updatedAt ?? 0}`;
    }
    const timer = resume ? transitionWorkoutTimer(session.timer, "resume", now()) : session.timer;
    if (timer !== session.timer) await repository.saveWorkoutSession({ ...session, timer });
    return { ...session, timer };
  }

  async function changeSession(workout: AssignedWorkout, session: WorkoutSession, action: WorkoutTimerAction): Promise<WorkoutSession> {
    if (action === "finish" || action === "end") {
      if (session.timer.status === "ended") return session;
      if (session.timer.status !== "running" && session.timer.status !== "paused") throw new Error("Start the workout before finishing it.");
      const exercises = session.exercises.map(initializeSetPerformance);
      if (action === "finish" && (!getWorkoutProgress(exercises).isComplete || !workout.exercises.length ||
          !workout.exercises.every((required) => exercises.some((exercise) => exercise.id === required.id && exercise.completed)))) {
        throw new Error("Complete every exercise and performed set before confirming completion.");
      }
      const finishedAt = now();
      const sessionId = session.sessionId ?? `legacy-${workout.id}-${session.timer.runningSince ?? session.updatedAt ?? 0}`;
      const next = { ...session, exercises, sessionId, finishedAt,
        outcome: action === "finish" ? "completed" as const : "ended-early" as const,
        timer: transitionWorkoutTimer(session.timer, "end", finishedAt) };
      return repository.finalizeWorkoutSession({ id: sessionId, clientId: getClientId(workout.id), title: workout.title, session: next });
    }
    const timer = transitionWorkoutTimer(session.timer, action, now());
    if (timer === session.timer) return session;
    const exercises = action === "start" && session.timer.status === "ended" ? workout.exercises.map(resetSetPerformance) : session.exercises;
    const newAttempt = action === "start";
    const next: WorkoutSession = newAttempt
      ? { workoutId: workout.id, exercises, timer, sessionId: makeId(), startedAt: timer.runningSince! }
      : { ...session, timer };
    await repository.saveWorkoutSession(next);
    return next;
  }

  return { openWorkout, changeSession,
    checkpoint: (session: WorkoutSession) => repository.saveWorkoutSession(session),
    findActiveWorkout: (isAvailable?: (id: string) => boolean) => repository.loadActiveWorkoutSession(isAvailable),
    listHistory: (clientId: string) => repository.listWorkoutHistory(clientId),
  };
}
