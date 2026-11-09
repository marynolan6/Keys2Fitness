import assert from "node:assert/strict";
import test from "node:test";
import {
  addPerformedSet, initializeSetPerformance, isValidPerformanceValue,
  isValidPerformedSets, prescribedSetDefaults, removeLastPerformedSet, resetSetPerformance,
  toggleExercisePerformance, togglePerformedSet, updateSetPerformance,
} from "../src/workouts/setPerformance.ts";

const prescription = Object.freeze({
  id: "bench", name: "Bench Press", sets: 3, reps: 8, weight: "135 lb", completed: false,
});

test("initial rows reflect prescribed count without claiming any performed values", () => {
  const exercise = initializeSetPerformance(prescription);
  assert.equal(exercise.actualSets.length, 3);
  assert.equal(new Set(exercise.actualSets.map((set) => set.id)).size, 3);
  assert.ok(exercise.actualSets.every((set) => set.actualReps === "" && set.actualWeightLb === ""));
  assert.equal(prescription.actualSets, undefined);
  assert.equal(initializeSetPerformance(exercise), exercise);
});

test("edits affect only the selected row, retaining prescription and other exercise data", () => {
  const before = initializeSetPerformance(prescription);
  before.actualSets.forEach(Object.freeze);
  Object.freeze(before.actualSets);
  const row = before.actualSets[1];
  const changed = updateSetPerformance(before, row.id, "actualReps", "6");
  const weighted = updateSetPerformance(changed, row.id, "actualWeightLb", "142.5");
  assert.equal(weighted.actualSets[1].actualReps, "6");
  assert.equal(weighted.actualSets[1].actualWeightLb, "142.5");
  assert.equal(weighted.actualSets[0], before.actualSets[0]);
  assert.equal(weighted.actualSets[2], before.actualSets[2]);
  assert.equal(before.actualSets[1].actualReps, "");
  assert.equal(weighted.sets, 3);
  assert.equal(weighted.reps, 8);
  assert.equal(weighted.weight, "135 lb");
  assert.equal(weighted.completed, false);
});

test("adding and removing performed sets retains other rows and allows fewer than prescribed", () => {
  let exercise = initializeSetPerformance(prescription);
  exercise = updateSetPerformance(exercise, exercise.actualSets[0].id, "actualWeightLb", "120");
  const first = exercise.actualSets[0];
  exercise = addPerformedSet(exercise, "extra");
  assert.equal(exercise.actualSets.length, 4);
  assert.deepEqual(exercise.actualSets[3], { id: "extra", actualReps: "", actualWeightLb: "", completed: false });
  assert.equal(addPerformedSet(exercise, "extra"), exercise);
  exercise = removeLastPerformedSet(exercise);
  exercise = removeLastPerformedSet(exercise);
  assert.equal(exercise.actualSets.length, 2);
  assert.equal(exercise.actualSets[0], first);
  assert.equal(exercise.sets, 3);
  exercise = removeLastPerformedSet(removeLastPerformedSet(exercise));
  assert.deepEqual(initializeSetPerformance(exercise).actualSets, []);
  assert.deepEqual(removeLastPerformedSet(exercise).actualSets, []);
  assert.equal(addPerformedSet(exercise, "new").actualSets.length, 1);
});

test("zero, blank, and bodyweight values remain distinct; invalid values are rejected", () => {
  for (const field of ["actualReps", "actualWeightLb"]) {
    for (const valid of ["", "0", "12"]) assert.equal(isValidPerformanceValue(field, valid), true);
    for (const invalid of ["-1", "abc", "NaN", "Infinity", "1e3", " 3 ", "99999999999999999"]) {
      assert.equal(isValidPerformanceValue(field, invalid), false, invalid);
    }
  }
  assert.equal(isValidPerformanceValue("actualReps", "8.5"), false);
  assert.equal(isValidPerformanceValue("actualWeightLb", "20.5"), true);
  let bodyweight = initializeSetPerformance({ ...prescription, weight: "" });
  const id = bodyweight.actualSets[0].id;
  bodyweight = updateSetPerformance(bodyweight, id, "actualWeightLb", "0");
  assert.equal(bodyweight.actualSets[0].actualWeightLb, "0");
  assert.equal(bodyweight.weight, "");
  assert.equal(updateSetPerformance(bodyweight, id, "actualReps", "-3"), bodyweight);
  assert.equal(updateSetPerformance(bodyweight, id, "actualWeightLb", "").actualSets[0].actualWeightLb, "");
});

test("local session round-trip preserves entries, row IDs, removed rows, and completion", () => {
  let exercise = initializeSetPerformance({ ...prescription, completed: true });
  exercise = updateSetPerformance(exercise, exercise.actualSets[0].id, "actualReps", "0");
  exercise = updateSetPerformance(exercise, exercise.actualSets[1].id, "actualWeightLb", "132.5");
  exercise = addPerformedSet(exercise, "extra");
  const saved = JSON.parse(JSON.stringify({ exercises: [exercise], paused: true }));
  const restored = initializeSetPerformance(saved.exercises[0]);
  assert.deepEqual(restored, exercise);
  assert.equal(isValidPerformedSets(restored.actualSets), true);
  assert.equal(restored.completed, false);
  assert.equal(isValidPerformedSets([{ id: "bad", actualReps: "-1", actualWeightLb: "" }]), false);
  assert.equal(isValidPerformedSets([restored.actualSets[0], restored.actualSets[0]]), false);
  assert.equal(isValidPerformedSets(null), false);
});

test("confirming untouched sets records targets and completes the exercise only after every set", () => {
  let exercise = initializeSetPerformance(prescription);
  exercise = togglePerformedSet(exercise, exercise.actualSets[0].id);
  assert.deepEqual(exercise.actualSets[0], {
    id: "bench-set-1", actualReps: "8", actualWeightLb: "135", completed: true,
  });
  assert.equal(exercise.completed, false);
  exercise = togglePerformedSet(exercise, exercise.actualSets[1].id);
  exercise = togglePerformedSet(exercise, exercise.actualSets[2].id);
  assert.equal(exercise.completed, true);
  exercise = togglePerformedSet(exercise, exercise.actualSets[1].id);
  assert.equal(exercise.completed, false);
  assert.equal(exercise.actualSets[1].actualReps, "8");
  assert.equal(exercise.reps, 8);
  assert.equal(exercise.weight, "135 lb");
});

test("confirmation keeps customized values and explicit zero rather than replacing them", () => {
  let exercise = initializeSetPerformance(prescription);
  const id = exercise.actualSets[0].id;
  exercise = updateSetPerformance(exercise, id, "actualReps", "0");
  exercise = updateSetPerformance(exercise, id, "actualWeightLb", "127.5");
  exercise = togglePerformedSet(exercise, id);
  assert.equal(exercise.actualSets[0].actualReps, "0");
  assert.equal(exercise.actualSets[0].actualWeightLb, "127.5");
  exercise = updateSetPerformance(exercise, id, "actualReps", "10");
  assert.equal(exercise.actualSets[0].completed, false);
  exercise = togglePerformedSet(exercise, id);
  assert.equal(exercise.actualSets[0].actualReps, "10");
});

test("exercise-level completion confirms every set and adding an unfinished set reopens it", () => {
  let exercise = toggleExercisePerformance(initializeSetPerformance(prescription));
  assert.equal(exercise.completed, true);
  assert.ok(exercise.actualSets.every((set) => set.completed && set.actualReps === "8"));
  exercise = addPerformedSet(exercise, "extra");
  assert.equal(exercise.completed, false);
  exercise = removeLastPerformedSet(exercise);
  assert.equal(exercise.completed, true);
  exercise = toggleExercisePerformance(exercise);
  assert.equal(exercise.completed, false);
  assert.ok(exercise.actualSets.every((set) => !set.completed && set.actualReps === "8"));
});

test("bodyweight targets default to zero added weight and legacy rows gain confirmation state", () => {
  assert.deepEqual(prescribedSetDefaults({ ...prescription, weight: "Bodyweight" }), { actualReps: "8", actualWeightLb: "0" });
  assert.equal(prescribedSetDefaults({ ...prescription, weight: "" }).actualWeightLb, "0");
  assert.equal(prescribedSetDefaults({ ...prescription, weight: "light band" }).actualWeightLb, "");
  const legacy = initializeSetPerformance({ ...prescription, actualSets: [{ id: "legacy", actualReps: "7", actualWeightLb: "120" }] });
  assert.equal(legacy.actualSets[0].completed, false);
  assert.equal(legacy.actualSets[0].actualReps, "7");
  assert.equal(isValidPerformedSets([{ ...legacy.actualSets[0], completed: "yes" }]), false);
});

test("new workout resets actual entries while retaining assigned targets and guidance", () => {
  const exercise = { ...initializeSetPerformance(prescription), coachNotes: "Controlled tempo", completed: true };
  exercise.actualSets[0].actualReps = "12";
  const reset = resetSetPerformance(exercise);
  assert.equal(reset.completed, false);
  assert.equal(reset.actualSets.length, prescription.sets);
  assert.equal(reset.actualSets[0].actualReps, "");
  assert.equal(reset.coachNotes, exercise.coachNotes);
  assert.equal(exercise.actualSets[0].actualReps, "12");
});
