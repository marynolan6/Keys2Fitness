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
const { recordedSetRows } = await import("../src/workouts/workoutHistory.ts");
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

test("per-set edits survive switching exercises, pause/reopen, review and finish with identical recorded results", async () => {
  const f = fixture();
  const plan = { ...workout, exercises: [...workout.exercises,
    { id: "curl", name: "Curl", sets: 1, reps: 10, weight: "40 lb", completed: false }] };
  const running = await f.service.changeSession(plan, await f.service.openWorkout(plan), "start");
  let state = workoutSessionReducer(initialWorkoutSessionState, { type: "loaded", attempt: 0, session: running });
  const act = (action) => { state = workoutSessionReducer(state, action); };
  act({ type: "update-set", exerciseId: "bench", setId: "bench-set-2", field: "actualReps", value: "7" });
  act({ type: "update-set", exerciseId: "bench", setId: "bench-set-2", field: "actualWeightLb", value: "127.5" });
  act({ type: "update-set", exerciseId: "curl", setId: "curl-set-1", field: "actualReps", value: "0" });
  const previous = state;
  act({ type: "update-set", exerciseId: "curl", setId: "bench-set-2", field: "actualReps", value: "99" });
  assert.equal(state, previous);
  act({ type: "remove-set", exerciseId: "bench" });
  assert.deepEqual(recordedSetRows(state.session.exercises[0]), [
    { id: "bench-set-2", number: 2, reps: "7 reps", weight: "127.5 lb", status: "Unconfirmed" },
  ]);
  await f.service.changeSession(plan, state.session, "pause");
  const service = createWorkoutSessionService(createWorkoutSessionStore(f.storage), () => 5000, { getClientId: () => "2" });
  const resumed = await service.openWorkout(plan, true);
  assert.deepEqual(resumed.exercises, state.session.exercises);
  act({ type: "loaded", attempt: 0, session: resumed });
  act({ type: "toggle-exercise", exerciseId: "bench" });
  act({ type: "toggle-set", exerciseId: "curl", setId: "curl-set-1" });
  const review = state.session.exercises.map(recordedSetRows);
  assert.equal(review[0][0].reps, "8 reps");
  assert.equal(review[0][1].weight, "127.5 lb");
  assert.deepEqual(review[1], [{ id: "curl-set-1", number: 1, reps: "0 reps", weight: "40 lb", status: "Confirmed" }]);
  assert.deepEqual(await service.listHistory("2"), []); // Reviewing does not finish the workout.
  await service.changeSession(plan, state.session, "finish");
  const [record] = await service.listHistory("2");
  assert.deepEqual(record.session.exercises, state.session.exercises);
  assert.deepEqual(record.session.exercises.map(recordedSetRows), review);
  assert.deepEqual((await service.openWorkout(plan)).exercises.map(recordedSetRows), review);
});

test("opening a sparse ended checkpoint never reconstructs performed sets from prescribed targets", async () => {
  const f = fixture();
  const old = legacySession(workout.id);
  old.timer.status = "ended";
  old.exercises[0].completed = true;
  delete old.exercises[0].actualSets;
  f.entries.set(workoutSessionPrefix + workout.id, JSON.stringify({ schemaVersion: 2, data: old }));
  const reopened = await f.service.openWorkout(workout);
  assert.deepEqual(reopened.exercises, old.exercises);
  assert.deepEqual(recordedSetRows(reopened.exercises[0]), []);
});

test("starting a fresh attempt does not claim the sample assignment's demo progress as client performance", async () => {
  const { service } = fixture();
  const demo = { ...workout, exercises: [{ ...workout.exercises[0], completed: true }] };
  const started = await service.changeSession(demo, await service.openWorkout(demo), "start");
  assert.equal(started.exercises[0].completed, false);
  assert.deepEqual(recordedSetRows(started.exercises[0]), []);
  assert.equal(demo.exercises[0].completed, true);
});
