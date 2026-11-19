import { draftNutritionPlan, type NutritionPlan, validateNutritionPlan } from "./nutritionPlan";
import type { Nutrient } from "../utils/nutrition";

export function createNutritionEditorState(plan: NutritionPlan) {
  return { status: "editing" as "editing" | "saved", draft: draftNutritionPlan(plan), expectedRevision: plan.revision,
    errors: {} as ReturnType<typeof validateNutritionPlan>, message: "" };
}
type Action = { type: "target"; key: Nutrient; value: string } | { type: "tip"; value: string }
  | { type: "invalid"; errors: ReturnType<typeof validateNutritionPlan> } | { type: "failed"; message: string } | { type: "saved" };

export function nutritionEditorReducer(state: ReturnType<typeof createNutritionEditorState>, action: Action) {
  if (state.status === "saved") return state;
  switch (action.type) {
    case "target": return { ...state, draft: { ...state.draft, targets: { ...state.draft.targets, [action.key]: action.value } },
      errors: { ...state.errors, [action.key]: undefined }, message: "" };
    case "tip": return { ...state, draft: { ...state.draft, tip: action.value }, message: "" };
    case "invalid": return { ...state, errors: action.errors };
    case "failed": return { ...state, message: action.message };
    case "saved": return { ...state, status: "saved" as const };
  }
}
