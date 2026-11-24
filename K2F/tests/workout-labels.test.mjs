import assert from "node:assert/strict";
import test from "node:test";
import { countLabel, prescriptionLabel } from "../src/workouts/workoutLabels.ts";

test("countLabel singular for one, plural otherwise", () => {
  assert.equal(countLabel(1, "set"), "1 set");
  assert.equal(countLabel(3, "set"), "3 sets");
  assert.equal(countLabel(1, "rep"), "1 rep");
  assert.equal(countLabel(10, "rep"), "10 reps");
  assert.equal(countLabel(1, "second"), "1 second");
  assert.equal(countLabel(30, "second"), "30 seconds");
  assert.equal(countLabel(1, "exercise"), "1 exercise");
  assert.equal(countLabel(2, "exercise"), "2 exercises");
});

test("countLabel works with numeric strings", () => {
  assert.equal(countLabel("5", "rep"), "5 reps");
  assert.equal(countLabel("1", "rep"), "1 rep");
});

test("prescriptionLabel combines sets, reps, and weight", () => {
  const exercise = { sets: 3, reps: 10, weight: "135 lb" };
  assert.equal(prescriptionLabel(exercise), "3 sets × 10 reps · 135 lb");
});

test("prescriptionLabel shows placeholder when no weight", () => {
  const exercise = { sets: 4, reps: 8, weight: "" };
  assert.equal(prescriptionLabel(exercise), "4 sets × 8 reps · No weight prescribed");
});

test("prescriptionLabel handles missing weight as undefined", () => {
  const exercise = { sets: 3, reps: 12 };
  assert.equal(prescriptionLabel(exercise), "3 sets × 12 reps · No weight prescribed");
});
