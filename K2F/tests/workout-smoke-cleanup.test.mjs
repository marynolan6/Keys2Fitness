import assert from "node:assert/strict";
import test from "node:test";
import { captureWorkoutStorage, restoreWorkoutStorage } from "./helpers/smoke-storage.mjs";
import { memoryStorage } from "./helpers/workout-test-support.mjs";

const library = "keys2fitness:workout-library:v1";
const session = (id) => "keys2fitness:workout-session:" + id;

test("smoke backup captures only workout records, preserving their exact bytes", async () => {
  const f = memoryStorage();
  f.entries.set("firebase:auth", "private-auth");
  f.entries.set("keys2fitness:profile", "profile");
  f.entries.set(session("original"), '{ "schemaVersion": 99, "future": true }');
  f.entries.set(library, "original library bytes");
  const snapshot = await captureWorkoutStorage(f.storage);
  assert.deepEqual(snapshot, [[library, "original library bytes"], [session("original"), '{ "schemaVersion": 99, "future": true }']]);
  assert.equal(f.writes.length, 0);
});

test("cleanup removes templates/assignments/history fixtures, restores borrowed sessions and preview, and leaves other storage alone", async () => {
  const f = memoryStorage();
  const originalLibrary = JSON.stringify({ templates: ["user-template"], assignments: ["user-assignment"], previewClientId: "3" });
  f.entries.set(library, originalLibrary);
  f.entries.set(session("today"), "original recorded sets, history and running timer");
  const baseline = await captureWorkoutStorage(f.storage);
  f.entries.set(library, JSON.stringify({ templates: ["smoke-template"], assignments: ["smoke-assignment"], previewClientId: "2" }));
  f.entries.set(session("today"), "test edited these sets");
  f.entries.set(session("smoke-assignment"), "test checkpoint and immutable history");
  f.entries.set("keys2fitness:profile", "profile changed outside workout storage");
  f.entries.set("firebase:auth", "untouched auth");
  assert.deepEqual(await restoreWorkoutStorage(f.storage, baseline), { restored: 2, removed: 1 });
  assert.equal(f.entries.get(library), originalLibrary);
  assert.equal(f.entries.get(session("today")), "original recorded sets, history and running timer");
  assert.equal(f.entries.has(session("smoke-assignment")), false);
  assert.equal(f.entries.get("keys2fitness:profile"), "profile changed outside workout storage");
  assert.equal(f.entries.get("firebase:auth"), "untouched auth");
});

test("an originally absent library/checkpoint is removed rather than replaced with seeded test data", async () => {
  const f = memoryStorage();
  const baseline = await captureWorkoutStorage(f.storage);
  f.entries.set(library, "test library");
  f.entries.set(session("test"), "test history");
  assert.deepEqual(await restoreWorkoutStorage(f.storage, baseline), { restored: 0, removed: 2 });
  assert.equal(f.entries.size, 0);
});

test("cleanup is idempotent and does not rewrite unchanged original records", async () => {
  const f = memoryStorage();
  f.entries.set(library, "original");
  const baseline = await captureWorkoutStorage(f.storage);
  await restoreWorkoutStorage(f.storage, baseline);
  await restoreWorkoutStorage(f.storage, baseline);
  assert.equal(f.writes.length, 0);
  assert.deepEqual(await captureWorkoutStorage(f.storage), baseline);
});

test("malformed, duplicate or out-of-scope backup keys fail before any mutation", async () => {
  for (const invalid of [null, {}, [["firebase:auth", "oops"]], [[library, "a"], [library, "b"]], [[library, null]], [[library]]]) {
    const f = memoryStorage();
    f.entries.set(library, "original");
    await assert.rejects(restoreWorkoutStorage(f.storage, invalid), /Invalid workout-only smoke backup/);
    assert.equal(f.entries.get(library), "original");
    assert.equal(f.writes.length, 0);
  }
});

test("a failed restore write retains new fixture records until originals can be restored on retry", async () => {
  const f = memoryStorage();
  const baseline = [[library, "original"]];
  f.entries.set(library, "changed");
  f.entries.set(session("smoke"), "test");
  const setItem = f.storage.setItem;
  f.storage.setItem = async () => { throw new Error("Storage unavailable"); };
  await assert.rejects(restoreWorkoutStorage(f.storage, baseline), /Storage unavailable/);
  assert.equal(f.entries.get(session("smoke")), "test");
  f.storage.setItem = setItem;
  await restoreWorkoutStorage(f.storage, baseline);
  assert.deepEqual(await captureWorkoutStorage(f.storage), baseline);
});

test("a failed fixture deletion is reported and retry completes the same restore safely", async () => {
  const f = memoryStorage();
  f.entries.set(library, "changed");
  f.entries.set(session("smoke"), "test");
  const removeItem = f.storage.removeItem;
  f.storage.removeItem = async () => { throw new Error("Delete failed"); };
  await assert.rejects(restoreWorkoutStorage(f.storage, [[library, "original"]]), /Delete failed/);
  assert.equal(f.entries.get(library), "original");
  f.storage.removeItem = removeItem;
  await restoreWorkoutStorage(f.storage, [[library, "original"]]);
  assert.deepEqual([...f.entries], [[library, "original"]]);
});

test("a disappearing key during capture fails instead of creating an unusable backup", async () => {
  const f = memoryStorage();
  f.storage.getAllKeys = async () => [session("disappeared")];
  await assert.rejects(captureWorkoutStorage(f.storage), /changed during capture/);
});
