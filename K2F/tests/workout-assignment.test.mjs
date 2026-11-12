import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, memoryStorage, libraryData, workoutDraft } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { createWorkoutLibraryRepository } = await import("../src/workouts/workoutLibraryRepository.ts");
const { createWorkoutLibraryService } = await import("../src/workouts/workoutLibraryService.ts");
const { workoutAssignmentReducer } = await import("../src/workouts/workoutAssignmentReducer.ts");
const { createWorkoutEditorState, workoutEditorReducer } = await import("../src/workouts/workoutEditorReducer.ts");
const { canPreviewWorkout, resolveWorkoutById } = await import("../src/workouts/workoutAssignmentLookup.ts");
hooks.deregister();

function application(storage) {
  let sequence = 0;
  let available = ["1", "2"];
  let time = "2026-11-11T12:00:00.000Z";
  const repository = createWorkoutLibraryRepository(storage, libraryData());
  const service = createWorkoutLibraryService(repository, {
    clients: { async listClientIds() { return available; } }, getAuthorName: () => "Coach",
    makeId: (prefix) => `${prefix}-${++sequence}`, now: () => time,
  });
  return { repository, service, removeClients: () => { available = []; }, advance: () => { time = "2026-11-12T12:00:00.000Z"; } };
}

async function review(app, clientIds = ["2"]) {
  const { templateId } = await app.service.saveWorkout({ draft: workoutDraft(), reusable: true, clientIds: [] });
  const template = await app.repository.findTemplate(templateId);
  return workoutAssignmentReducer({ status: "idle" }, { type: "review", review: {
    template, clients: clientIds.map((id) => ({ id, name: `Client ${id}` })),
  } });
}

const confirm = (app, state) => app.service.assignTemplate({ templateId: state.review.template.id,
  expectedTemplateUpdatedAt: state.review.template.updatedAt, clientIds: state.review.clients.map((client) => client.id) });

test("review and cancellation do not change assignments; the reviewed pairing is an independent snapshot", async () => {
  const { storage, writes } = memoryStorage();
  const app = application(storage);
  const state = await review(app);
  const before = writes.length;
  const original = await app.repository.findTemplate(state.review.template.id);
  original.title = "Later UI mutation";
  assert.equal(state.review.template.title, "Integration strength");
  assert.deepEqual(state.review.clients, [{ id: "2", name: "Client 2" }]);
  assert.deepEqual(workoutAssignmentReducer(state, { type: "cancel" }), { status: "idle" });
  assert.deepEqual(await app.repository.listAssignments(), []);
  assert.equal(writes.length, before);
  assert.equal(workoutAssignmentReducer(state, { type: "saved", assignments: [] }), state);
});

test("confirmed assignments survive restart, are coach-visible and open only for their selected clients", async () => {
  const { storage } = memoryStorage();
  const app = application(storage);
  let state = await review(app, ["2"]);
  state = workoutAssignmentReducer(state, { type: "confirm" });
  assert.equal(workoutAssignmentReducer(state, { type: "confirm" }), state);
  assert.equal(workoutAssignmentReducer(state, { type: "cancel" }), state);
  const assignments = await confirm(app, state);
  state = workoutAssignmentReducer(state, { type: "saved", assignments });
  assert.equal(state.status, "saved");
  const restarted = application(storage);
  await restarted.repository.load();
  const data = restarted.repository.getState().data;
  assert.deepEqual(await restarted.repository.listAssignments("2"), assignments);
  assert.deepEqual(await restarted.repository.listAssignments("1"), []);
  assert.equal(canPreviewWorkout(data, assignments[0].id, "2", () => undefined), true);
  assert.equal(canPreviewWorkout(data, assignments[0].id, "1", () => undefined), false);
  assert.deepEqual(resolveWorkoutById(data, assignments[0].id, () => undefined), assignments[0].workout);
  assert.equal(workoutAssignmentReducer(state, { type: "confirm" }), state);
});

test("failed confirmation retains the reviewed pairing for retry and publishes no assignment", async () => {
  const { storage } = memoryStorage();
  const app = application(storage);
  let state = workoutAssignmentReducer(await review(app, ["1", "2"]), { type: "confirm" });
  const write = storage.setItem;
  storage.setItem = async () => { throw new Error("Disk full"); };
  await assert.rejects(async () => {
    try { await confirm(app, state); }
    catch (error) { state = workoutAssignmentReducer(state, { type: "failed", error: error.message }); throw error; }
  }, /Disk full/);
  assert.equal(state.status, "review");
  assert.equal(state.error, "Disk full");
  assert.deepEqual(state.review.clients.map((client) => client.id), ["1", "2"]);
  assert.equal((await app.repository.listAssignments()).length, 0);
  storage.setItem = write;
  const assignments = await confirm(app, state);
  assert.equal(assignments.length, 2);
  assert.equal((await app.repository.listAssignments()).length, 2);
});

test("confirmation rejects removed clients, deleted templates, and plans changed since review", async () => {
  for (const scenario of ["client", "deleted", "changed"]) {
    const { storage, writes } = memoryStorage();
    const app = application(storage);
    const state = await review(app);
    if (scenario === "client") app.removeClients();
    if (scenario === "deleted") await app.service.deleteTemplate(state.review.template.id);
    if (scenario === "changed") {
      app.advance();
      await app.service.saveWorkout({ draft: { ...workoutDraft(), title: "Revised" }, reusable: true,
        existingTemplateId: state.review.template.id, clientIds: [] });
    }
    const before = writes.length;
    await assert.rejects(confirm(app, state), /no longer available|available workout template|changed during review/);
    assert.equal((await app.repository.listAssignments()).length, 0);
    assert.equal(writes.length, before);
  }
});

test("editor review freezes the draft and selection; cancellation and failure preserve the complete plan", () => {
  const initial = { ...createWorkoutEditorState({ availableClientIds: ["2"], initialClientId: "2" }), draft: workoutDraft() };
  const state = workoutEditorReducer(initial, { type: "confirmation-requested" });
  assert.equal(state.workflow.status, "confirming");
  for (const action of [{ type: "field-changed", field: "title", value: "Wrong workout" }, { type: "clients-selected", ids: ["1"] }]) {
    assert.equal(workoutEditorReducer(state, action), state);
  }
  const canceled = workoutEditorReducer(state, { type: "confirmation-canceled" });
  assert.deepEqual(canceled, initial);
  const failed = workoutEditorReducer(workoutEditorReducer(state, { type: "save-started" }), { type: "save-failed", error: "Disk full" });
  assert.deepEqual(failed.draft, initial.draft);
  assert.deepEqual(failed.selectedClients, ["2"]);
  assert.equal(failed.workflow.message, "Disk full");
});
