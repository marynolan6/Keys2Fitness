import type { NutritionTargets } from "../utils/nutrition";
import { nutrients } from "../utils/nutrition";

export type NutritionPlan = {
  targets: NutritionTargets;
  tip: string;
  revision: number;
};
export type NutritionPlanDraft = { targets: Record<keyof NutritionTargets, string>; tip: string };

export const unassignedNutritionTargets = (): NutritionTargets => ({ calories: null, protein: null, carbs: null, fats: null });

export function draftNutritionPlan(plan: NutritionPlan): NutritionPlanDraft {
  return { targets: {
    calories: plan.targets.calories?.toString() ?? "", protein: plan.targets.protein?.toString() ?? "",
    carbs: plan.targets.carbs?.toString() ?? "", fats: plan.targets.fats?.toString() ?? "",
  }, tip: plan.tip };
}

export function validateNutritionPlan(draft: NutritionPlanDraft) {
  const errors: Partial<Record<keyof NutritionTargets, string>> = {};
  for (const key of nutrients) {
    const text = draft.targets[key].trim();
    if (text !== "" && (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text)) || Number(text) > Number.MAX_SAFE_INTEGER)) {
      errors[key] = "Enter zero or a positive number, or leave blank for Not assigned.";
    }
  }
  return errors;
}

export function targetsFromDraft(draft: NutritionPlanDraft): NutritionTargets {
  const errors = validateNutritionPlan(draft);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return Object.fromEntries(nutrients.map((key) => [key, draft.targets[key].trim() === "" ? null : Number(draft.targets[key])])) as NutritionTargets;
}
