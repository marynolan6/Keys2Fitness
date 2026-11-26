import assert from "node:assert/strict";
import test from "node:test";
import { registerSourceTypes } from "./helpers/source-types.mjs";

const hooks = registerSourceTypes();
const { getGoalProgress } = await import("../src/goals/goal.ts");
const { buildGoal, draftFromGoal, emptyGoalDraft, goalEntries, validateGoal } = await import("../src/goals/goalForm.ts");
const { addGoal, deleteGoal, getGoals, newGoalId, updateGoal } = await import("../src/goals/goalStore.ts");
const { mockCheckIns } = await import("../src/checkins/mockCheckIns.ts");
const { activeWeightGoal, describeGoalStanding, withCheckIns } = await import("../src/goals/goalProgress.ts");
hooks.deregister();

const today = "2026-11-25";
const draft = (fields) => ({ ...emptyGoalDraft(), targetDate: "2026-12-31", ...fields });

test("a goal needs a type, a positive numeric target and a target date that isn't in the past", () => {
  const result = validateGoal(draft({ targetValue: "150" }), today);
  assert.equal(result.ok, true);
  assert.equal(result.values.type, "weight");
  assert.equal(result.values.targetDate, "2026-12-31");
  assert.ok(Math.abs(result.values.targetValue - 150 / 2.20462) < 1e-9); // stored in kg

  for (const [targetValue, message] of [
    ["", /Enter a target weight in lb/],
    ["abc", /must be a number/],
    ["1e2", /must be a number/],
    ["-150", /can't be negative/],
    ["0", /more than 0 lb/],
    ["1001", /1,000 lb or less/],
  ]) assert.match(validateGoal(draft({ targetValue }), today).errors.targetValue, message, targetValue);

  assert.match(validateGoal(draft({ targetValue: "150", targetDate: "2026-11-24" }), today).errors.targetDate, /past/);
  assert.match(validateGoal(draft({ targetValue: "150", targetDate: "12/31/2026" }), today).errors.targetDate, /YYYY-MM-DD/);
  assert.equal(validateGoal(draft({ targetValue: "150", targetDate: today }), today).ok, true);
});

test("measurement goals use inches and their own limit", () => {
  const result = validateGoal(draft({ type: "waist", targetValue: "30" }), today);
  assert.ok(Math.abs(result.values.targetValue - 76.2) < 1e-9); // stored in cm
  assert.match(validateGoal(draft({ type: "arm", targetValue: "101" }), today).errors.targetValue, /Target arm must be 100 in or less/);
});

test("a new goal starts from the latest recorded value of its type", () => {
  const { values } = validateGoal(draft({ type: "waist", targetValue: "29" }), today);
  const goal = buildGoal("g", values, mockCheckIns, today);
  assert.equal(goal.title, "Waist to 29 in");
  assert.equal(goal.unit, "cm");
  assert.equal(goal.startValue, 76); // Oct 3 waist
  assert.equal(goal.startDate, "2026-10-03");
  assert.equal(goal.entries.length, goalEntries("waist", mockCheckIns).length);
  assert.equal(getGoalProgress(goal).status, "in-progress");
});

test("editing keeps the starting point unless the type changes, and round-trips the form", () => {
  const [sample] = getGoals();
  const editDraft = draftFromGoal(sample);
  assert.deepEqual(editDraft, { type: "weight", targetValue: "143.3", targetDate: "2026-12-31" });

  const moved = buildGoal(sample.id, validateGoal({ ...editDraft, targetValue: "140" }, today).values, mockCheckIns, today, sample);
  assert.equal(moved.startValue, sample.startValue);
  assert.equal(moved.startDate, sample.startDate);

  const retyped = buildGoal(sample.id, validateGoal({ ...editDraft, type: "hips", targetValue: "36" }, today).values, mockCheckIns, today, sample);
  assert.equal(retyped.unit, "cm");
  assert.equal(retyped.startValue, 96);
});

test("goals can be added, edited and deleted in the store", () => {
  const before = getGoals();
  const id = newGoalId();
  addGoal(buildGoal(id, validateGoal(draft({ type: "arm", targetValue: "13" }), today).values, mockCheckIns, today));
  assert.equal(getGoals().length, before.length + 1);

  const added = getGoals().find((goal) => goal.id === id);
  updateGoal(buildGoal(id, validateGoal(draft({ type: "arm", targetValue: "14", targetDate: "2027-01-31" }), today).values, mockCheckIns, today, added));
  assert.equal(getGoals().find((goal) => goal.id === id).targetDate, "2027-01-31");

  deleteGoal(id);
  assert.deepEqual(getGoals().map((goal) => goal.id), before.map((goal) => goal.id));
  deleteGoal("missing");
  assert.equal(getGoals().length, before.length);
});

test("a goal type with nothing recorded yet starts in the no-data state", () => {
  const { values } = validateGoal(draft({ type: "arm", targetValue: "13" }), today);
  const goal = buildGoal("g", values, [], today);
  assert.equal(goal.startDate, today);
  assert.equal(getGoalProgress(goal).status, "no-data");
});

const checkIn = (date, weightKg, measurements) => ({ id: date, date, weightKg, ...(measurements && { measurements }) });
const lbToKg = (lb) => lb / 2.20462;

test("progress uses the latest check-in that recorded the goal's type, not one that skipped it", () => {
  const goal = buildGoal("w", validateGoal(draft({ type: "waist", targetValue: "29" }), "2026-09-01").values, [], "2026-09-01");
  const checkIns = [
    checkIn("2026-09-01", 72, { waistCm: 30 * 2.54 }),
    checkIn("2026-09-20", 71, { waistCm: 29.5 * 2.54 }),
    checkIn("2026-10-01", 70), // newest check-in, but no waist recorded
  ];
  const standing = describeGoalStanding(withCheckIns(goal, checkIns), "2026-10-02");
  assert.equal(standing.progress.asOf, "2026-09-20");
  assert.equal(standing.progress.startValue, 30 * 2.54); // first waist since the goal was set
  assert.equal(standing.progress.percent, 50);
  assert.equal(standing.headline, "0.5 in to go");
  assert.equal(standing.detail, "50% of the way · latest check-in Sep 20");
  assert.equal(standing.deadline, "90 days left until Dec 31, 2026");
});

test("a goal set before any data waits for its first check-in instead of showing as reached", () => {
  const goal = buildGoal("a", validateGoal(draft({ type: "arm", targetValue: "13" }), today).values, [], today);
  assert.equal(goal.startValue, null);

  const none = describeGoalStanding(withCheckIns(goal, [checkIn("2026-11-26", 70)]), today);
  assert.equal(none.progress.status, "no-data");
  assert.equal(none.headline, "No arm measurement recorded yet");
  assert.equal(none.detail, "Progress will show after a check-in that includes your arm measurement.");
  assert.equal(none.deadline, "36 days left until Dec 31, 2026");

  const first = describeGoalStanding(withCheckIns(goal, [checkIn("2026-11-26", 70, { armCm: 12 * 2.54 })]), today);
  assert.equal(first.progress.status, "in-progress");
  assert.equal(first.progress.percent, 0);
  assert.equal(first.headline, "1 in to go");
});

test("moving away from the target, reaching it, and a passed target date all read clearly", () => {
  const goal = buildGoal("w", validateGoal(draft({ targetValue: "150" }), "2026-09-01").values, [checkIn("2026-09-01", lbToKg(160))], "2026-09-01");

  const away = describeGoalStanding(withCheckIns(goal, [checkIn("2026-09-01", lbToKg(160)), checkIn("2026-09-10", lbToKg(162))]), "2027-01-05");
  assert.equal(away.headline, "12 lb to go");
  assert.equal(away.detail, "Up 2 lb since you started · latest check-in Sep 10");
  assert.equal(away.deadline, "Target date passed (Dec 31, 2026)");

  const reached = describeGoalStanding(withCheckIns(goal, [checkIn("2026-09-01", lbToKg(160)), checkIn("2026-10-01", lbToKg(149))]), "2026-10-02");
  assert.equal(reached.progress.status, "achieved");
  assert.equal(reached.headline, "Goal reached on Oct 1");
  assert.equal(reached.deadline, undefined);
});

test("the chart marks the first weight goal whose target date hasn't passed", () => {
  const weight = (id, targetDate) => ({ ...getGoals()[0], id, type: "weight", targetDate });
  const waist = { ...getGoals()[0], id: "w", type: "waist", targetDate: "2027-01-01" };
  assert.equal(activeWeightGoal([waist, weight("old", "2026-11-24"), weight("next", "2026-11-25"), weight("later", "2027-01-01")], today).id, "next");
  assert.equal(activeWeightGoal([waist, weight("old", "2026-11-24")], today), undefined);
  assert.equal(activeWeightGoal([], today), undefined);
});
