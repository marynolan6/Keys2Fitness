import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage, libraryData, workoutDraft } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { createWorkoutLibraryRepository, workoutLibraryKey } = await import("../src/workouts/workoutLibraryRepository.ts");
const { createWorkoutLibraryService } = await import("../src/workouts/workoutLibraryService.ts");
const { draftFromTemplate, validateWorkoutDraft } = await import("../src/workouts/workoutLibraryModel.ts");
const { decodeWorkoutLibrary, workoutSchemaVersion } = await import("../src/workouts/workoutMigrations.ts");
const { exerciseRecommendationReducer } = await import("../src/workouts/exerciseRecommendationReducer.ts");
const { createWorkoutEditorState, workoutEditorReducer } = await import("../src/workouts/workoutEditorReducer.ts");
const { getCoachTip } = await import("../src/workouts/coachTips.ts");
const { createWorkoutSessionStore } = await import("../src/workouts/workoutSessionStore.ts");
const { createWorkoutSessionService } = await import("../src/workouts/workoutSessionService.ts");
hooks.deregister();

function fixture() {
  const memory = memoryStorage();
  let sequence = 0;
  const create = () => {
    const repo = createWorkoutLibraryRepository(memory.storage, libraryData());
    const service = createWorkoutLibraryService(repo, {
      clients: { async listClientIds() { return ["1", "2"]; } }, getAuthorName: () => "Coach",
      makeId: (prefix) => `${prefix}-${++sequence}`, now: () => "2026-11-12T12:00:00.000Z",
    });
    return { repo, service };
  };
  return { ...memory, ...create(), create };
}

async function assigned(f) {
  const draft = workoutDraft();
  draft.exercises[0].restSeconds = "90";
  draft.exercises.push({ ...draft.exercises[0], id: "second-bench", coachNotes: "Other exercise note" });
  return f.service.saveWorkout({ draft, reusable: true, clientIds: ["1", "2"] });
}
const scope = (assignment, index = 0) => ({ clientId: assignment.clientId, assignmentId: assignment.id, exerciseId: assignment.workout.exercises[index].id });
const save = (f, target, recommendation, expectedRecommendation = undefined) => f.service.saveExerciseRecommendation({ ...target, recommendation, expectedRecommendation });

test("prescription validation identifies the exact row and supports optional weight/rest/instructions and explicit zero", () => {
  const draft = workoutDraft();
  for (const restSeconds of ["-1", "1.5", "NaN", "3601", "Infinity"]) {
    draft.exercises[0].restSeconds = restSeconds;
    assert.ok(validateWorkoutDraft(draft)["bench.restSeconds"]);
  }
  for (const restSeconds of [undefined, "", "0", "90", "3600"]) {
    draft.exercises[0].restSeconds = restSeconds;
    assert.deepEqual(validateWorkoutDraft(draft), {});
  }
  Object.assign(draft.exercises[0], { weightLb: "", restSeconds: "", instructions: "", coachNotes: "" });
  assert.deepEqual(validateWorkoutDraft(draft), {});
  for (const [field, value] of [["sets", "0"], ["reps", "2.5"], ["weightLb", "-1"]]) {
    const invalid = structuredClone(draft); invalid.exercises[0][field] = value;
    assert.ok(validateWorkoutDraft(invalid)[`bench.${field}`]);
  }
  const state = { ...createWorkoutEditorState({ availableClientIds: [] }), draft,
    errors: { "bench.restSeconds": "Invalid rest", "other.reps": "Invalid other row" } };
  const edited = workoutEditorReducer(state, { type: "exercise-changed", id: "bench", update: { restSeconds: "90" } });
  assert.equal(edited.errors["bench.restSeconds"], undefined);
  assert.equal(edited.errors["other.reps"], "Invalid other row");
});

test("all prescription fields reload on the correct row; editing and clearing optional fields preserve unrelated rows and assigned copies", async () => {
  const f = fixture();
  const result = await assigned(f);
  const before = structuredClone(f.repo.getState().data.assignments);
  const draft = draftFromTemplate(await f.repo.findTemplate(result.templateId));
  const second = structuredClone(draft.exercises[1]);
  Object.assign(draft.exercises[0], { sets: "4", reps: "12", weightLb: "142.5", restSeconds: "120", instructions: "New reusable instructions" });
  await f.service.saveWorkout({ draft, reusable: true, clientIds: [], existingTemplateId: result.templateId });
  let restarted = f.create();
  let reopened = draftFromTemplate(await restarted.repo.findTemplate(result.templateId));
  assert.deepEqual(reopened.exercises[0], draft.exercises[0]);
  assert.deepEqual(reopened.exercises[1], second);
  assert.deepEqual(await restarted.repo.listAssignments(), before);
  Object.assign(reopened.exercises[0], { weightLb: "", restSeconds: "", instructions: "" });
  await restarted.service.saveWorkout({ draft: reopened, reusable: true, clientIds: [], existingTemplateId: result.templateId });
  restarted = f.create();
  reopened = draftFromTemplate(await restarted.repo.findTemplate(result.templateId));
  assert.equal(reopened.exercises[0].weightLb, "");
  assert.equal(reopened.exercises[0].restSeconds, undefined);
  assert.equal(reopened.exercises[0].instructions, "");
  assert.deepEqual(reopened.exercises[1], second);
});

test("recommendations are scoped to client, assigned workout and exercise, independent of template prescriptions and recorded performance", async () => {
  const f = fixture();
  const { templateId, assignments: [a, b] } = await assigned(f);
  const [another] = await f.service.assignTemplate({ templateId, clientIds: ["1"] });
  const before = structuredClone(f.repo.getState().data);
  const sessions = createWorkoutSessionStore(f.storage, () => 1000);
  const training = createWorkoutSessionService(sessions, () => 1000);
  const running = await training.changeSession(a.workout, await training.openWorkout(a.workout), "start");
  Object.assign(running.exercises[0].actualSets[0], { actualReps: "7", actualWeightLb: "127.5", completed: true });
  await training.checkpoint(running);
  const detail = await f.service.openExerciseRecommendation(scope(a));
  assert.equal(detail.recommendation, a.workout.exercises[0].coachNotes);
  await save(f, scope(a), "Spencer only recommendation");
  const restarted = f.create();
  const updated = await restarted.service.openExerciseRecommendation(scope(a));
  assert.equal(updated.recommendation, "Spencer only recommendation");
  assert.equal((await restarted.service.openExerciseRecommendation(scope(b))).recommendation, b.workout.exercises[0].coachNotes);
  assert.equal((await restarted.service.openExerciseRecommendation(scope(another))).recommendation, another.workout.exercises[0].coachNotes);
  assert.equal((await restarted.service.openExerciseRecommendation(scope(a, 1))).recommendation, "Other exercise note");
  assert.deepEqual(await restarted.repo.findTemplate(templateId), before.templates[0]);
  const expected = structuredClone(before.assignments);
  expected.find((item) => item.id === a.id).workout.exercises[0].recommendation = updated.recommendation;
  assert.deepEqual(await restarted.repo.listAssignments(), expected);
  assert.deepEqual((await sessions.loadWorkoutSession(a.id)).exercises, running.exercises);
  assert.equal(getCoachTip(restarted.repo.getState().data, "1", running.exercises[0]), updated.recommendation);
});

test("explicitly clearing a recommendation suppresses the legacy demo/default fallback after reopening", async () => {
  const f = fixture();
  const { assignments: [a] } = await assigned(f);
  await save(f, scope(a), "   ");
  const restarted = f.create();
  const detail = await restarted.service.openExerciseRecommendation(scope(a));
  assert.equal(detail.recommendation, "");
  assert.equal(detail.exercise.recommendation, "");
  assert.equal(getCoachTip(restarted.repo.getState().data, a.clientId, detail.exercise), null);
  assert.equal(detail.exercise.coachNotes, a.workout.exercises[0].coachNotes);
});

test("invalid/mismatched client, workout and exercise scopes cannot read or write another recommendation", async () => {
  const f = fixture();
  const { assignments: [a, b] } = await assigned(f);
  const before = f.entries.get(workoutLibraryKey);
  for (const target of [{ ...scope(a), clientId: "2" }, { ...scope(a), clientId: "missing" },
    { ...scope(a), assignmentId: "missing" }, { ...scope(a), exerciseId: b.workout.exercises[0].id }]) {
    await assert.rejects(f.service.openExerciseRecommendation(target), /no longer available/);
    await assert.rejects(save(f, target, "Wrong client"), /no longer available/);
  }
  assert.equal(f.entries.get(workoutLibraryKey), before);
});

test("failed recommendation write preserves draft and existing data; retry updates only the intended row", async () => {
  const f = fixture();
  const { assignments: [a] } = await assigned(f);
  const details = await f.service.openExerciseRecommendation(scope(a));
  let state = exerciseRecommendationReducer({ status: "loading" }, { type: "loaded", details });
  state = exerciseRecommendationReducer(state, { type: "changed", value: "Retry this recommendation" });
  const before = f.entries.get(workoutLibraryKey);
  const write = f.storage.setItem;
  f.storage.setItem = async () => { throw new Error("Disk full"); };
  state = exerciseRecommendationReducer(state, { type: "saving" });
  try { await save(f, scope(a), state.draft); }
  catch (error) { state = exerciseRecommendationReducer(state, { type: "failed", error: error.message }); }
  assert.equal(state.status, "editing");
  assert.equal(state.draft, "Retry this recommendation");
  assert.equal(state.error, "Disk full");
  assert.equal(f.entries.get(workoutLibraryKey), before);
  assert.equal((await f.repo.findAssignment(a.id)).workout.exercises[0].recommendation, undefined);
  f.storage.setItem = write;
  await save(f, scope(a), state.draft);
  assert.equal((await f.service.openExerciseRecommendation(scope(a))).recommendation, state.draft);
});

test("concurrent edits merge different rows and reject stale writes to the same recommendation", async () => {
  const f = fixture();
  const { assignments: [a] } = await assigned(f);
  await Promise.all([save(f, scope(a), "First row"), save(f, scope(a, 1), "Second row")]);
  await assert.rejects(save(f, scope(a), "Stale overwrite"), /recommendation changed/);
  await save(f, scope(a), "Updated first row", "First row");
  assert.equal((await f.service.openExerciseRecommendation(scope(a))).recommendation, "Updated first row");
  assert.equal((await f.service.openExerciseRecommendation(scope(a, 1))).recommendation, "Second row");
});

test("v2 library migration preserves old assignments and v3 validates rest/recommendation metadata without overwriting corrupt data", async () => {
  const f = fixture();
  await assigned(f);
  const legacy = structuredClone(f.repo.getState().data);
  legacy.templates.forEach((template) => template.exercises.forEach((exercise) => { delete exercise.restSeconds; }));
  legacy.assignments.forEach((assignment) => assignment.workout.exercises.forEach((exercise) => { delete exercise.restSeconds; }));
  f.entries.set(workoutLibraryKey, JSON.stringify({ schemaVersion: 2, data: legacy }));
  const restarted = f.create();
  await restarted.repo.load();
  assert.deepEqual(restarted.repo.getState().data, legacy);
  assert.equal(JSON.parse(f.entries.get(workoutLibraryKey)).schemaVersion, workoutSchemaVersion);
  for (const value of [-1, 1.5, 3601, "90"]) {
    const data = structuredClone(legacy); data.assignments[0].workout.exercises[0].restSeconds = value;
    assert.throws(() => decodeWorkoutLibrary(JSON.stringify({ schemaVersion: workoutSchemaVersion, data })), /could not be read/);
  }
  const data = structuredClone(legacy); data.assignments[0].workout.exercises[0].recommendation = 10;
  const raw = JSON.stringify({ schemaVersion: workoutSchemaVersion, data });
  f.entries.set(workoutLibraryKey, raw);
  const corrupt = f.create();
  await assert.rejects(save(corrupt, scope(legacy.assignments[0]), "Do not overwrite"), /could not be read/);
  assert.equal(f.entries.get(workoutLibraryKey), raw);
});

test("recommendation reducer guards pending edits, keeps source data immutable and supports load retry", () => {
  const failed = exerciseRecommendationReducer({ status: "loading" }, { type: "load-failed", error: "Offline" });
  assert.deepEqual(exerciseRecommendationReducer(failed, { type: "retry" }), { status: "loading" });
  const details = { clientId: "1", assignmentId: "a", workoutTitle: "Workout", exercise: { id: "e" }, recommendation: "Existing" };
  const loaded = exerciseRecommendationReducer({ status: "loading" }, { type: "loaded", details });
  const edited = exerciseRecommendationReducer(loaded, { type: "changed", value: "Unsaved" });
  assert.equal(details.recommendation, "Existing");
  assert.equal(edited.draft, "Unsaved");
  const saving = exerciseRecommendationReducer(edited, { type: "saving" });
  assert.equal(exerciseRecommendationReducer(saving, { type: "changed", value: "Lost" }), saving);
  assert.equal(exerciseRecommendationReducer(saving, { type: "saving" }), saving);
  assert.equal(exerciseRecommendationReducer(loaded, { type: "saved" }), loaded);
  assert.equal(exerciseRecommendationReducer(saving, { type: "saved" }).status, "saved");
});
