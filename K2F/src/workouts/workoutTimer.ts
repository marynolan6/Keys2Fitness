export type WorkoutTimer = {
  status: "ready" | "running" | "paused" | "ended";
  elapsedMs: number;
  runningSince: number | null;
};

export const initialWorkoutTimer: WorkoutTimer = { status: "ready", elapsedMs: 0, runningSince: null };

export function elapsedWorkoutTime(timer: WorkoutTimer, now: number): number {
  return timer.elapsedMs + (timer.status === "running" && timer.runningSince !== null
    ? Math.max(0, now - timer.runningSince) : 0);
}

export function transitionWorkoutTimer(
  timer: WorkoutTimer, action: "start" | "pause" | "resume" | "end", now: number,
): WorkoutTimer {
  if (action === "start" && timer.status === "ended") {
    return { status: "running", elapsedMs: 0, runningSince: now };
  }
  if ((action === "start" && timer.status === "ready") ||
      (action === "resume" && timer.status === "paused")) {
    return { ...timer, status: "running", runningSince: now };
  }
  if ((action === "pause" && timer.status === "running") ||
      (action === "end" && (timer.status === "running" || timer.status === "paused"))) {
    return { status: action === "end" ? "ended" : "paused", elapsedMs: elapsedWorkoutTime(timer, now), runningSince: null };
  }
  return timer;
}

export function formatWorkoutTime(milliseconds: number): string {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const parts = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
  return (parts[0] ? parts : parts.slice(1)).map((part) => String(part).padStart(2, "0")).join(":");
}
