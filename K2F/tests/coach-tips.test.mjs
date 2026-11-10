import assert from "node:assert/strict";
import test from "node:test";
import { exerciseKey, getCoachTip } from "../src/workouts/coachTips.ts";

// K2F-108: tips are per client AND exercise, with no cross-client fallback
const benchPress = { id: "bench-press", name: "Bench Press" };
const noAssignments = { assignments: [] };

function assignment(clientId, exercises) {
  const id = `assigned-${clientId}`;
  return { id, clientId, templateId: "template-today", assignedAt: "2026-11-09T00:00:00.000Z",
    workout: { id, title: "Upper Body Strength", status: "current", exercises } };
}

test("exercise names map to stable keys", () => {
  assert.equal(exerciseKey("Bench Press"), "bench-press");
  assert.equal(exerciseKey("  Push-up "), "push-up");
});

test("two clients with the same exercise get different tips", () => {
  const spencer = getCoachTip(noAssignments, "1", benchPress);
  const alex = getCoachTip(noAssignments, "2", benchPress);
  assert.ok(spencer && alex);
  assert.notEqual(spencer, alex);
});

test("a client with no tip gets null, not another client's tip", () => {
  assert.equal(getCoachTip(noAssignments, "3", benchPress), null);
  assert.equal(getCoachTip(noAssignments, "unknown", benchPress), null);
});

test("an exercise with no tip for this client gets null", () => {
  assert.equal(getCoachTip(noAssignments, "2", { id: "seated-cable-row", name: "Seated Cable Row" }), null);
});

test("a note typed for this client's assignment is shown first", () => {
  const exercise = { id: "assigned-3-bench-press", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb",
    completed: false, coachNotes: "Keep your elbows at about 45 degrees." };
  const data = { assignments: [assignment("3", [exercise])] };
  assert.equal(getCoachTip(data, "3", exercise), "Keep your elbows at about 45 degrees.");
});

test("another client's assignment note never leaks", () => {
  const exercise = { id: "assigned-1-bench-press", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb",
    completed: false, coachNotes: "Note written for Spencer only." };
  const data = { assignments: [assignment("1", [exercise])] };
  assert.equal(getCoachTip(data, "3", exercise), null);
});

test("a blank assignment note falls back to this client's demo tip", () => {
  const exercise = { id: "assigned-2-bench-press", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb",
    completed: false, coachNotes: "  " };
  const data = { assignments: [assignment("2", [exercise])] };
  assert.equal(getCoachTip(data, "2", exercise), getCoachTip(noAssignments, "2", benchPress));
});
