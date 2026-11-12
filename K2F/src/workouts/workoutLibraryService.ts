import { assignmentFromTemplate, draftFromTemplate, templateFromDraft } from "./workoutLibraryModel";
import type { ClientWorkoutAssignment, WorkoutDraft } from "./workoutLibraryModel";
import type { WorkoutClientDirectory, WorkoutLibraryRepository } from "./workoutRepositories";

export type SaveWorkoutRequest = {
  draft: WorkoutDraft;
  clientIds: readonly string[];
  reusable: boolean;
  existingTemplateId?: string;
};
export type SaveWorkoutResult = { templateId: string | null; assignments: ClientWorkoutAssignment[] };

export type WorkoutLibraryService = ReturnType<typeof createWorkoutLibraryService>;

export function createWorkoutLibraryService(repository: WorkoutLibraryRepository, dependencies: {
  clients: WorkoutClientDirectory;
  makeId: (prefix: string) => string;
  getAuthorName: () => string;
  now: () => string;
}) {
  const { clients, makeId, now, getAuthorName } = dependencies;

  async function validateClients(ids: readonly string[]) {
    const selected = [...new Set(ids)];
    if (!selected.length) throw new Error("Select at least one client.");
    const available = await clients.listClientIds();
    if (selected.some((id) => !available.includes(id))) throw new Error("A selected client is no longer available. Select clients again.");
    return selected;
  }

  async function saveWorkout(request: SaveWorkoutRequest): Promise<SaveWorkoutResult> {
    const { draft, reusable, existingTemplateId } = request;
    const template = templateFromDraft(draft, reusable && existingTemplateId ? existingTemplateId : makeId("template"), now());
    const selectedIds = [...request.clientIds];
    const author = getAuthorName();
    if (!reusable && !selectedIds.length) throw new Error("Select clients or save this workout as a reusable template.");
    const selected = selectedIds.length ? await validateClients(selectedIds) : [];
    const assignments = selected.map((id) => assignmentFromTemplate(template, id, makeId("assigned"), now(), author));
    await repository.saveWorkoutPlan({ template: reusable ? template : undefined, assignments,
      existingTemplateId: reusable ? existingTemplateId : undefined });
    return { templateId: reusable ? template.id : null, assignments };
  }

  async function assignTemplate(request: { templateId: string; clientIds: readonly string[]; expectedTemplateUpdatedAt?: string }): Promise<ClientWorkoutAssignment[]> {
    const author = getAuthorName();
    const selected = await validateClients(request.clientIds);
    const template = await repository.findTemplate(request.templateId);
    if (!template) throw new Error("Select an available workout template.");
    if (request.expectedTemplateUpdatedAt && request.expectedTemplateUpdatedAt !== template.updatedAt) {
      throw new Error("This workout changed during review. Cancel and select it again before assigning.");
    }
    // Assignment accepts finished, valid plans, never incomplete drafts.
    templateFromDraft(draftFromTemplate(template), template.id, template.updatedAt);
    const assignments = selected.map((id) => assignmentFromTemplate(template, id, makeId("assigned"), now(), author));
    await repository.saveWorkoutPlan({ assignments, existingTemplateId: template.id });
    return assignments;
  }

  async function duplicateTemplate(id: string): Promise<string> {
    const original = await repository.findTemplate(id);
    if (!original) throw new Error("This template is no longer available.");
    const copy = templateFromDraft({ ...draftFromTemplate(original), title: `${original.title.slice(0, 93)} (copy)` }, makeId("template"), now());
    await repository.saveWorkoutPlan({ template: copy, assignments: [] });
    return copy.id;
  }

  async function setPreviewClient(clientId: string): Promise<void> {
    if (!clientId.trim()) throw new Error("Choose a demo client.");
    await validateClients([clientId]);
    await repository.setPreviewClient(clientId);
  }

  return { saveWorkout, assignTemplate, duplicateTemplate, setPreviewClient,
    deleteTemplate: (id: string) => repository.deleteTemplate(id) };
}
