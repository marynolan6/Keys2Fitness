import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage, libraryData, workoutDraft, legacySession } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { createWorkoutLibraryRepository, workoutLibraryKey } = await import("../src/workouts/workoutLibraryRepository.ts");
const { createWorkoutSessionStore, workoutSessionPrefix } = await import("../src/workouts/workoutSessionStore.ts");
const { templateFromDraft, assignmentFromTemplate } = await import("../src/workouts/workoutLibraryModel.ts");
const { decodeWorkoutLibrary, decodeWorkoutSession, encodeWorkoutLibrary, workoutSchemaVersion, workoutSessionSchemaVersion } = await import("../src/workouts/workoutMigrations.ts");
hooks.deregister();

test("v1 library migration preserves template, assignment, notes and preview IDs and runs only once", async () => {
  const { storage, entries, writes } = memoryStorage();
  const template = templateFromDraft(workoutDraft(), "original-template", "2026-11-08T12:00:00.000Z");
  const assignment = assignmentFromTemplate(template, "2", "original-assignment", "2026-11-08T12:01:00.000Z", "Coach Keys");
  const data = { templates: [template], assignments: [assignment], previewClientId: "2" };
  entries.set(workoutLibraryKey, JSON.stringify({ version: 1, ...data }));
  const repository = createWorkoutLibraryRepository(storage, libraryData());
  await repository.load();
  assert.deepEqual(repository.getState().data, data);
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(entries.get(workoutLibraryKey)).schemaVersion, workoutSchemaVersion);
  const restarted = createWorkoutLibraryRepository(storage, libraryData());
  await restarted.load();
  assert.deepEqual(restarted.getState().data, data);
  assert.equal(writes.length, 1);
});

test("legacy paused sessions without timers migrate without losing recorded rows or completion", async () => {
  const { storage, entries, writes } = memoryStorage();
  const original = legacySession(); delete original.timer;
  entries.set(workoutSessionPrefix + "today", JSON.stringify(original));
  const repository = createWorkoutSessionStore(storage);
  const session = await repository.loadWorkoutSession("today");
  assert.deepEqual(session.timer, { status: "paused", elapsedMs: 0, runningSince: null });
  assert.deepEqual(session.exercises, original.exercises);
  assert.equal(session.updatedAt, 100);
  assert.equal(session.paused, undefined);
  await repository.loadWorkoutSession("today");
  assert.equal(writes.length, 1);
});

test("running/ended legacy timers retain timestamps and elapsed time through migration", () => {
  for (const status of ["running", "ended"]) {
    const legacy = legacySession();
    legacy.paused = false;
    legacy.timer = { status, elapsedMs: 90000, runningSince: status === "running" ? 1000 : null };
    const decoded = decodeWorkoutSession(JSON.stringify(legacy), "today");
    assert.equal(decoded.migrated, true);
    assert.deepEqual(decoded.data.timer, legacy.timer);
    assert.equal(decoded.data.updatedAt, legacy.updatedAt);
  }
});

test("future schemas and corrupt data remain untouched and surface an error on explicit loads", async () => {
  const { storage, entries, writes } = memoryStorage();
  const futureLibrary = JSON.stringify({ schemaVersion: 999, data: libraryData() });
  entries.set(workoutLibraryKey, futureLibrary);
  const library = createWorkoutLibraryRepository(storage, libraryData());
  await library.load();
  assert.equal(library.getState().status, "error");
  assert.match(library.getState().error, /unsupported storage version/);
  assert.equal(entries.get(workoutLibraryKey), futureLibrary);
  const futureSession = JSON.stringify({ schemaVersion: 999, data: legacySession() });
  entries.set(workoutSessionPrefix + "today", futureSession);
  const sessions = createWorkoutSessionStore(storage);
  await assert.rejects(sessions.loadWorkoutSession("today"), /unsupported storage version/);
  assert.equal(await sessions.loadActiveWorkoutSession(), null);
  assert.equal(entries.get(workoutSessionPrefix + "today"), futureSession);
  assert.equal(writes.length, 0);
  assert.throws(() => decodeWorkoutLibrary("{bad JSON"));
  assert.throws(() => decodeWorkoutSession("{bad JSON", "today"));
});

test("failed migration writes preserve the original bytes and can be retried", async () => {
  const { storage, entries } = memoryStorage();
  const originalLibrary = JSON.stringify({ version: 1, ...libraryData() });
  const originalSession = JSON.stringify(legacySession());
  entries.set(workoutLibraryKey, originalLibrary);
  entries.set(workoutSessionPrefix + "today", originalSession);
  const setItem = storage.setItem;
  storage.setItem = async () => { throw new Error("Disk unavailable"); };
  const library = createWorkoutLibraryRepository(storage, libraryData());
  const sessions = createWorkoutSessionStore(storage);
  await library.load();
  await assert.rejects(sessions.loadWorkoutSession("today"), /Disk unavailable/);
  assert.equal(library.getState().status, "error");
  assert.equal(entries.get(workoutLibraryKey), originalLibrary);
  assert.equal(entries.get(workoutSessionPrefix + "today"), originalSession);
  storage.setItem = setItem;
  await library.load();
  assert.equal(library.getState().status, "ready");
  assert.equal((await sessions.loadWorkoutSession("today")).exercises[0].actualSets[0].actualWeightLb, "127.5");
});

test("a migration racing with a new checkpoint cannot overwrite the newer progress", async () => {
  const { storage, entries } = memoryStorage();
  entries.set(workoutSessionPrefix + "today", JSON.stringify(legacySession()));
  const getItem = storage.getItem;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  storage.getItem = async (key) => { await gate; return getItem(key); };
  const repository = createWorkoutSessionStore(storage, () => 1000);
  const read = repository.loadWorkoutSession("today");
  const next = legacySession(); next.exercises[0].actualSets[0].actualWeightLb = "145";
  const save = repository.saveWorkoutSession(next);
  release();
  await read; await save;
  const restored = await repository.loadWorkoutSession("today");
  assert.equal(restored.exercises[0].actualSets[0].actualWeightLb, "145");
  assert.equal(JSON.parse(entries.get(workoutSessionPrefix + "today")).schemaVersion, workoutSessionSchemaVersion);
});

test("new library envelopes validate optional data and preserve an intentionally empty library", () => {
  const data = libraryData();
  assert.deepEqual(decodeWorkoutLibrary(encodeWorkoutLibrary(data)), { data, migrated: false });
});
