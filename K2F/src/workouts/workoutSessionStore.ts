import { decodeWorkoutSession, encodeWorkoutSession, normalizeWorkoutSession } from "./workoutMigrations";
import { isWorkoutInProgress, type WorkoutSession } from "./workoutSessionModel";
import type { WorkoutSessionRepository } from "./workoutRepositories";
import { createStorageQueue, type SessionKeyValueStorage } from "./workoutStorage";

export type { WorkoutSession } from "./workoutSessionModel";
export { getWorkoutCardLabels, isWorkoutInProgress } from "./workoutSessionModel";
export { parseWorkoutSession } from "./workoutMigrations";

export const workoutSessionPrefix = "keys2fitness:workout-session:";

// Local adapter for the domain repository port. Storage details and migrations
// remain here; timer transitions and resume behavior live in the session service.
export function createWorkoutSessionStore(storage: SessionKeyValueStorage, now = Date.now): WorkoutSessionRepository {
  const queue = createStorageQueue();
  let lastUpdatedAt = 0;

  async function readSession(workoutId: string): Promise<WorkoutSession | null> {
    const raw = await storage.getItem(workoutSessionPrefix + workoutId);
    if (raw === null) return null;
    const decoded = decodeWorkoutSession(raw, workoutId);
    if (decoded.migrated) await storage.setItem(workoutSessionPrefix + workoutId, encodeWorkoutSession(decoded.data));
    lastUpdatedAt = Math.max(lastUpdatedAt, decoded.data.updatedAt ?? 0);
    return decoded.data;
  }

  async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
    const snapshot = JSON.stringify(normalizeWorkoutSession(session, session.workoutId));
    await queue.run(async () => {
      const data: WorkoutSession = JSON.parse(snapshot);
      lastUpdatedAt = Math.max(now(), lastUpdatedAt + 1, (data.updatedAt ?? 0) + 1);
      await storage.setItem(workoutSessionPrefix + session.workoutId, encodeWorkoutSession({ ...data, updatedAt: lastUpdatedAt }));
    });
  }

  async function loadActiveWorkoutSession(isAvailable: (id: string) => boolean = () => true): Promise<WorkoutSession | null> {
    return queue.run(async () => {
      const keys = (await storage.getAllKeys()).filter((key) => key.startsWith(workoutSessionPrefix));
      const sessions: WorkoutSession[] = [];
      for (const key of keys) {
        const id = key.slice(workoutSessionPrefix.length);
        if (!isAvailable(id)) continue;
        const raw = await storage.getItem(key);
        if (raw === null) continue;
        // Invalid unrelated records do not suppress valid sessions. I/O failures
        // still propagate so the dashboard can offer a retry.
        let decoded;
        try { decoded = decodeWorkoutSession(raw, id); } catch { continue; }
        if (decoded.migrated) await storage.setItem(key, encodeWorkoutSession(decoded.data));
        lastUpdatedAt = Math.max(lastUpdatedAt, decoded.data.updatedAt ?? 0);
        if (isWorkoutInProgress(decoded.data)) sessions.push(decoded.data);
      }
      return sessions.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.workoutId.localeCompare(b.workoutId))[0] ?? null;
    });
  }

  return { saveWorkoutSession, loadActiveWorkoutSession,
    loadWorkoutSession: (id) => queue.run(() => readSession(id)),
    clearWorkoutSession: async (id) => { await queue.run(() => storage.removeItem(workoutSessionPrefix + id)); },
  };
}
