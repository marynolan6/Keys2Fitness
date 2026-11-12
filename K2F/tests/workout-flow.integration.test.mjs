import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage, libraryData, workoutDraft } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { createWorkoutLibraryRepository } = await import("../src/workouts/workoutLibraryRepository.ts");
const { createWorkoutLibraryService } = await import("../src/workouts/workoutLibraryService.ts");
const { createWorkoutSessionStore } = await import("../src/workouts/workoutSessionStore.ts");
const { createWorkoutSessionService } = await import("../src/workouts/workoutSessionService.ts");
const { createWorkoutEditorState, workoutEditorReducer } = await import("../src/workouts/workoutEditorReducer.ts");
const { initialWorkoutSessionState, workoutSessionReducer } = await import("../src/workouts/workoutSessionReducer.ts");
const { resolveClientWorkout, resolveWorkoutById, canPreviewWorkout } = await import("../src/workouts/workoutAssignmentLookup.ts");
const { getWorkoutCoachNote } = await import("../src/workouts/coachNote.ts");
const { getWorkoutCardLabels } = await import("../src/workouts/workoutSessionModel.ts");
const { elapsedWorkoutTime } = await import("../src/workouts/workoutTimer.ts");
hooks.deregister();

function application(storage) {
  let sequence = 0;
  let clock = 1000;
  const library = createWorkoutLibraryRepository(storage, libraryData());
  const plans = createWorkoutLibraryService(library, {
    clients: { async listClientIds() { return ["1", "2"]; } }, getAuthorName: () => "Coach Keys",
    makeId: (prefix) => `${prefix}-${clock}-${++sequence}`, now: () => "2026-11-08T12:00:00.000Z",
  });
  const sessions = createWorkoutSessionStore(storage, () => clock);
  return { library, plans, sessions, training: createWorkoutSessionService(sessions, () => clock),
    setTime(value) { clock = value; }, time: () => clock };
}

test("coach editor -> assignment -> client notes -> checkpoint -> restart -> dashboard Continue", async () => {
  const { storage } = memoryStorage();
  const app = application(storage);
  let editor = createWorkoutEditorState({ availableClientIds: ["1", "2"], initialClientId: "2" });
  for (const [field, value] of Object.entries(workoutDraft()).filter(([field]) => field !== "exercises")) {
    editor = workoutEditorReducer(editor, { type: "field-changed", field, value });
  }
  editor = workoutEditorReducer(editor, { type: "exercise-added", exercise: workoutDraft().exercises[0] });
  editor = workoutEditorReducer(editor, { type: "save-started" });
  const result = await app.plans.saveWorkout({ draft: editor.draft, clientIds: editor.selectedClients, reusable: editor.reusable });
  editor = workoutEditorReducer(editor, { type: "save-succeeded", result });
  assert.equal(editor.workflow.status, "saved");

  const workout = resolveClientWorkout(app.library.getState().data, "2", null);
  assert.equal(workout.id, result.assignments[0].id);
  assert.equal(resolveClientWorkout(app.library.getState().data, "1", null), null);
  assert.equal(getWorkoutCoachNote(workout).text, "Keep a controlled tempo.");
  assert.equal(getWorkoutCoachNote(workout).author, "Coach Keys");
  assert.equal(workout.exercises[0].coachNotes, "Pause briefly at the bottom.");
  assert.equal(workout.exercises[0].alternative, "Push-up");

  let state = workoutSessionReducer(initialWorkoutSessionState, { type: "loaded", attempt: 0, session: await app.training.openWorkout(workout) });
  assert.equal(getWorkoutCardLabels(workout, state.session).action, "View workout");
  state = workoutSessionReducer(state, { type: "transition-started" });
  state = workoutSessionReducer(state, { type: "transition-succeeded", session: await app.training.changeSession(workout, state.session, "start") });
  const exerciseId = workout.exercises[0].id;
  const setId = state.session.exercises[0].actualSets[0].id;
  for (const [field, value] of [["actualReps", "7"], ["actualWeightLb", "127.5"]]) {
    state = workoutSessionReducer(state, { type: "update-set", exerciseId, setId, field, value });
  }
  state = workoutSessionReducer(state, { type: "toggle-set", exerciseId, setId });
  await app.training.checkpoint(state.session); // Leave without Pause, as the hook does.
  const allowed = (id) => canPreviewWorkout(app.library.getState().data, id, "2", () => undefined);
  const active = await app.training.findActiveWorkout(allowed);
  assert.equal(getWorkoutCardLabels(workout, active).action, "Continue workout");
  assert.equal(await app.training.findActiveWorkout((id) => canPreviewWorkout(app.library.getState().data, id, "1", () => undefined)), null);

  const restarted = application(storage);
  restarted.setTime(5000);
  await restarted.library.load();
  const restoredWorkout = resolveWorkoutById(restarted.library.getState().data, active.workoutId, () => undefined);
  let continued = await restarted.training.openWorkout(restoredWorkout, true);
  assert.equal(continued.timer.runningSince, 1000);
  assert.equal(elapsedWorkoutTime(continued.timer, restarted.time()), 4000);
  assert.deepEqual(continued.exercises[0].actualSets[0], { id: setId, actualReps: "7", actualWeightLb: "127.5", completed: true });
  assert.equal(getWorkoutCoachNote(restoredWorkout).text, workout.notes);

  restarted.setTime(6000);
  continued = await restarted.training.changeSession(restoredWorkout, continued, "pause");
  restarted.setTime(96000);
  assert.equal(elapsedWorkoutTime((await restarted.training.openWorkout(restoredWorkout)).timer, restarted.time()), 5000);
  continued = await restarted.training.openWorkout(restoredWorkout, true);
  restarted.setTime(97000);
  assert.equal(elapsedWorkoutTime(continued.timer, restarted.time()), 6000);
  assert.equal(continued.exercises[0].actualSets[0].actualWeightLb, "127.5");

  const changed = workoutDraft(); changed.notes = "New template note"; changed.exercises[0].weightLb = "150";
  await restarted.plans.saveWorkout({ draft: changed, clientIds: [], reusable: true, existingTemplateId: result.templateId });
  await restarted.plans.deleteTemplate(result.templateId);
  assert.equal((await restarted.library.findAssignment(workout.id)).workout.exercises[0].weight, "135 lb");
  assert.equal(getWorkoutCoachNote((await restarted.library.findAssignment(workout.id)).workout).text, "Keep a controlled tempo.");
  continued = await restarted.training.changeSession(restoredWorkout, continued, "end");
  assert.equal(getWorkoutCardLabels(restoredWorkout, continued).action, "View workout");
  assert.equal((await restarted.training.openWorkout(restoredWorkout, true)).timer.status, "ended");
});

test("failed assignment and Pause do not publish false success or discard the editable state", async () => {
  const { storage } = memoryStorage();
  const app = application(storage);
  await app.library.load();
  const write = storage.setItem;
  let editor = { ...createWorkoutEditorState({ availableClientIds: ["2"], initialClientId: "2" }), draft: workoutDraft() };
  editor = workoutEditorReducer(editor, { type: "save-started" });
  storage.setItem = async () => { throw new Error("Disk full"); };
  try { await app.plans.saveWorkout({ draft: editor.draft, clientIds: editor.selectedClients, reusable: true }); }
  catch (error) { editor = workoutEditorReducer(editor, { type: "save-failed", error: error.message }); }
  assert.equal(editor.workflow.status, "error");
  assert.equal((await app.library.listAssignments()).length, 0);
  assert.equal(editor.draft.notes, workoutDraft().notes);
  assert.deepEqual(editor.selectedClients, ["2"]);
  storage.setItem = write;
  const saved = await app.plans.saveWorkout({ draft: editor.draft, clientIds: editor.selectedClients, reusable: true });
  const workout = saved.assignments[0].workout;
  const running = await app.training.changeSession(workout, await app.training.openWorkout(workout), "start");
  let state = workoutSessionReducer(initialWorkoutSessionState, { type: "loaded", attempt: 0, session: running });
  state = workoutSessionReducer(state, { type: "transition-started" });
  storage.setItem = async () => { throw new Error("Disk full"); };
  try { await app.training.changeSession(workout, running, "pause"); }
  catch (error) { state = workoutSessionReducer(state, { type: "transition-failed", error: error.message }); }
  assert.equal(state.status, "ready");
  assert.equal(state.session.timer.status, "running");
  assert.equal((await app.sessions.loadWorkoutSession(workout.id)).timer.status, "running");
  storage.setItem = write;
  assert.equal((await app.training.changeSession(workout, state.session, "pause")).timer.status, "paused");
});

test("library use cases accept a domain-only repository with no AsyncStorage or observable-state API", async () => {
  const templates = new Map();
  const assignments = [];
  const repository = {
    async listTemplates() { return [...templates.values()]; },
    async findTemplate(id) { return templates.get(id) ?? null; },
    async listAssignments(clientId) { return assignments.filter((item) => clientId === undefined || item.clientId === clientId); },
    async findAssignment(id) { return assignments.find((item) => item.id === id) ?? null; },
    async getPreviewClientId() { return "2"; },
    async saveWorkoutPlan(plan) { if (plan.template) templates.set(plan.template.id, plan.template); assignments.unshift(...plan.assignments); },
    async deleteTemplate(id) { templates.delete(id); },
    async setPreviewClient() {},
  };
  let id = 0;
  const service = createWorkoutLibraryService(repository, { clients: { async listClientIds() { return ["2"]; } },
    getAuthorName: () => "Remote coach", makeId: () => String(++id), now: () => "2026-11-08T12:00:00.000Z" });
  const result = await service.saveWorkout({ draft: workoutDraft(), clientIds: ["2"], reusable: true });
  assert.equal((await repository.findAssignment(result.assignments[0].id)).workout.notesAuthor, "Remote coach");
  assert.equal((await service.assignTemplate({ templateId: result.templateId, clientIds: ["2"] })).length, 1);
});
