import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage } from "./helpers/workout-test-support.mjs";
const hooks = registerWorkoutTypes();
const { createWorkoutSessionStore } = await import("../src/workouts/workoutSessionStore.ts");
const { createWorkoutSessionService } = await import("../src/workouts/workoutSessionService.ts");
const { workoutSessionReducer, initialWorkoutSessionState } = await import("../src/workouts/workoutSessionReducer.ts");
const { getWorkoutProgress } = await import("../src/workouts/workoutProgress.ts");
hooks.deregister();

test("progress follows sets/exercises immediately, reopens correctly, reverses edits, and completes only after every required item", async () => {
  const { storage } = memoryStorage();
  const workout = { id: "progress", title: "Progress check", status: "current", exercises: [
    { id: "bench", name: "Bench Press", sets: 2, reps: 8, weight: "135 lb", completed: false },
    { id: "curl", name: "Hammer Curl", sets: 1, reps: 10, weight: "25 lb", completed: false },
  ] };
  const service = createWorkoutSessionService(createWorkoutSessionStore(storage), () => 5000, { makeId: () => "attempt", getClientId: () => "2" });
  const running = await service.changeSession(workout, await service.openWorkout(workout), "start");
  let state = workoutSessionReducer(initialWorkoutSessionState, { type: "loaded", attempt: 0, session: running });
  const act = (action) => { state = workoutSessionReducer(state, action); return getWorkoutProgress(state.session.exercises); };
  assert.equal(act({ type: "toggle-set", exerciseId: "bench", setId: "bench-set-1" }).percentage, 0);
  assert.deepEqual(act({ type: "toggle-set", exerciseId: "bench", setId: "bench-set-2" }),
    { total: 2, completed: 1, remaining: 1, percentage: 50, isComplete: false });
  await service.changeSession(workout, state.session, "pause");
  const restarted = createWorkoutSessionService(createWorkoutSessionStore(storage), () => 6000, { getClientId: () => "2" });
  const restored = await restarted.openWorkout(workout, true);
  assert.equal(getWorkoutProgress(restored.exercises).percentage, 50);
  act({ type: "loaded", attempt: 0, session: restored });
  assert.equal(act({ type: "toggle-exercise", exerciseId: "curl" }).percentage, 100);
  assert.equal(act({ type: "add-set", exerciseId: "curl", setId: "extra" }).percentage, 50);
  assert.equal(act({ type: "remove-set", exerciseId: "curl" }).percentage, 100);
  assert.equal(act({ type: "update-set", exerciseId: "bench", setId: "bench-set-1", field: "actualReps", value: "6" }).percentage, 50);
  assert.equal(act({ type: "toggle-set", exerciseId: "bench", setId: "bench-set-1" }).percentage, 100);
  await restarted.changeSession(workout, state.session, "finish");
  assert.equal(getWorkoutProgress((await restarted.openWorkout(workout)).exercises).percentage, 100);
  assert.equal((await restarted.listHistory("2")).length, 1);
});

test("an unopened sample plan cannot supply completed progress for a fresh session", async () => {
  const { storage } = memoryStorage();
  const service = createWorkoutSessionService(createWorkoutSessionStore(storage));
  const plan = { id: "sample", title: "Sample workout", status: "current", exercises: [
    { id: "bench", name: "Bench Press", sets: 1, reps: 8, weight: "135 lb", completed: true },
  ] };
  const opened = await service.openWorkout(plan);
  assert.equal(getWorkoutProgress(opened.exercises).percentage, 0);
  assert.equal(getWorkoutProgress(opened.exercises).isComplete, false);
  assert.equal(plan.exercises[0].completed, true);
});
