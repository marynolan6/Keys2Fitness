import type { AssignedWorkout } from "./workout";
import type { WorkoutSession } from "./workoutSessionModel";
import type { WorkoutSessionRepository } from "./workoutRepositories";
import { initializeSetPerformance, resetSetPerformance } from "./setPerformance";
import { initialWorkoutTimer, transitionWorkoutTimer } from "./workoutTimer";

export type WorkoutTimerAction = "start" | "pause" | "resume" | "end";
export type WorkoutSessionService = ReturnType<typeof createWorkoutSessionService>;

export function createNewWorkoutSession(workout: AssignedWorkout): WorkoutSession {
  return { workoutId: workout.id, exercises: workout.exercises.map(initializeSetPerformance), timer: { ...initialWorkoutTimer } };
}

export function createWorkoutSessionService(repository: WorkoutSessionRepository, now = Date.now) {
  async function openWorkout(workout: AssignedWorkout, resume = false): Promise<WorkoutSession> {
    const saved = await repository.loadWorkoutSession(workout.id);
    if (!saved) return createNewWorkoutSession(workout);
    const session = { ...saved, exercises: saved.exercises.map(initializeSetPerformance) };
    const timer = resume ? transitionWorkoutTimer(session.timer, "resume", now()) : session.timer;
    if (timer !== session.timer) await repository.saveWorkoutSession({ ...session, timer });
    return { ...session, timer };
  }

  async function changeSession(workout: AssignedWorkout, session: WorkoutSession, action: WorkoutTimerAction): Promise<WorkoutSession> {
    const timer = transitionWorkoutTimer(session.timer, action, now());
    if (timer === session.timer) return session;
    const exercises = action === "start" && session.timer.status === "ended" ? workout.exercises.map(resetSetPerformance) : session.exercises;
    const next = { ...session, timer, exercises };
    await repository.saveWorkoutSession(next);
    return next;
  }

  return { openWorkout, changeSession,
    checkpoint: (session: WorkoutSession) => repository.saveWorkoutSession(session),
    findActiveWorkout: (isAvailable?: (id: string) => boolean) => repository.loadActiveWorkoutSession(isAvailable),
  };
}
