import assert from "node:assert/strict";
import test from "node:test";
import { getWorkoutProgress } from "../src/workouts/workoutProgress.ts";

test("an empty assignment is not a completed workout", () => {
  assert.deepEqual(getWorkoutProgress([]), {
    total: 0, completed: 0, remaining: 0, percentage: 0, isComplete: false,
  });
});

test("reports all remaining exercises before starting", () => {
  assert.deepEqual(getWorkoutProgress([{ completed: false }, { completed: false }]), {
    total: 2, completed: 0, remaining: 2, percentage: 0, isComplete: false,
  });
});

test("counts partial completion and rounds its display percentage", () => {
  assert.deepEqual(getWorkoutProgress([
    { completed: true }, { completed: false }, { completed: false },
  ]), {
    total: 3, completed: 1, remaining: 2, percentage: 33, isComplete: false,
  });
});

test("recognizes completion and reverses it when an exercise is unchecked", () => {
  const exercises = [{ completed: true }, { completed: true }];
  assert.equal(getWorkoutProgress(exercises).isComplete, true);
  assert.equal(getWorkoutProgress(exercises).percentage, 100);
  exercises[1] = { completed: false };
  assert.deepEqual(getWorkoutProgress(exercises), {
    total: 2, completed: 1, remaining: 1, percentage: 50, isComplete: false,
  });
});

test("an incomplete workout never rounds to 100 percent, and a completed one never exceeds it", () => {
  const exercises = Array.from({ length: 200 }, (_, index) => ({ completed: index !== 199 }));
  assert.equal(getWorkoutProgress(exercises).percentage, 99);
  assert.equal(getWorkoutProgress(exercises).isComplete, false);
  exercises[199].completed = true;
  assert.equal(getWorkoutProgress(exercises).percentage, 100);
  assert.equal(getWorkoutProgress(exercises).isComplete, true);
});

test("confirmed performed rows govern exercise completion, not a stale aggregate flag", () => {
  const set = (completed) => ({ id: String(completed), actualReps: "7", actualWeightLb: "125", completed });
  assert.equal(getWorkoutProgress([{ completed: true, actualSets: [set(true), set(false)] }]).percentage, 0);
  assert.equal(getWorkoutProgress([{ completed: false, actualSets: [set(true)] }]).percentage, 100);
  assert.equal(getWorkoutProgress([{ completed: true, actualSets: [] }]).isComplete, false);
});
