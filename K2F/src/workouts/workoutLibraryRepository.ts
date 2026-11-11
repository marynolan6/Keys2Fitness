import type { WorkoutLibraryData } from "./workoutLibraryModel";
import { decodeWorkoutLibrary, encodeWorkoutLibrary } from "./workoutMigrations";
import type { ObservableWorkoutLibraryRepository, SaveWorkoutPlan, WorkoutLibraryState } from "./workoutRepositories";
import { createStorageQueue, type KeyValueStorage } from "./workoutStorage";

// Retain the original key. The envelope carries its own schema version.
export const workoutLibraryKey = "keys2fitness:workout-library:v1";

export function createWorkoutLibraryRepository(storage: KeyValueStorage, initialData: WorkoutLibraryData): ObservableWorkoutLibraryRepository {
  let state: WorkoutLibraryState = { status: "loading", data: initialData, error: "" };
  let loading: Promise<void> | null = null;
  const queue = createStorageQueue();
  const listeners = new Set<() => void>();
  const publish = (next: WorkoutLibraryState) => { state = next; listeners.forEach((listener) => listener()); };

  async function load(): Promise<void> {
    if (state.status === "ready") return;
    if (loading) return loading;
    loading = queue.run(async () => {
      publish({ status: "loading", data: state.data, error: "" });
      try {
        const raw = await storage.getItem(workoutLibraryKey);
        const decoded = raw === null ? { data: initialData, migrated: false } : decodeWorkoutLibrary(raw);
        if (decoded.migrated) await storage.setItem(workoutLibraryKey, encodeWorkoutLibrary(decoded.data));
        publish({ status: "ready", data: decoded.data, error: "" });
      } catch (error) {
        publish({ status: "error", data: state.data, error: error instanceof Error ? error.message : "Your library could not be loaded." });
      }
    });
    try { await loading; } finally { loading = null; }
  }

  function requireReady(): WorkoutLibraryData {
    if (state.status !== "ready") throw new Error(state.status === "error" ? state.error : "Your workout library is still loading.");
    return state.data;
  }

  async function read<T>(select: (data: WorkoutLibraryData) => T): Promise<T> {
    await load();
    return queue.run(async () => select(requireReady()));
  }

  async function persist(update: (data: WorkoutLibraryData) => WorkoutLibraryData): Promise<void> {
    await load();
    await queue.run(async () => {
      const next = update(requireReady());
      await storage.setItem(workoutLibraryKey, encodeWorkoutLibrary(next));
      publish({ status: "ready", data: next, error: "" });
    });
  }

  async function saveWorkoutPlan(plan: SaveWorkoutPlan): Promise<void> {
    // Snapshot the command before queued I/O; callers can keep editing their drafts.
    const snapshot: SaveWorkoutPlan = JSON.parse(JSON.stringify(plan));
    await persist((data) => {
      if (snapshot.existingTemplateId && !data.templates.some((template) => template.id === snapshot.existingTemplateId)) {
        throw new Error("This template is no longer available.");
      }
      return { ...data,
        templates: snapshot.template ? [snapshot.template, ...data.templates.filter((template) => template.id !== snapshot.template!.id)] : data.templates,
        assignments: [...snapshot.assignments, ...data.assignments],
      };
    });
  }

  return {
    getState: () => state, load,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    listTemplates: () => read((data) => data.templates),
    findTemplate: (id) => read((data) => data.templates.find((template) => template.id === id) ?? null),
    listAssignments: (clientId) => read((data) => clientId === undefined ? data.assignments : data.assignments.filter((assignment) => assignment.clientId === clientId)),
    findAssignment: (id) => read((data) => data.assignments.find((assignment) => assignment.id === id) ?? null),
    getPreviewClientId: () => read((data) => data.previewClientId),
    saveWorkoutPlan,
    deleteTemplate: (id) => persist((data) => ({ ...data, templates: data.templates.filter((template) => template.id !== id) })),
    setPreviewClient: (clientId) => persist((data) => ({ ...data, previewClientId: clientId })),
  };
}
