import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes } from "./helpers/workout-test-support.mjs";
import { initializeSetPerformance, togglePerformedSet, updateSetPerformance } from "../src/workouts/setPerformance.ts";
import { elapsedWorkoutTime, transitionWorkoutTimer } from "../src/workouts/workoutTimer.ts";

// Metro/TypeScript resolve extensionless TS imports; Node's strip-types runner
// needs the extension for this dependency, without changing application imports.
const hooks = registerWorkoutTypes();
const { createWorkoutSessionStore, getWorkoutCardLabels, isWorkoutInProgress, parseWorkoutSession } =
  await import("../src/workouts/workoutSessionStore.ts");
hooks.deregister();

const prefix = "keys2fitness:workout-session:";
const workout = { id: "today", status: "current", title: "Upper Body", exercises: [] };
const exercise = { id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: false };
const paused = (workoutId = "today") => ({
  workoutId, exercises: [initializeSetPerformance(exercise)], paused: true,
  timer: { status: "paused", elapsedMs: 65000, runningSince: null },
});

function fixture() {
  const entries = new Map();
  const storage = {
    async getItem(key) { return entries.get(key) ?? null; },
    async setItem(key, value) { entries.set(key, value); },
    async removeItem(key) { entries.delete(key); },
    async getAllKeys() { return [...entries.keys()]; },
  };
  return { entries, storage, store: createWorkoutSessionStore(storage) };
}

test("dashboard distinguishes unstarted, running, paused, ended, upcoming and mismatched sessions", () => {
  assert.deepEqual(getWorkoutCardLabels(workout, null), { continuing: false, status: "Today's workout", action: "View workout" });
  for (const status of ["running", "paused"]) {
    const session = { ...paused(), timer: { status, elapsedMs: 10, runningSince: status === "running" ? 100 : null } };
    assert.deepEqual(getWorkoutCardLabels(workout, session), { continuing: true, status: "Current workout", action: "Continue workout" });
  }
  const ended = { ...paused(), paused: false, timer: { status: "ended", elapsedMs: 10, runningSince: null } };
  assert.deepEqual(getWorkoutCardLabels(workout, ended), { continuing: false, status: "Workout ended", action: "View workout" });
  assert.equal(getWorkoutCardLabels({ ...workout, status: "upcoming" }, null).status, "Upcoming workout");
  assert.equal(getWorkoutCardLabels(workout, paused("other")).continuing, false);
  assert.equal(isWorkoutInProgress({ ...paused(), timer: { status: "ready", elapsedMs: 0, runningSince: null } }), false);
});

test("real storage round-trip preserves edited values, completion, set IDs and time across a new store", async () => {
  const { storage, store } = fixture();
  const session = paused();
  const setId = session.exercises[0].actualSets[0].id;
  session.exercises[0] = updateSetPerformance(session.exercises[0], setId, "actualWeightLb", "127.5");
  session.exercises[0] = togglePerformedSet(session.exercises[0], setId);
  await store.saveWorkoutSession(session);
  const restored = await createWorkoutSessionStore(storage).loadWorkoutSession("today");
  assert.deepEqual(restored.exercises, session.exercises);
  const resumed = transitionWorkoutTimer(restored.timer, "resume", 100000);
  assert.equal(elapsedWorkoutTime(resumed, 105000), 70000);
  assert.equal(restored.exercises[0].actualSets[0].actualWeightLb, "127.5");
  assert.equal(restored.exercises[0].actualSets[0].completed, true);
});

test("active lookup uses the latest available active workout, not an ended or missing assignment", async () => {
  const { entries, store } = fixture();
  entries.set(prefix + "today", JSON.stringify({ ...paused(), updatedAt: 10 }));
  entries.set(prefix + "other", JSON.stringify({ ...paused("other"), updatedAt: 20 }));
  entries.set(prefix + "removed", JSON.stringify({ ...paused("removed"), updatedAt: 40 }));
  entries.set(prefix + "ended", JSON.stringify({ ...paused("ended"), updatedAt: 50, paused: false,
    timer: { status: "ended", elapsedMs: 1000, runningSince: null } }));
  entries.set(prefix + "broken", "not JSON");
  entries.set("unrelated-profile", "not a workout");
  assert.equal((await store.loadActiveWorkoutSession((id) => id !== "removed")).workoutId, "other");
  await store.clearWorkoutSession("other");
  assert.equal((await store.loadActiveWorkoutSession((id) => id !== "removed")).workoutId, "today");
  await store.clearWorkoutSession("today");
  assert.equal(await store.loadActiveWorkoutSession((id) => id !== "removed"), null);
});

test("sessions saved in the same clock tick still choose the last updated workout", async () => {
  const { storage } = fixture();
  const store = createWorkoutSessionStore(storage, () => 100);
  await store.saveWorkoutSession(paused("z-first"));
  await store.saveWorkoutSession(paused("a-last"));
  assert.equal((await store.loadActiveWorkoutSession()).workoutId, "a-last");
});

test("legacy paused checkpoints remain resumable; corrupt and wrong-workout data are ignored", () => {
  const legacy = { workoutId: "today", exercises: [exercise], paused: true };
  assert.equal(isWorkoutInProgress(parseWorkoutSession(JSON.stringify(legacy), "today")), true);
  assert.equal(parseWorkoutSession(JSON.stringify(legacy), "other"), null);
  for (const value of [null, "{", "null", "{}", JSON.stringify({ ...paused(), exercises: [{ id: "bad", completed: true }] }),
    JSON.stringify({ ...paused(), timer: { status: "paused", elapsedMs: -10, runningSince: null } })]) {
    assert.equal(parseWorkoutSession(value, "today"), null);
  }
});

test("dashboard reads wait for queued edits and Pause cannot be overwritten by a delayed earlier save", async () => {
  const { storage } = fixture();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const originalSave = storage.setItem;
  let calls = 0;
  storage.setItem = async (...args) => { if (++calls === 1) await gate; return originalSave(...args); };
  const store = createWorkoutSessionStore(storage);
  const running = { ...paused(), paused: false, timer: { status: "running", elapsedMs: 65000, runningSince: 100000 } };
  const firstSave = store.saveWorkoutSession(running);
  const nextSave = store.saveWorkoutSession(paused());
  const read = store.loadActiveWorkoutSession();
  let resolved = false;
  read.then(() => { resolved = true; });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(resolved, false);
  release();
  await Promise.all([firstSave, nextSave]);
  assert.equal((await read).timer.status, "paused");
});

test("queued writes capture their values immediately and recover after storage errors", async () => {
  const { storage } = fixture();
  const store = createWorkoutSessionStore(storage);
  const session = paused();
  const save = store.saveWorkoutSession(session);
  session.exercises[0].name = "Changed after saving";
  await save;
  assert.equal((await store.loadWorkoutSession("today")).exercises[0].name, "Bench Press");
  const original = storage.setItem;
  storage.setItem = async () => { throw new Error("Disk unavailable"); };
  await assert.rejects(store.saveWorkoutSession(paused()), /Disk unavailable/);
  storage.setItem = original;
  await store.saveWorkoutSession(paused("other"));
  assert.equal((await store.loadWorkoutSession("other")).workoutId, "other");
  storage.getAllKeys = async () => { throw new Error("Read unavailable"); };
  await assert.rejects(store.loadActiveWorkoutSession(), /Read unavailable/);
});
