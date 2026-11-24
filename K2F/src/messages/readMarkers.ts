import { createStorageQueue, type KeyValueStorage } from "../lib/queuedStorage";

export function createReadMarkerStore(storage: KeyValueStorage) {
  const queue = createStorageQueue();

  async function read(key: string): Promise<Set<string>> {
    const raw = await storage.getItem(key);
    if (raw === null) return new Set();
    const ids: unknown = JSON.parse(raw);
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) throw new Error("Invalid message read markers.");
    return new Set(ids);
  }

  return {
    load: (key: string) => queue.run(() => read(key)),
    markViewed: (key: string, viewed: readonly string[]) => queue.run(async () => {
      if (!viewed.length) return;
      // A quick blur can happen before the screen finishes loading its read markers.
      const ids = await read(key);
      const before = ids.size;
      for (const id of viewed) ids.add(id);
      if (ids.size !== before) await storage.setItem(key, JSON.stringify([...ids]));
    }),
  };
}
