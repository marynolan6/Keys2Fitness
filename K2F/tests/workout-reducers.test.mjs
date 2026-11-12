import assert from "node:assert/strict";
import test from "node:test";
import { registerWorkoutTypes, workoutDraft, legacySession } from "./helpers/workout-test-support.mjs";

const hooks = registerWorkoutTypes();
const { workoutSessionReducer, initialWorkoutSessionState } = await import("../src/workouts/workoutSessionReducer.ts");
const { createWorkoutEditorState, workoutEditorReducer } = await import("../src/workouts/workoutEditorReducer.ts");
const { initializeSetPerformance } = await import("../src/workouts/setPerformance.ts");
hooks.deregister();

function runningState() {
  const session = legacySession();
  session.timer = { status: "running", elapsedMs: 0, runningSince: 1000 };
  session.exercises = session.exercises.map(initializeSetPerformance);
  return workoutSessionReducer(initialWorkoutSessionState, { type: "loaded", attempt: 0, session });
}

test("session edits are rejected during loading, transitions, pause, and after ending", () => {
  const action = { type: "toggle-exercise", exerciseId: "bench" };
  assert.equal(workoutSessionReducer(initialWorkoutSessionState, action), initialWorkoutSessionState);
  const running = runningState();
  const saving = workoutSessionReducer(running, { type: "transition-started" });
  assert.equal(workoutSessionReducer(saving, action), saving);
  for (const status of ["paused", "ended", "ready"]) {
    const state = { ...running, session: { ...running.session, timer: { status, elapsedMs: 0, runningSince: null } } };
    assert.equal(workoutSessionReducer(state, action), state);
  }
});

test("older save acknowledgements cannot mark newer edits saved or clear a newer error", () => {
  let state = runningState();
  const setId = state.session.exercises[0].actualSets[0].id;
  state = workoutSessionReducer(state, { type: "update-set", exerciseId: "bench", setId, field: "actualWeightLb", value: "140" });
  state = workoutSessionReducer(state, { type: "checkpoint-started", revision: 1 });
  state = workoutSessionReducer(state, { type: "update-set", exerciseId: "bench", setId, field: "actualWeightLb", value: "145" });
  state = workoutSessionReducer(state, { type: "checkpoint-failed", revision: 2, error: "Disk full" });
  state = workoutSessionReducer(state, { type: "checkpoint-saved", revision: 1 });
  assert.equal(state.persistedRevision, 1);
  assert.equal(state.revision, 2);
  assert.equal(state.checkpoint.status, "error");
  assert.equal(state.session.exercises[0].actualSets[0].actualWeightLb, "145");
  const retry = workoutSessionReducer(state, { type: "retry-save" });
  assert.equal(retry.saveRetry, 1);
  const saved = workoutSessionReducer(retry, { type: "checkpoint-saved", revision: 2 });
  assert.equal(saved.persistedRevision, 2);
  assert.equal(saved.checkpoint.status, "saved");
});

test("failed timer transitions preserve running state and recorded values", () => {
  const state = runningState();
  const transitioning = workoutSessionReducer(state, { type: "transition-started" });
  const failed = workoutSessionReducer(transitioning, { type: "transition-failed", error: "Pause could not be saved" });
  assert.equal(failed.status, "ready");
  assert.equal(failed.session, state.session);
  assert.equal(failed.session.timer.status, "running");
  assert.equal(failed.transitionError, "Pause could not be saved");
});

test("retry-load rejects stale load responses and exposes a single load-error state", () => {
  const failed = workoutSessionReducer(initialWorkoutSessionState, { type: "load-failed", attempt: 0, error: "Storage unavailable" });
  assert.equal(failed.status, "load-error");
  const retry = workoutSessionReducer(failed, { type: "retry-load" });
  assert.equal(retry.status, "loading");
  const stale = workoutSessionReducer(retry, { type: "loaded", attempt: 0, session: legacySession() });
  assert.equal(stale, retry);
});

test("editor retains draft and client selection on failure and blocks edits while saving or saved", () => {
  let state = createWorkoutEditorState({ availableClientIds: ["1", "2"], initialClientId: "2" });
  state = { ...state, draft: workoutDraft() };
  const saving = workoutEditorReducer(state, { type: "save-started" });
  assert.equal(workoutEditorReducer(saving, { type: "field-changed", field: "title", value: "Lost draft" }), saving);
  const failed = workoutEditorReducer(saving, { type: "save-failed", error: "Disk full" });
  assert.deepEqual(failed.draft, state.draft);
  assert.deepEqual(failed.selectedClients, ["2"]);
  assert.equal(failed.workflow.status, "error");
  const retry = workoutEditorReducer(failed, { type: "save-started" });
  const saved = workoutEditorReducer(retry, { type: "save-succeeded", result: { templateId: "template", assignments: [] } });
  assert.equal(saved.workflow.status, "saved");
  assert.equal(workoutEditorReducer(saved, { type: "save-started" }), saved);
});

test("editor exercise and alternative edits preserve unrelated rows and optional fields", () => {
  let state = createWorkoutEditorState({ availableClientIds: [] });
  const first = workoutDraft().exercises[0];
  const second = { ...first, id: "second", name: "Row", alternative: undefined };
  state = workoutEditorReducer(state, { type: "exercise-added", exercise: first });
  state = workoutEditorReducer(state, { type: "exercise-added", exercise: second });
  state = workoutEditorReducer(state, { type: "exercise-changed", id: "bench", update: { alternative: "Incline press" } });
  assert.equal(state.draft.exercises[1], second);
  assert.equal(state.draft.exercises[0].alternative, "Incline press");
  state = workoutEditorReducer(state, { type: "exercise-removed", id: "bench" });
  assert.deepEqual(state.draft.exercises, [second]);
});
