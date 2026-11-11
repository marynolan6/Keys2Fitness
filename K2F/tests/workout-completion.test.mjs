import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage, legacySession } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { createWorkoutSessionStore, workoutSessionPrefix } = await import("../src/workouts/workoutSessionStore.ts");
const { createWorkoutSessionService } = await import("../src/workouts/workoutSessionService.ts");
const { toggleExercisePerformance, updateSetPerformance } = await import("../src/workouts/setPerformance.ts");
const { getWorkoutCardLabels, workoutHistoryTotals } = await import("../src/workouts/workoutSessionModel.ts");
const { workoutSessionReducer, initialWorkoutSessionState } = await import("../src/workouts/workoutSessionReducer.ts");
const { decodeWorkoutSessionRecord, workoutSessionSchemaVersion } = await import("../src/workouts/workoutMigrations.ts");
hooks.deregister();

const workout = { id: "training", title: "Strength day", status: "current", exercises: [
  { id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: false },
] };

function fixture() {
  const memory = memoryStorage();
  let time = 1000;
  let id = 0;
  const repository = createWorkoutSessionStore(memory.storage, () => time);
  const service = createWorkoutSessionService(repository, () => time, { makeId: () => `attempt-${++id}`, getClientId: () => "2" });
  return { ...memory, repository, service, setTime: (value) => { time = value; } };
}

async function start(f) {
  return f.service.changeSession(workout, await f.service.openWorkout(workout), "start");
}
function complete(session) {
  return { ...session, exercises: session.exercises.map(toggleExercisePerformance) };
}

test("finish requires a started, nonempty workout with all required exercises and sets confirmed", async () => {
  const f = fixture();
  await assert.rejects(f.service.changeSession(workout, await f.service.openWorkout(workout), "finish"), /Start the workout/);
  const running = await start(f);
  await assert.rejects(f.service.changeSession(workout, running, "finish"), /Complete every exercise/);
  const dishonest = { ...running, exercises: running.exercises.map((exercise) => ({ ...exercise, completed: true })) };
  await assert.rejects(f.service.changeSession(workout, dishonest, "finish"), /Complete every exercise/);
  const missing = { ...complete(running), exercises: [] };
  await assert.rejects(f.service.changeSession(workout, missing, "finish"), /Complete every exercise/);
  const anotherExercise = { ...complete(running), exercises: [{ ...complete(running).exercises[0], id: "wrong" }] };
  await assert.rejects(f.service.changeSession(workout, anotherExercise, "finish"), /Complete every exercise/);
  assert.equal((await f.repository.listWorkoutHistory("2")).length, 0);
});

test("confirmed completion saves a dated immutable record and checkpoint in one write", async () => {
  const f = fixture();
  let running = await start(f);
  running = { ...running, exercises: [updateSetPerformance(running.exercises[0], "bench-set-1", "actualWeightLb", "127.5")] };
  running = complete(running);
  f.setTime(61000);
  const writesBefore = f.writes.length;
  const finished = await f.service.changeSession(workout, running, "finish");
  assert.equal(f.writes.length, writesBefore + 1);
  assert.equal(finished.outcome, "completed");
  assert.equal(finished.finishedAt, 61000);
  assert.equal(finished.timer.elapsedMs, 60000);
  assert.equal(getWorkoutCardLabels(workout, finished).status, "Workout completed");
  const history = await f.repository.listWorkoutHistory("2");
  assert.equal(history.length, 1);
  assert.equal(history[0].title, "Strength day");
  assert.equal(history[0].session.exercises[0].actualSets[0].actualWeightLb, "127.5");
  assert.equal(history[0].session.exercises[0].actualSets[0].completed, true);
  assert.equal((await f.repository.loadWorkoutSession(workout.id)).outcome, "completed");
  const restarted = createWorkoutSessionStore(f.storage);
  assert.deepEqual(await restarted.listWorkoutHistory("2"), history);
  assert.deepEqual(workoutHistoryTotals(history), { completed: 1, endedEarly: 0, activeMs: 60000 });
  assert.equal((await restarted.listWorkoutHistory("1")).length, 0);
});

test("confirmation cancellation is read-only; early ends are archived but do not increment completed totals", async () => {
  const f = fixture();
  const running = await start(f);
  const paused = await f.service.changeSession(workout, running, "pause");
  // Merely checking eligibility or displaying a dialog never invokes finalization.
  assert.equal((await f.repository.listWorkoutHistory("2")).length, 0);
  assert.equal((await f.service.openWorkout(workout)).timer.status, "paused");
  f.setTime(50000);
  const ended = await f.service.changeSession(workout, paused, "end");
  assert.equal(ended.outcome, "ended-early");
  assert.equal(ended.timer.elapsedMs, 0); // Paused time excluded.
  const history = await f.repository.listWorkoutHistory("2");
  assert.deepEqual(workoutHistoryTotals(history), { completed: 0, endedEarly: 1, activeMs: 0 });
  assert.equal(await f.service.findActiveWorkout(), null);
});

test("duplicate confirms, retries, and stale autosaves cannot duplicate counts or reopen completed attempts", async () => {
  const f = fixture();
  const running = complete(await start(f));
  const [a, b] = await Promise.all([f.service.changeSession(workout, running, "finish"), f.service.changeSession(workout, running, "finish")]);
  assert.equal(a.sessionId, b.sessionId);
  assert.equal((await f.repository.listWorkoutHistory("2")).length, 1);
  await f.service.checkpoint(running);
  assert.equal((await f.repository.loadWorkoutSession(workout.id)).outcome, "completed");
  assert.equal((await f.service.openWorkout(workout, true)).timer.status, "ended");
});

test("repeated attempts keep separate history after start-new, process restart, and checkpoint clearing", async () => {
  const f = fixture();
  const first = await f.service.changeSession(workout, complete(await start(f)), "finish");
  f.setTime(5000);
  const second = await f.service.changeSession(workout, first, "start");
  assert.notEqual(first.sessionId, second.sessionId);
  assert.equal(second.outcome, undefined);
  assert.equal(second.exercises[0].completed, false);
  await f.service.changeSession(workout, complete(second), "finish");
  await f.repository.clearWorkoutSession(workout.id);
  assert.equal(await f.repository.loadWorkoutSession(workout.id), null);
  const restarted = createWorkoutSessionStore(f.storage);
  const history = await restarted.listWorkoutHistory("2");
  assert.equal(history.length, 2);
  assert.equal(workoutHistoryTotals(history).completed, 2);
});

test("a failed archive write retains progress, permits retry, and never marks a false completion", async () => {
  const f = fixture();
  const running = complete(await start(f));
  await f.service.checkpoint(running);
  const original = f.entries.get(workoutSessionPrefix + workout.id);
  const setItem = f.storage.setItem;
  f.storage.setItem = async () => { throw new Error("Disk full"); };
  let state = workoutSessionReducer(initialWorkoutSessionState, { type: "loaded", attempt: 0, session: running });
  state = workoutSessionReducer(state, { type: "transition-started" });
  try { await f.service.changeSession(workout, running, "finish"); }
  catch (error) { state = workoutSessionReducer(state, { type: "transition-failed", error: error.message }); }
  assert.equal(state.status, "ready");
  assert.equal(state.session.timer.status, "running");
  assert.equal(state.session.exercises[0].completed, true);
  assert.equal(f.entries.get(workoutSessionPrefix + workout.id), original);
  assert.equal((await f.repository.listWorkoutHistory("2")).length, 0);
  f.storage.setItem = setItem;
  await f.service.changeSession(workout, state.session, "finish");
  assert.equal(workoutHistoryTotals(await f.repository.listWorkoutHistory("2")).completed, 1);
});

test("v2 ended checkpoints migrate without fabricating completion or history", async () => {
  const f = fixture();
  const legacy = legacySession("training"); legacy.timer.status = "ended";
  f.entries.set(workoutSessionPrefix + workout.id, JSON.stringify({ schemaVersion: 2, data: legacy }));
  const restored = await f.service.openWorkout(workout, true);
  assert.equal(restored.outcome, undefined);
  assert.equal(restored.timer.status, "ended");
  assert.equal((await f.repository.listWorkoutHistory("2")).length, 0);
  const envelope = JSON.parse(f.entries.get(workoutSessionPrefix + workout.id));
  assert.equal(envelope.schemaVersion, workoutSessionSchemaVersion);
  assert.deepEqual(envelope.history, []);
});

test("corrupt history fails explicitly and is never silently replaced by a checkpoint", async () => {
  const f = fixture();
  const running = await start(f);
  const raw = JSON.stringify({ schemaVersion: 3, data: running, history: [{ id: "bad" }] });
  f.entries.set(workoutSessionPrefix + workout.id, raw);
  assert.throws(() => decodeWorkoutSessionRecord(raw, workout.id));
  await assert.rejects(f.repository.listWorkoutHistory("2"), /could not be read/);
  await assert.rejects(f.service.checkpoint(running), /could not be read/);
  assert.equal(f.entries.get(workoutSessionPrefix + workout.id), raw);
});
