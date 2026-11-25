import assert from "node:assert/strict";
import test from "node:test";
import { registerSourceTypes } from "./helpers/source-types.mjs";

const hooks = registerSourceTypes();
const { createNutritionRepository } = await import("../src/nutrition/nutritionRepository.ts");
const { draftNutritionPlan, targetsFromDraft, unassignedNutritionTargets, validateNutritionPlan } = await import("../src/nutrition/nutritionPlan.ts");
const { createNutritionEditorState, nutritionEditorReducer: reduce } = await import("../src/nutrition/nutritionEditorReducer.ts");
const { compareNutrition, getDailyNutrition, nutritionDate } = await import("../src/utils/nutrition.ts");
hooks.deregister();

const lunch = { id: "lunch", name: "Lunch", meal: "Lunch", serving: "1 plate", date: "2026-11-20", calories: 650, protein: 52, carbs: 61, fats: 18 };
function initial() {
  return {
    alex: { plan: { revision: 0, targets: { calories: 2000, protein: 150, carbs: 220, fats: 65 }, tip: "Alex's plan tip" },
      entries: [lunch, { ...lunch, id: "yesterday", date: "2026-11-19", calories: 500 }] },
    spencer: { plan: { revision: 0, targets: { calories: 2400, protein: 180, carbs: 280, fats: 75 }, tip: "Spencer's tip" }, entries: [] },
    jordan: { plan: { revision: 0, targets: unassignedNutritionTargets(), tip: "" }, entries: [] },
  };
}

test("nutrition plans are client-specific and unknown clients have no default plan", () => {
  const repo = createNutritionRepository(initial());
  assert.equal(repo.getState().alex.plan.targets.calories, 2000);
  assert.equal(repo.getState().spencer.plan.targets.calories, 2400);
  assert.equal(repo.getState().jordan.plan.targets.calories, null);
  assert.equal(repo.getState().jordan.plan.tip, "");
  assert.equal(repo.getState().missing, undefined);
  assert.throws(() => repo.savePlan("missing", draftNutritionPlan(repo.getState().alex.plan), 0), /unavailable/);
  assert.throws(() => repo.updateFood("missing", () => []), /unavailable/);
});

test("a coach update publishes the new scoped plan and leaves all logged foods and other clients intact", () => {
  const repo = createNutritionRepository(initial());
  const before = repo.getState();
  const today = getDailyNutrition(before.alex.entries, "2026-11-20");
  const yesterday = getDailyNutrition(before.alex.entries, "2026-11-19");
  assert.deepEqual(today.byMeal.Lunch, [lunch]);
  let published = 0;
  const unsubscribe = repo.subscribe(() => published++);
  const draft = draftNutritionPlan(before.alex.plan);
  draft.targets.calories = "1800";
  draft.targets.protein = "";
  draft.tip = "Updated by coach for Alex";
  repo.savePlan("alex", draft, 0);
  const after = repo.getState();
  assert.equal(published, 1);
  assert.equal(after.alex.plan.targets.calories, 1800);
  assert.equal(after.alex.plan.targets.protein, null);
  assert.equal(after.alex.plan.tip, "Updated by coach for Alex");
  assert.equal(after.alex.entries, before.alex.entries);
  assert.equal(after.spencer, before.spencer);
  assert.equal(after.jordan, before.jordan);
  assert.deepEqual(getDailyNutrition(after.alex.entries, "2026-11-20"), today);
  assert.deepEqual(getDailyNutrition(after.alex.entries, "2026-11-19"), yesterday);
  assert.notEqual(compareNutrition(today.totals.calories, after.alex.plan.targets.calories).percent,
    compareNutrition(today.totals.calories, before.alex.plan.targets.calories).percent);
  unsubscribe();
});

test("all missing, partial, explicit zero and over-target comparisons remain distinct and finite", () => {
  assert.deepEqual(compareNutrition(100, null), { status: "unassigned", percent: null, remaining: null });
  assert.deepEqual(compareNutrition(0, 0), { status: "zero-target", percent: null, remaining: -0 });
  assert.deepEqual(compareNutrition(5, 0), { status: "zero-target", percent: null, remaining: -5 });
  assert.deepEqual(compareNutrition(0, 100), { status: "assigned", percent: 0, remaining: 100 });
  assert.deepEqual(compareNutrition(50, 100), { status: "assigned", percent: 50, remaining: 50 });
  assert.deepEqual(compareNutrition(125, 100), { status: "assigned", percent: 100, remaining: -25 });
  const draft = draftNutritionPlan(initial().alex.plan);
  draft.targets.protein = "";
  draft.targets.fats = "0";
  assert.deepEqual(targetsFromDraft(draft), { calories: 2000, protein: null, carbs: 220, fats: 0 });
});

test("clearing tips/targets creates a genuine missing state rather than a fallback recommendation or zero", () => {
  const repo = createNutritionRepository(initial());
  const draft = { targets: { calories: "", protein: "", carbs: "", fats: "" }, tip: "  " };
  repo.savePlan("alex", draft, 0);
  assert.deepEqual(repo.getState().alex.plan.targets, unassignedNutritionTargets());
  assert.equal(repo.getState().alex.plan.tip, "");
  assert.equal(repo.getState().spencer.plan.tip, "Spencer's tip");
});

test("food edits remain client-scoped and cannot change assigned goals or the other day's totals", () => {
  const repo = createNutritionRepository(initial());
  const before = repo.getState();
  repo.updateFood("alex", (entries) => [...entries, { ...lunch, id: "extra", calories: 150 }]);
  assert.equal(repo.getState().alex.plan, before.alex.plan);
  assert.equal(repo.getState().spencer, before.spencer);
  assert.equal(getDailyNutrition(repo.getState().alex.entries, "2026-11-20").totals.calories, 800);
  assert.equal(getDailyNutrition(repo.getState().alex.entries, "2026-11-19").totals.calories, 500);
});

test("invalid goals fail without publishing, preserving the editable draft and existing food log", () => {
  const repo = createNutritionRepository(initial());
  const before = repo.getState();
  let state = createNutritionEditorState(before.alex.plan);
  state = reduce(state, { type: "tip", value: "Unsaved tip" });
  for (const value of ["-1", "NaN", "Infinity", "1e4", "99999999999999999999"]) {
    state = reduce(state, { type: "target", key: "calories", value });
    assert.ok(validateNutritionPlan(state.draft).calories);
    assert.throws(() => repo.savePlan("alex", state.draft, 0));
    assert.equal(state.draft.tip, "Unsaved tip");
    assert.equal(repo.getState(), before);
  }
  state = reduce(state, { type: "target", key: "calories", value: "2100.5" });
  repo.savePlan("alex", state.draft, 0);
  assert.equal(repo.getState().alex.plan.targets.calories, 2100.5);
  const saved = reduce(state, { type: "saved" });
  assert.equal(reduce(saved, { type: "tip", value: "late edit" }), saved);
});

test("adding, moving and deleting food keeps each row in one meal on the selected day", () => {
  const repo = createNutritionRepository(initial());
  const summary = () => getDailyNutrition(repo.getState().alex.entries, lunch.date);
  assert.deepEqual(summary().byMeal, { Breakfast: [], Lunch: [lunch], Dinner: [], Snacks: [] });
  const snack = { ...lunch, id: "fruit", meal: "Snacks", calories: 80 };
  repo.updateFood("alex", (entries) => [...entries, snack]);
  const before = summary();
  assert.equal(before.count, 2);
  assert.equal(before.totals.calories, 730);
  repo.updateFood("alex", (entries) => entries.map((entry) => entry.id === snack.id ? { ...entry, meal: "Dinner" } : entry));
  const moved = summary();
  assert.deepEqual(moved.byMeal.Dinner.map((e) => e.id), [snack.id]);
  assert.deepEqual(moved.byMeal.Snacks, []);
  assert.deepEqual(moved.totals, before.totals);
  assert.equal(moved.count, before.count);
  repo.updateFood("alex", (entries) => entries.filter((e) => e.id !== snack.id));
  assert.deepEqual(summary().byMeal.Dinner, []);
  assert.equal(summary().totals.calories, 650);
  assert.equal(getDailyNutrition(repo.getState().alex.entries, "2026-11-19").totals.calories, 500);
  assert.equal(getDailyNutrition(repo.getState().spencer.entries, lunch.date).count, 0);
});

test("stale and duplicate coach updates are rejected without changing the newest plan; draft stays reviewable", () => {
  const repo = createNutritionRepository(initial());
  let state = createNutritionEditorState(repo.getState().alex.plan);
  state = reduce(state, { type: "target", key: "calories", value: "1900" });
  const other = draftNutritionPlan(repo.getState().alex.plan);
  other.targets.calories = "2200";
  repo.savePlan("alex", other, 0);
  assert.throws(() => repo.savePlan("alex", state.draft, state.expectedRevision), /changed/);
  state = reduce(state, { type: "failed", message: "This plan changed" });
  assert.equal(state.draft.targets.calories, "1900");
  assert.equal(repo.getState().alex.plan.targets.calories, 2200);
  assert.throws(() => repo.savePlan("alex", other, 0), /changed/);
});

test("calendar-day nutrition navigation works across month and year boundaries", () => {
  assert.equal(nutritionDate(1, new Date(2027, 0, 1, 12)), "2026-12-31");
  assert.equal(nutritionDate(-1, new Date(2026, 1, 28, 12)), "2026-03-01");
});
