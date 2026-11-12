// Only the local workout namespace belongs to these smoke fixtures. Auth,
// profiles, messages and Firebase data must never be captured or reset here.
export function isWorkoutStorageKey(key) {
  return typeof key === "string" && (key === "keys2fitness:workout-library:v1" || key.startsWith("keys2fitness:workout-session:"));
}

export async function captureWorkoutStorage(storage) {
  const keys = (await storage.getAllKeys()).filter(isWorkoutStorageKey).sort();
  const snapshot = await Promise.all(keys.map(async (key) => [key, await storage.getItem(key)]));
  if (snapshot.some(([, value]) => typeof value !== "string")) throw new Error("Workout storage changed during capture. Run smoke tests exclusively on one emulator.");
  return snapshot;
}

export async function restoreWorkoutStorage(storage, snapshot) {
  if (!Array.isArray(snapshot) || snapshot.some((row) => !Array.isArray(row) || row.length !== 2 ||
      !isWorkoutStorageKey(row[0]) || typeof row[1] !== "string") || new Set(snapshot.map(([key]) => key)).size !== snapshot.length) {
    throw new Error("Invalid workout-only smoke backup; nothing was changed.");
  }
  const baseline = new Map(snapshot);
  // Restore original values before deleting new fixtures. Retrying after a
  // partial storage failure is safe, including when the original library was absent.
  for (const [key, value] of baseline) {
    if (await storage.getItem(key) !== value) await storage.setItem(key, value);
  }
  const extras = (await storage.getAllKeys()).filter((key) => isWorkoutStorageKey(key) && !baseline.has(key));
  for (const key of extras) await storage.removeItem(key);
  const restored = await captureWorkoutStorage(storage);
  const expected = [...baseline].sort(([a], [b]) => a.localeCompare(b));
  // Compare both arrays using the same key ordering.
  restored.sort(([a], [b]) => a.localeCompare(b));
  if (JSON.stringify(restored) !== JSON.stringify(expected)) throw new Error("Workout cleanup did not restore the backup. Retry cleanup with the saved backup.");
  return { restored: baseline.size, removed: extras.length };
}
