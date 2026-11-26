import assert from "node:assert/strict";
import test from "node:test";
import { draftFromCheckIn, emptyCheckInDraft, readStoredCheckIn, validateCheckIn } from "../src/checkins/checkInForm.ts";

const today = "2026-11-25";
const draft = (fields) => ({ ...emptyCheckInDraft(today), ...fields });

test("date and weight alone make a valid check-in with no measurements", () => {
  assert.deepEqual(validateCheckIn(draft({ weight: " 165.5 " }), today), {
    ok: true,
    values: { date: today, weightLb: 165.5, measurementsIn: {} },
  });
});

test("filled measurements are saved in inches and blank ones are left out", () => {
  const result = validateCheckIn(draft({ date: "2026-11-20", weight: "170", waistIn: "32.5", armIn: "13" }), today);
  assert.deepEqual(result, {
    ok: true,
    values: { date: "2026-11-20", weightLb: 170, measurementsIn: { waistIn: 32.5, armIn: 13 } },
  });
});

test("weight is required and rejects negative, zero, non-numeric and unrealistic values", () => {
  for (const [weight, message] of [
    ["", /Enter weight in lb/],
    ["abc", /must be a number/],
    ["0x10", /must be a number/],
    ["1e2", /must be a number/],
    ["Infinity", /must be a number/],
    ["1,000", /must be a number/],
    ["-5", /can't be negative/],
    ["-0.5", /can't be negative/],
    ["0", /more than 0 lb/],
    ["1000.1", /1,000 lb or less/],
  ]) {
    const result = validateCheckIn(draft({ weight }), today);
    assert.equal(result.ok, false, weight);
    assert.equal(result.values, undefined, weight);
    assert.match(result.errors.weight, message, weight);
  }
  for (const weight of ["1000", "0.5", ".5", "165."]) assert.equal(validateCheckIn(draft({ weight }), today).ok, true, weight);
});

test("dates must be real calendar days that are not in the future", () => {
  for (const date of ["", "11/25/2026", "2026-02-30", "2026-13-01"]) {
    assert.match(validateCheckIn(draft({ date, weight: "150" }), today).errors.date, /YYYY-MM-DD/, date);
  }
  assert.match(validateCheckIn(draft({ date: "2026-11-26", weight: "150" }), today).errors.date, /future/);
  assert.equal(validateCheckIn(draft({ date: "2024-02-29", weight: "150" }), today).ok, true);
});

test("an invalid measurement blocks the save and is reported on its own field", () => {
  const result = validateCheckIn(draft({ weight: "150", waistIn: "-30", hipsIn: "abc", armIn: "101" }), today);
  assert.equal(result.ok, false);
  assert.equal(result.values, undefined);
  assert.deepEqual(result.errors, {
    waistIn: "Waist can't be negative.",
    hipsIn: "Hips must be a number, like 32.5.",
    armIn: "Arm must be 100 in or less.",
  });
});

test("stored history entries with bad dates or weights are left out, and bad measurements are dropped", () => {
  const good = { date: "2026-11-01", weightLb: 160, measurementsIn: { waistIn: 31, hipsIn: -2, armIn: "12" } };
  assert.deepEqual(readStoredCheckIn("a", good), {
    id: "a", date: "2026-11-01", weightLb: 160, measurementsIn: { waistIn: 31 },
  });
  for (const bad of [
    { date: "2026-11-01", weightLb: -160 },
    { date: "2026-11-01", weightLb: "160" },
    { date: "2026-11-01", weightLb: Number.NaN },
    { date: "2026-11-01" },
    { date: "11/01/2026", weightLb: 160 },
    { weightLb: 160 },
  ]) assert.equal(readStoredCheckIn("b", bad), null, JSON.stringify(bad));
});

test("editing starts from the saved values and round-trips unchanged", () => {
  const saved = { date: "2026-11-01", weightLb: 168.4, measurementsIn: { hipsIn: 38 } };
  const editDraft = draftFromCheckIn(saved.date, saved.weightLb, saved.measurementsIn);
  assert.deepEqual(editDraft, { date: "2026-11-01", weight: "168.4", waistIn: "", hipsIn: "38", armIn: "" });
  assert.deepEqual(validateCheckIn(editDraft, today), { ok: true, values: saved });
});
