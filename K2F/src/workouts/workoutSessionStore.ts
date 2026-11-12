import { decodeWorkoutSessionRecord, encodeWorkoutSession, normalizeWorkoutSession, type WorkoutSessionRecord } from "./workoutMigrations";
import { isWorkoutInProgress, type WorkoutHistoryEntry, type WorkoutSession } from "./workoutSessionModel";
import type { WorkoutSessionRepository } from "./workoutRepositories";
import { createStorageQueue, type SessionKeyValueStorage } from "./workoutStorage";

export type { WorkoutSession } from "./workoutSessionModel";
export { getWorkoutCardLabels, isWorkoutInProgress } from "./workoutSessionModel";
export { parseWorkoutSession } from "./workoutMigrations";

export const workoutSessionPrefix = "keys2fitness:workout-session:";

export function createWorkoutSessionStore(storage: SessionKeyValueStorage, now = Date.now): WorkoutSessionRepository {
  const queue = createStorageQueue();
  let lastUpdatedAt = 0;

  async function readRecord(workoutId: string): Promise<WorkoutSessionRecord> {
    const raw = await storage.getItem(workoutSessionPrefix + workoutId);
    if (raw === null) return { data: null, history: [] };
    const decoded = decodeWorkoutSessionRecord(raw, workoutId);
    if (decoded.migrated) await storage.setItem(workoutSessionPrefix + workoutId, encodeWorkoutSession(decoded.data, decoded.history));
    lastUpdatedAt = Math.max(lastUpdatedAt, decoded.data?.updatedAt ?? 0);
    return decoded;
  }

  async function writeRecord(data: WorkoutSession | null, history: WorkoutHistoryEntry[], workoutId: string) {
    lastUpdatedAt = Math.max(now(), lastUpdatedAt + 1, (data?.updatedAt ?? 0) + 1);
    const next = data ? { ...data, updatedAt: lastUpdatedAt } : null;
    await storage.setItem(workoutSessionPrefix + workoutId, encodeWorkoutSession(next, history));
    return next;
  }

  async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
    const snapshot = JSON.stringify(normalizeWorkoutSession(session, session.workoutId));
    await queue.run(async () => {
      const data: WorkoutSession = JSON.parse(snapshot);
      const record = await readRecord(data.workoutId);
      // A late autosave cannot reopen an attempt already finalized in history.
      if (data.sessionId && record.history.some((entry) => entry.id === data.sessionId)) return;
      await writeRecord(data, record.history, data.workoutId);
    });
  }

  async function finalizeWorkoutSession(entry: WorkoutHistoryEntry): Promise<WorkoutSession> {
    // Validate the entire archive before any I/O or write.
    const raw = encodeWorkoutSession(entry.session, [entry]);
    const validated = decodeWorkoutSessionRecord(raw, entry.session.workoutId).history[0];
    return queue.run(async () => {
      const record = await readRecord(validated.session.workoutId);
      const existing = record.history.find((item) => item.id === validated.id);
      if (existing) return existing.session;
      if (record.data?.sessionId && record.data.sessionId !== validated.id) throw new Error("This workout attempt is no longer current. Reopen your workout.");
      const next = await writeRecord(validated.session, [validated, ...record.history], validated.session.workoutId);
      return next!;
    });
  }

  async function listWorkoutHistory(clientId: string) {
    return queue.run(async () => {
      const keys = (await storage.getAllKeys()).filter((key) => key.startsWith(workoutSessionPrefix));
      const history: WorkoutHistoryEntry[] = [];
      // Unlike active scanning, history fails explicitly rather than reporting
      // incomplete counts when one archive cannot be read.
      for (const key of keys) history.push(...(await readRecord(key.slice(workoutSessionPrefix.length))).history.filter((entry) => entry.clientId === clientId));
      return history.sort((a, b) => b.session.finishedAt - a.session.finishedAt || a.id.localeCompare(b.id));
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
        let decoded;
        try { decoded = decodeWorkoutSessionRecord(raw, id); } catch { continue; }
        if (decoded.migrated) await storage.setItem(key, encodeWorkoutSession(decoded.data, decoded.history));
        lastUpdatedAt = Math.max(lastUpdatedAt, decoded.data?.updatedAt ?? 0);
        if (isWorkoutInProgress(decoded.data)) sessions.push(decoded.data!);
      }
      return sessions.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.workoutId.localeCompare(b.workoutId))[0] ?? null;
    });
  }

  return { saveWorkoutSession, finalizeWorkoutSession, listWorkoutHistory, loadActiveWorkoutSession,
    loadWorkoutSession: (id) => queue.run(async () => (await readRecord(id)).data),
    clearWorkoutSession: async (id) => { await queue.run(async () => {
      const record = await readRecord(id);
      if (record.history.length) await writeRecord(null, record.history, id);
      else await storage.removeItem(workoutSessionPrefix + id);
    }); },
  };
}
