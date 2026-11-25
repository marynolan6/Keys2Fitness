import assert from "node:assert/strict";
import test from "node:test";
import { exerciseCatalog, makeWorkoutId, newDraftExercise } from "../src/workouts/exerciseCatalog.ts";

test("exerciseCatalog has name and instructions for every entry", () => {
  assert.ok(exerciseCatalog.length > 0);
  for (const exercise of exerciseCatalog) {
    assert.ok(typeof exercise.name === "string" && exercise.name.length > 0);
    assert.ok(typeof exercise.instructions === "string" && exercise.instructions.length > 0);
  }
});

test("exerciseCatalog includes the expected lifts", () => {
  const names = exerciseCatalog.map((e) => e.name);
  assert.ok(names.includes("Bench Press"));
  assert.ok(names.includes("Back Squat"));
  assert.ok(names.includes("Seated Cable Row"));
});

test("makeWorkoutId returns a string with the given prefix", () => {
  const id = makeWorkoutId("workout");
  assert.equal(typeof id, "string");
  assert.ok(id.startsWith("workout-"));
  // The rest contains at least two separators: timestamp-sequence-random
  assert.ok(id.split("-").length >= 4);
});

test("makeWorkoutId uses different prefixes", () => {
  const a = makeWorkoutId("exercise");
  const b = makeWorkoutId("workout");
  assert.ok(a.startsWith("exercise-"));
  assert.ok(b.startsWith("workout-"));
});

test("newDraftExercise trims the name and sets default fields", () => {
  const draft = newDraftExercise("  Bench Press  ", "Keep feet planted.");
  assert.equal(draft.name, "Bench Press");
  assert.equal(draft.instructions, "Keep feet planted.");
  assert.equal(draft.coachNotes, "");
  assert.equal(draft.sets, "3");
  assert.equal(draft.reps, "10");
  assert.equal(draft.weightLb, "0");
  assert.equal(draft.restSeconds, "");
  assert.ok(typeof draft.id === "string" && draft.id.startsWith("exercise-"));
});

test("newDraftExercise with no instructions defaults to empty string", () => {
  const draft = newDraftExercise("Plank");
  assert.equal(draft.instructions, "");
});
