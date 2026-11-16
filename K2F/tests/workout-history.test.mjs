import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage, legacySession } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { getClientWorkoutHistory, findWorkoutHistoryEntry, recordedSetResult } = await import("../src/workouts/workoutHistory.ts");
const { initialWorkoutHistoryState, workoutHistoryReducer: reduce } = await import("../src/workouts/workoutHistoryReducer.ts");
const { workoutPreviewReducer: preview } = await import("../src/workouts/workoutPreviewReducer.ts");
const { createWorkoutSessionStore, workoutSessionPrefix } = await import("../src/workouts/workoutSessionStore.ts");
const { createWorkoutSessionService } = await import("../src/workouts/workoutSessionService.ts");
const { toggleExercisePerformance, updateSetPerformance } = await import("../src/workouts/setPerformance.ts");
hooks.deregister();

function entry(id = "attempt", { clientId = "1", workoutId = "plan", time = 1000, outcome = "completed",
  exercises = [{ id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: true }] } = {}) {
  return { id, clientId, title: "Recorded strength", session: { sessionId: id, workoutId, finishedAt: time, outcome,
    timer: { status: "ended", elapsedMs: 60000, runningSince: null }, exercises } };
}
const key = (record) => ({ workoutId: record.session.workoutId, sessionId: record.id });
function ready(entries = [entry()], clientId = "1", requestId = 1) {
  return reduce(reduce(initialWorkoutHistoryState, { type: "load-started", clientId, requestId }),
    { type: "loaded", clientId, requestId, entries });
}

test("history is newest first, client scoped, and completed-only browsing excludes ended-early and active records", () => {
  const newest = entry("new", { time: 3000 });
  const other = entry("other", { clientId: "2", time: 5000 });
  const early = entry("early", { time: 4000, outcome: "ended-early" });
  const active = entry("active", { time: 6000 }); active.session.timer.status = "running";
  const oldest = entry("old", { time: 1000 });
  const records = [oldest, other, early, newest, active];
  const original = structuredClone(records);
  assert.deepEqual(getClientWorkoutHistory(records, "1", "completed"), [newest, oldest]);
  assert.deepEqual(getClientWorkoutHistory(records, "1"), [early, newest, oldest]);
  assert.deepEqual(getClientWorkoutHistory(records, ""), []);
  assert.deepEqual(getClientWorkoutHistory(records, "missing"), []);
  assert.deepEqual(records, original);
});

test("detail lookup requires client, workout, and attempt; invalid or colliding IDs never fall back to another record", () => {
  const a = entry();
  const b = entry("attempt", { clientId: "2", workoutId: "other" });
  const repeated = entry("second", { workoutId: "plan" });
  const records = [b, a, repeated];
  assert.equal(findWorkoutHistoryEntry(records, "1", key(a)), a);
  assert.equal(findWorkoutHistoryEntry(records, "1", key(repeated)), repeated);
  assert.equal(findWorkoutHistoryEntry(records, "1", key(b)), null);
  assert.equal(findWorkoutHistoryEntry(records, "missing", key(a)), null);
  assert.equal(findWorkoutHistoryEntry(records, "1", { workoutId: "plan", sessionId: "missing" }), null);
  assert.equal(findWorkoutHistoryEntry(records, "1", { workoutId: "missing", sessionId: "attempt" }), null);
  assert.equal(findWorkoutHistoryEntry([], "1", key(a)), null);
});

test("actual set results preserve explicit zero, decimals and blanks without using prescribed values", () => {
  assert.deepEqual(recordedSetResult({ actualReps: "0", actualWeightLb: "0", completed: true }),
    { reps: "0 reps", weight: "0 lb", status: "Confirmed" });
  assert.deepEqual(recordedSetResult({ actualReps: " 7 ", actualWeightLb: "127.5", completed: true }),
    { reps: "7 reps", weight: "127.5 lb", status: "Confirmed" });
  assert.deepEqual(recordedSetResult({ actualReps: "", actualWeightLb: " " }),
    { reps: "Reps not recorded", weight: "Weight not recorded", status: "Unconfirmed" });
});

test("stale success/failure is rejected across client changes and repeated requests for the same client", () => {
  let state = ready();
  state = reduce(state, { type: "load-started", clientId: "2", requestId: 2 });
  const loadingB = state;
  assert.equal(reduce(state, { type: "loaded", clientId: "1", requestId: 1, entries: [entry()] }), loadingB);
  assert.equal(reduce(state, { type: "failed", clientId: "1", requestId: 1 }), loadingB);
  state = reduce(state, { type: "load-started", clientId: "1", requestId: 3 });
  assert.equal(reduce(state, { type: "loaded", clientId: "1", requestId: 1, entries: [entry()] }), state);
  assert.equal(reduce(state, { type: "failed", clientId: "2", requestId: 2 }), state);
  state = reduce(state, { type: "loaded", clientId: "1", requestId: 3, entries: [entry(), entry("foreign", { clientId: "2" })] });
  assert.equal(state.status, "ready");
  assert.deepEqual(state.entries.map((record) => record.id), ["attempt"]);
});

test("failure, retry and clear discard stale data and prevent old request completions from replacing new results", () => {
  let state = reduce(ready(), { type: "load-started", clientId: "1", requestId: 2 });
  state = reduce(state, { type: "failed", clientId: "1", requestId: 2 });
  assert.equal(state.status, "error");
  assert.deepEqual(state.entries, []);
  state = reduce(state, { type: "retry" });
  assert.equal(state.status, "idle");
  assert.equal(state.retry, 1);
  assert.equal(reduce(state, { type: "loaded", clientId: "1", requestId: 2, entries: [entry()] }), state);
  state = reduce(state, { type: "load-started", clientId: "1", requestId: 3 });
  state = reduce(state, { type: "loaded", clientId: "1", requestId: 3, entries: [] });
  assert.equal(state.status, "ready");
  assert.deepEqual(state.entries, []);
  assert.equal(reduce(state, { type: "retry" }), state);
  state = reduce(state, { type: "clear" });
  assert.equal(state.clientId, null);
  assert.equal(state.view.type, "list");
  assert.equal(reduce(state, { type: "loaded", clientId: "1", requestId: 3, entries: [entry()] }), state);
});

test("Back preserves the history filter/expansion; client changes reset selection and cannot resurrect an old detail", () => {
  let state = reduce(ready(), { type: "filter", filter: "all" });
  state = reduce(state, { type: "toggle-expanded" });
  state = reduce(state, { type: "select", key: key(entry()) });
  assert.equal(state.view.type, "detail");
  state = reduce(state, { type: "back" });
  assert.equal(state.view.type, "list");
  assert.equal(state.filter, "all");
  assert.equal(state.expanded, true);
  state = reduce(state, { type: "select", key: key(entry()) });
  state = reduce(state, { type: "load-started", clientId: "2", requestId: 2 });
  assert.equal(state.view.type, "list");
  assert.equal(state.filter, "completed");
  assert.equal(state.expanded, false);
  state = reduce(state, { type: "load-started", clientId: "1", requestId: 3 });
  assert.equal(state.view.type, "list");
});

test("a missing selected record remains an explicit missing-detail view instead of displaying a cached object", () => {
  let state = reduce(ready(), { type: "select", key: key(entry()) });
  state = reduce(state, { type: "load-started", clientId: "1", requestId: 2 });
  state = reduce(state, { type: "loaded", clientId: "1", requestId: 2, entries: [] });
  assert.equal(state.view.type, "detail");
  assert.equal(findWorkoutHistoryEntry(state.entries, state.clientId, state.view.key), null);
  state = reduce(state, { type: "back" });
  state = reduce(state, { type: "select", key: { workoutId: "invalid", sessionId: "invalid" } });
  assert.equal(findWorkoutHistoryEntry(state.entries, state.clientId, state.view.key), null);
});

test("leaving history closes the detail without resetting list controls and invalidates pending loads", () => {
  let state = reduce(ready(), { type: "filter", filter: "all" });
  state = reduce(state, { type: "toggle-expanded" });
  state = reduce(state, { type: "select", key: key(entry()) });
  state = reduce(state, { type: "leave" });
  assert.equal(state.view.type, "list");
  assert.equal(state.filter, "all");
  assert.equal(state.expanded, true);
  state = reduce(state, { type: "load-started", clientId: "1", requestId: 2 });
  state = reduce(state, { type: "leave" });
  assert.equal(state.status, "idle");
  assert.equal(reduce(state, { type: "loaded", clientId: "1", requestId: 2, entries: [entry()] }), state);
  assert.equal(reduce(state, { type: "failed", clientId: "1", requestId: 2 }), state);
});

test("demo-client selection guards pending changes/dismissal and keeps a failed selection available for retry", () => {
  let state = preview({ status: "closed" }, { type: "open" });
  state = preview(state, { type: "choose", clientId: "2" });
  assert.equal(state.status, "saving");
  assert.equal(preview(state, { type: "close" }), state);
  assert.equal(preview(state, { type: "choose", clientId: "3" }), state);
  assert.equal(preview(state, { type: "saved", clientId: "3" }), state);
  state = preview(state, { type: "failed", clientId: "2" });
  assert.equal(state.status, "error");
  state = preview(state, { type: "choose", clientId: "2" });
  state = preview(state, { type: "saved", clientId: "2" });
  assert.equal(state.status, "closed");
});

test("demo-client picker reset invalidates late completions and clears previous errors on reopening", () => {
  let state = preview({ status: "choosing" }, { type: "choose", clientId: "2" });
  state = preview(state, { type: "reset" });
  assert.equal(preview(state, { type: "failed", clientId: "2" }), state);
  assert.equal(preview(state, { type: "saved", clientId: "2" }), state);
  state = preview({ status: "error", message: "Previous failure" }, { type: "close" });
  assert.deepEqual(preview(state, { type: "open" }), { status: "choosing" });
});

test("application history rules hold even when a domain-only repository returns mixed-client unsorted data", async () => {
  const old = entry("old");
  const newest = entry("new", { time: 2000 });
  const repository = { async listWorkoutHistory() { return [old, entry("foreign", { clientId: "2" }), newest]; } };
  const service = createWorkoutSessionService(repository);
  assert.deepEqual(await service.listHistory("1"), [newest, old]);
});

test("browsing repeated completed attempts preserves actual sets and the independent active workout without writes", async () => {
  const memory = memoryStorage();
  let time = 1000; let sequence = 0;
  const repository = createWorkoutSessionStore(memory.storage, () => time);
  const service = createWorkoutSessionService(repository, () => time, { makeId: () => `attempt-${++sequence}`, getClientId: () => "1" });
  const workout = { id: "plan", title: "Original title", status: "current", exercises: [
    { id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: false },
  ] };
  let session = await service.changeSession(workout, await service.openWorkout(workout), "start");
  session.exercises[0] = updateSetPerformance(session.exercises[0], "bench-set-1", "actualReps", "7");
  session.exercises[0] = updateSetPerformance(session.exercises[0], "bench-set-1", "actualWeightLb", "127.5");
  session.exercises = session.exercises.map(toggleExercisePerformance);
  time = 2000;
  const first = await service.changeSession(workout, session, "finish");
  time = 3000;
  session = await service.changeSession(workout, first, "start");
  session.exercises = session.exercises.map(toggleExercisePerformance);
  time = 4000;
  const second = await service.changeSession(workout, session, "finish");
  time = 5000;
  const active = await service.changeSession(workout, second, "start");
  const persisted = new Map(memory.entries);
  const writes = memory.writes.length;
  const restarted = createWorkoutSessionService(createWorkoutSessionStore(memory.storage));
  const history = await restarted.listHistory("1");
  assert.deepEqual(history.map((record) => record.id), [second.sessionId, first.sessionId]);
  const result = findWorkoutHistoryEntry(history, "1", { workoutId: "plan", sessionId: first.sessionId });
  assert.equal(result.title, "Original title");
  assert.equal(result.session.exercises[0].actualSets[0].actualReps, "7");
  assert.equal(result.session.exercises[0].actualSets[0].actualWeightLb, "127.5");
  assert.equal(result.session.exercises[0].weight, "135 lb");
  assert.equal((await restarted.findActiveWorkout()).sessionId, active.sessionId);
  assert.deepEqual(await restarted.listHistory("2"), []);
  assert.equal(memory.writes.length, writes);
  assert.deepEqual(memory.entries, persisted);
});

test("sparse archives do not fabricate performed sets; legacy ended checkpoints do not become completed history", async () => {
  const memory = memoryStorage();
  const sparse = entry("sparse", { exercises: [{ id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: true }] });
  memory.entries.set(workoutSessionPrefix + "plan", JSON.stringify({ schemaVersion: 3, data: null, history: [sparse] }));
  const legacy = legacySession("legacy"); legacy.timer.status = "ended";
  memory.entries.set(workoutSessionPrefix + "legacy", JSON.stringify({ schemaVersion: 2, data: legacy }));
  const service = createWorkoutSessionService(createWorkoutSessionStore(memory.storage));
  const records = await service.listHistory("1");
  assert.equal(records.length, 1);
  assert.equal(records[0].session.exercises[0].actualSets, undefined);
  assert.equal((await service.listHistory("1")).length, 1);
  assert.equal(JSON.parse(memory.entries.get(workoutSessionPrefix + "legacy")).history.length, 0);
});

test("corrupt or unavailable history yields an error that can be retried without replacing saved records", async () => {
  const memory = memoryStorage();
  const raw = JSON.stringify({ schemaVersion: 3, data: null, history: [{ id: "invalid" }] });
  memory.entries.set(workoutSessionPrefix + "plan", raw);
  const service = createWorkoutSessionService(createWorkoutSessionStore(memory.storage));
  await assert.rejects(service.listHistory("1"), /could not be read/);
  assert.equal(memory.entries.get(workoutSessionPrefix + "plan"), raw);
  const valid = JSON.stringify({ schemaVersion: 3, data: null, history: [entry()] });
  memory.entries.set(workoutSessionPrefix + "plan", valid);
  const getAllKeys = memory.storage.getAllKeys;
  memory.storage.getAllKeys = async () => { throw new Error("Storage unavailable"); };
  await assert.rejects(service.listHistory("1"), /Storage unavailable/);
  memory.storage.getAllKeys = getAllKeys;
  assert.equal((await service.listHistory("1")).length, 1);
  assert.equal(memory.entries.get(workoutSessionPrefix + "plan"), valid);
});
