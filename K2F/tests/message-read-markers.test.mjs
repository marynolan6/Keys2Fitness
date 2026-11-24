import assert from "node:assert/strict";
import test from "node:test";
import { registerSourceTypes } from "./helpers/source-types.mjs";
import { memoryStorage } from "./helpers/workout-test-support.mjs";

const hooks = registerSourceTypes();
const { createReadMarkerStore } = await import("../src/messages/readMarkers.ts");
hooks.deregister();

test("rapid blur and refocus merge markers in order and leave other conversations alone", async () => {
  const { storage, entries, writes } = memoryStorage();
  entries.set("client-1", '["earlier"]');
  entries.set("client-2", '["private"]');
  const markers = createReadMarkerStore(storage);
  const [before, , , after] = await Promise.all([markers.load("client-1"), markers.markViewed("client-1", ["a"]),
    markers.markViewed("client-1", ["a", "b"]), markers.load("client-1")]);
  assert.deepEqual([...before], ["earlier"]);
  assert.deepEqual([...after], ["earlier", "a", "b"]);
  assert.equal(entries.get("client-2"), '["private"]');
  await markers.markViewed("client-1", ["a"]);
  assert.equal(writes.length, 2);
});

test("missing, corrupt and unreadable markers are distinct; a failed operation does not replace saved IDs", async () => {
  const { storage, entries, writes } = memoryStorage();
  const markers = createReadMarkerStore(storage);
  assert.equal((await markers.load("key")).size, 0);
  for (const raw of ["{", "{}", '["a",null]']) {
    entries.set("key", raw);
    await assert.rejects(markers.markViewed("key", ["b"]));
    assert.equal(entries.get("key"), raw);
  }
  const get = storage.getItem;
  storage.getItem = async () => { throw new Error("offline"); };
  await assert.rejects(markers.markViewed("key", ["b"]), /offline/);
  assert.equal(writes.length, 0);
  storage.getItem = get;
  entries.set("key", '["a"]');
  const put = storage.setItem;
  storage.setItem = async () => { throw new Error("disk full"); };
  await assert.rejects(markers.markViewed("key", ["b"]), /disk full/);
  assert.deepEqual([...await markers.load("key")], ["a"]);
  storage.setItem = put;
  await markers.markViewed("key", ["b"]);
  assert.deepEqual([...await markers.load("key")], ["a", "b"]);
});
