import assert from "node:assert/strict";
import test from "node:test";
import { libraryData, memoryStorage, registerWorkoutTypes, workoutDraft } from "./helpers/workout-test-support.mjs";

registerWorkoutTypes();
const { findWorkoutLibraryItem, searchWorkoutLibrary } = await import("../src/workouts/workoutLibraryBrowse.ts");
const { createWorkoutLibraryRepository } = await import("../src/workouts/workoutLibraryRepository.ts");
const { createWorkoutLibraryService } = await import("../src/workouts/workoutLibraryService.ts");

const clientNames = new Map([["2", "Alex Morgan"], ["3", "Jordan Rivera"]]);

function fixture() {
  const { storage } = memoryStorage();
  const open = () => createWorkoutLibraryRepository(storage, libraryData());
  const repository = open();
  let id = 0;
  let day = 1;
  const library = createWorkoutLibraryService(repository, {
    clients: { listClientIds: async () => [...clientNames.keys()] },
    getAuthorName: () => "Coach", makeId: (prefix) => `${prefix}-${++id}`,
    now: () => new Date(Date.UTC(2026, 10, day++)).toISOString(),
  });
  return { library, repository, open };
}

test("library search finds reusable plans and assigned copies by name or exercise, and assignments by client", async () => {
  const { library, repository } = fixture();
  const draft = workoutDraft();
  const saved = await library.saveWorkout({ draft, reusable: true, clientIds: ["2", "3"] });
  const data = repository.getState().data;
  for (const query of [draft.title, "  bEnCh PrEsS "]) {
    const results = searchWorkoutLibrary(data, query, clientNames);
    assert.deepEqual(results.templates.map((template) => template.id), [saved.templateId]);
    assert.deepEqual(results.workouts.map(({ assignment }) => assignment.id), saved.assignments.map(({ id }) => id));
  }
  const alex = searchWorkoutLibrary(data, "alex morgan", clientNames);
  assert.deepEqual(alex.templates, []);
  assert.deepEqual(alex.workouts.map(({ assignment }) => assignment.id), [saved.assignments[0].id]);
  assert.deepEqual(searchWorkoutLibrary(data, "not a saved plan", clientNames), { templates: [], workouts: [] });
});

test("library opens the exact same-name workout copy even after editing and deleting the template", async () => {
  const { library, repository, open } = fixture();
  const draft = workoutDraft();
  const { templateId, assignments: [earlier] } = await library.saveWorkout({ draft, reusable: true, clientIds: ["2"] });
  const updated = { ...draft, exercises: [{ ...draft.exercises[0], weightLb: "0", restSeconds: "0" }] };
  const { assignments: [later] } = await library.saveWorkout({ draft: updated, reusable: true, existingTemplateId: templateId, clientIds: ["2"] });
  const data = repository.getState().data;
  assert.equal(findWorkoutLibraryItem(data, "template", templateId).template.exercises[0].weightLb, 0);
  assert.equal(findWorkoutLibraryItem(data, "workout", templateId), null);
  assert.equal(findWorkoutLibraryItem(data, "template", later.id), null);
  assert.equal(findWorkoutLibraryItem(data, "other", later.id), null);
  await library.deleteTemplate(templateId);

  const reopened = open();
  await reopened.load();
  const restored = reopened.getState().data;
  const results = searchWorkoutLibrary(restored, draft.title, clientNames);
  assert.deepEqual(results.templates, []);
  assert.deepEqual(results.workouts.map(({ assignment }) => assignment.id), [later.id, earlier.id]);
  assert.equal(findWorkoutLibraryItem(restored, "template", templateId), null);
  assert.deepEqual(findWorkoutLibraryItem(restored, "workout", earlier.id).workout, earlier.workout);
  const selected = findWorkoutLibraryItem(restored, "workout", later.id);
  assert.equal(selected.assignment.assignedAt, later.assignedAt);
  assert.equal(selected.workout.exercises[0].weight, "Bodyweight");
  assert.equal(selected.workout.exercises[0].restSeconds, 0);
});

test("a genuinely empty library has no results, but a one-off workout needs no saved template or client name", async () => {
  const { library, repository } = fixture();
  assert.deepEqual(searchWorkoutLibrary(repository.getState().data, "", clientNames), { templates: [], workouts: [] });
  const { assignments: [oneOff] } = await library.saveWorkout({ draft: workoutDraft(), reusable: false, clientIds: ["3"] });
  const data = repository.getState().data;
  const results = searchWorkoutLibrary(data, oneOff.workout.title, new Map());
  assert.deepEqual(results.templates, []);
  assert.deepEqual(results.workouts.map(({ workout }) => workout), [oneOff.workout]);
  assert.equal(findWorkoutLibraryItem(data, "workout", oneOff.id).assignment.clientId, "3");
});
