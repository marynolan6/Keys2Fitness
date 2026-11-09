import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks } from "node:module";

const hooks = registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.includes("/src/workouts/") && specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)
    ? specifier + ".ts" : specifier, context);
} });
const { createWorkoutLibraryRepository, workoutLibraryKey } = await import("../src/workouts/workoutLibraryRepository.ts");
const { draftFromTemplate, parseWorkoutLibrary, validateWorkoutDraft } = await import("../src/workouts/workoutLibraryModel.ts");
const { resolveClientWorkout, resolveWorkoutById, canPreviewWorkout } = await import("../src/workouts/workoutAssignmentLookup.ts");
hooks.deregister();

const draft = () => ({ title: "Upper Body Strength", durationMinutes: "45", notes: "Keep a controlled tempo.", exercises: [{
  id: "bench", name: "Bench Press", sets: "3", reps: "8", weightLb: "132.5", instructions: "Keep feet planted.",
  coachNotes: "Pause briefly at the bottom.", alternative: "Push-up",
}] });
const initial = () => ({ version: 1, templates: [], assignments: [], previewClientId: "1" });

function fixture() {
  const entries = new Map();
  const storage = { async getItem(key) { return entries.get(key) ?? null; },
    async setItem(key, value) { entries.set(key, value); } };
  let sequence = 0;
  const create = () => createWorkoutLibraryRepository(storage, initial(), (prefix) => `${prefix}-${++sequence}`, () => "2026-11-08T12:00:00.000Z");
  return { entries, storage, create, repo: create() };
}

test("workout validation supports decimal pounds/bodyweight and rejects missing or invalid prescriptions", () => {
  assert.deepEqual(validateWorkoutDraft(draft()), {});
  const bodyweight = draft(); bodyweight.exercises[0].weightLb = "0";
  assert.deepEqual(validateWorkoutDraft(bodyweight), {});
  for (const [field, value] of [["sets", "0"], ["sets", "1.5"], ["reps", ""], ["reps", "-1"], ["weightLb", "-5"], ["weightLb", "NaN"]]) {
    const invalid = draft(); invalid.exercises[0][field] = value;
    assert.ok(validateWorkoutDraft(invalid)["bench." + field]);
  }
  assert.ok(validateWorkoutDraft({ ...draft(), title: " " }).title);
  assert.ok(validateWorkoutDraft({ ...draft(), durationMinutes: "0" }).durationMinutes);
  assert.ok(validateWorkoutDraft({ ...draft(), exercises: [] }).exercises);
});

test("saving and assigning to multiple clients persists independent workout snapshots with notes", async () => {
  const { repo, create } = fixture();
  const result = await repo.saveWorkout(draft(), ["1", "2", "2"], ["1", "2"], "Coach Sam");
  assert.equal(result.assignments.length, 2);
  const [first, second] = result.assignments;
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.workout.exercises[0].id, second.workout.exercises[0].id);
  assert.equal(first.workout.notes, "Keep a controlled tempo.");
  assert.equal(first.workout.notesAuthor, "Coach Sam");
  assert.equal(first.workout.notesUpdatedAt, "2026-11-08");
  assert.equal(first.workout.exercises[0].coachNotes, "Pause briefly at the bottom.");
  assert.equal(first.workout.exercises[0].alternative, "Push-up");
  assert.equal(first.workout.exercises[0].weight, "132.5 lb");
  assert.equal(first.workout.exercises[0].completed, false);
  assert.equal(first.workout.exercises[0].actualSets, undefined);
  const restarted = create(); await restarted.load();
  assert.deepEqual(restarted.getState().data, JSON.parse(JSON.stringify(repo.getState().data)));
});

test("optional duration and notes stay absent in a bodyweight assignment", async () => {
  const { repo } = fixture();
  const optional = draft(); optional.notes = " "; optional.durationMinutes = "";
  optional.exercises[0].weightLb = "0"; optional.exercises[0].coachNotes = "";
  delete optional.exercises[0].alternative;
  const result = await repo.saveWorkout(optional, ["1"], ["1"], "Coach");
  const workout = result.assignments[0].workout;
  assert.equal(workout.notes, undefined);
  assert.equal(workout.notesAuthor, undefined);
  assert.equal(workout.durationMinutes, undefined);
  assert.equal(workout.exercises[0].coachNotes, undefined);
  assert.equal(workout.exercises[0].alternative, undefined);
  assert.equal(workout.exercises[0].weight, "Bodyweight");
});

test("editing and deleting templates preserve already assigned notes, prescriptions and lookup IDs", async () => {
  const { repo } = fixture();
  const result = await repo.saveWorkout(draft(), ["2"], ["1", "2"], "Coach Sam");
  const assigned = JSON.parse(JSON.stringify(result.assignments[0]));
  const edited = draft(); edited.title = "Updated plan"; edited.notes = "Different note"; edited.exercises[0].weightLb = "150";
  await repo.saveWorkout(edited, [], [], "Coach Sam", true, result.templateId);
  assert.deepEqual(repo.getState().data.assignments[0], assigned);
  await repo.deleteTemplate(result.templateId);
  assert.equal(repo.getState().data.templates.length, 0);
  assert.deepEqual(resolveWorkoutById(repo.getState().data, assigned.id, () => undefined), assigned.workout);
  assert.equal(parseWorkoutLibrary(JSON.stringify(repo.getState().data)).assignments.length, 1);
});

test("duplicate is independently editable; assignment-only drafts do not create reusable templates", async () => {
  const { repo } = fixture();
  const saved = await repo.saveWorkout(draft(), [], [], "Coach");
  const copiedId = await repo.duplicateTemplate(saved.templateId);
  const copy = repo.getState().data.templates.find((template) => template.id === copiedId);
  const edited = draftFromTemplate(copy); edited.exercises[0].reps = "12";
  await repo.saveWorkout(edited, [], [], "Coach", true, copiedId);
  assert.equal(repo.getState().data.templates.find((template) => template.id === saved.templateId).exercises[0].reps, 8);
  assert.equal(repo.getState().data.templates.length, 2);
  await repo.saveWorkout(draft(), ["2"], ["2"], "Coach", false);
  assert.equal(repo.getState().data.templates.length, 2);
  assert.equal(repo.getState().data.assignments.length, 1);
});

test("client preview isolation and latest assignment work while preserving earlier session lookups", async () => {
  const { repo, create } = fixture();
  const first = await repo.saveWorkout(draft(), ["1"], ["1", "2"], "Coach");
  const second = await repo.assignTemplate(first.templateId, ["2"], ["1", "2"], "Coach");
  const replacement = await repo.assignTemplate(first.templateId, ["1"], ["1", "2"], "Coach");
  await repo.setPreviewClient("2");
  const data = repo.getState().data;
  assert.equal(resolveClientWorkout(data, "1", null).id, replacement[0].id);
  assert.equal(resolveClientWorkout(data, "2", null).id, second[0].id);
  assert.equal(resolveClientWorkout(data, "3", null), null);
  assert.equal(canPreviewWorkout(data, second[0].id, "1", () => undefined), false);
  assert.equal(canPreviewWorkout(data, second[0].id, "2", () => undefined), true);
  assert.equal(resolveWorkoutById(data, first.assignments[0].id, () => undefined).id, first.assignments[0].id);
  const restarted = create(); await restarted.load();
  assert.equal(restarted.getState().data.previewClientId, "2");
});

test("invalid assignment selections, missing templates and malformed stored data do not overwrite saved work", async () => {
  const { repo, entries, create } = fixture();
  await assert.rejects(repo.saveWorkout(draft(), ["unknown"], ["1"], "Coach"), /no longer available/);
  await assert.rejects(repo.saveWorkout(draft(), [], [], "Coach", false), /Select clients/);
  await assert.rejects(repo.assignTemplate("missing", ["1"], ["1"], "Coach"), /available workout template/);
  entries.set(workoutLibraryKey, "broken JSON");
  const broken = create(); await broken.load();
  assert.equal(broken.getState().status, "error");
  await assert.rejects(broken.saveWorkout(draft(), [], [], "Coach"));
  assert.equal(entries.get(workoutLibraryKey), "broken JSON");
});

test("failed writes publish no false success and later saves recover without lost concurrent updates", async () => {
  const { repo, storage } = fixture();
  await repo.load();
  const before = repo.getState();
  const write = storage.setItem;
  storage.setItem = async () => { throw new Error("Disk full"); };
  await assert.rejects(repo.saveWorkout(draft(), ["1"], ["1"], "Coach"), /Disk full/);
  assert.equal(repo.getState(), before);
  storage.setItem = write;
  await Promise.all([repo.saveWorkout(draft(), ["1"], ["1", "2"], "Coach"),
    repo.saveWorkout({ ...draft(), title: "Second" }, ["2"], ["1", "2"], "Coach")]);
  assert.equal(repo.getState().data.templates.length, 2);
  assert.equal(repo.getState().data.assignments.length, 2);
});
