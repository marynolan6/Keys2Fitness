import { assignmentFromTemplate, draftFromTemplate, parseWorkoutLibrary, templateFromDraft } from "./workoutLibraryModel";
import type { WorkoutDraft, WorkoutLibraryData } from "./workoutLibraryModel";

export const workoutLibraryKey = "keys2fitness:workout-library:v1";
export type WorkoutLibraryState = { status: "loading" | "ready" | "error"; data: WorkoutLibraryData; error: string };
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown> };

export function createWorkoutLibraryRepository(storage: Storage, initialData: WorkoutLibraryData,
  makeId: (prefix: string) => string, now = () => new Date().toISOString()) {
  let state: WorkoutLibraryState = { status: "loading", data: initialData, error: "" };
  let loading: Promise<void> | null = null;
  let writes: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  const publish = (next: WorkoutLibraryState) => { state = next; listeners.forEach((listener) => listener()); };

  async function load(): Promise<void> {
    if (state.status === "ready") return;
    if (loading) return loading;
    publish({ ...state, status: "loading", error: "" });
    loading = (async () => {
      try {
        const raw = await storage.getItem(workoutLibraryKey);
        publish({ status: "ready", data: raw === null ? initialData : parseWorkoutLibrary(raw), error: "" });
      } catch (error) {
        publish({ ...state, status: "error", error: error instanceof Error ? error.message : "Your library could not be loaded." });
      }
    })();
    await loading;
    loading = null;
  }

  async function mutate<T>(operation: (data: WorkoutLibraryData) => { data: WorkoutLibraryData; result: T }): Promise<T> {
    await load();
    const result = writes.then(async () => {
      if (state.status !== "ready") throw new Error(state.error || "Your workout library is still loading.");
      const next = operation(state.data);
      await storage.setItem(workoutLibraryKey, JSON.stringify(next.data));
      publish({ status: "ready", data: next.data, error: "" });
      return next.result;
    });
    writes = result.catch(() => undefined);
    return result;
  }

  function checkClients(ids: readonly string[], availableIds: readonly string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) throw new Error("Select at least one client.");
    if (unique.some((id) => !availableIds.includes(id))) throw new Error("A selected client is no longer available. Select clients again.");
    return unique;
  }

  async function saveWorkout(draft: WorkoutDraft, selectedIds: readonly string[], availableIds: readonly string[], author: string,
    reusable = true, existingId?: string) {
    // Capture the draft immediately, independently of subsequent text edits.
    const template = templateFromDraft(draft, reusable && existingId ? existingId : makeId("template"), now());
    const clients = selectedIds.length ? checkClients(selectedIds, availableIds) : [];
    if (!reusable && clients.length === 0) throw new Error("Select clients or save this workout as a reusable template.");
    return mutate((data) => {
      if (reusable && existingId && !data.templates.some((item) => item.id === existingId)) throw new Error("This template is no longer available.");
      const assignments = clients.map((id) => assignmentFromTemplate(template, id, makeId("assigned"), now(), author));
      return { data: { ...data,
        templates: reusable ? [template, ...data.templates.filter((item) => item.id !== template.id)] : data.templates,
        assignments: [...assignments, ...data.assignments] }, result: { templateId: reusable ? template.id : null, assignments } };
    });
  }

  async function assignTemplate(templateId: string, selectedIds: readonly string[], availableIds: readonly string[], author: string) {
    const clients = checkClients(selectedIds, availableIds);
    return mutate((data) => {
      const template = data.templates.find((item) => item.id === templateId);
      if (!template) throw new Error("Select an available workout template.");
      const assignments = clients.map((id) => assignmentFromTemplate(template, id, makeId("assigned"), now(), author));
      return { data: { ...data, assignments: [...assignments, ...data.assignments] }, result: assignments };
    });
  }

  async function duplicateTemplate(id: string) {
    return mutate((data) => {
      const original = data.templates.find((item) => item.id === id);
      if (!original) throw new Error("This template is no longer available.");
      const copy = templateFromDraft({ ...draftFromTemplate(original), title: `${original.title.slice(0, 93)} (copy)` }, makeId("template"), now());
      return { data: { ...data, templates: [copy, ...data.templates] }, result: copy.id };
    });
  }

  async function deleteTemplate(id: string) {
    return mutate((data) => ({ data: { ...data, templates: data.templates.filter((item) => item.id !== id) }, result: undefined }));
  }

  async function setPreviewClient(clientId: string) {
    if (!clientId.trim()) throw new Error("Choose a demo client.");
    return mutate((data) => ({ data: { ...data, previewClientId: clientId }, result: undefined }));
  }

  return { getState: () => state, load, saveWorkout, assignTemplate, duplicateTemplate, deleteTemplate, setPreviewClient,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; } };
}
