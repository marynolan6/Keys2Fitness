import type { FoodEntry } from "../utils/nutrition";
import { targetsFromDraft, type NutritionPlan, type NutritionPlanDraft } from "./nutritionPlan";

export type ClientNutrition = { plan: NutritionPlan; entries: FoodEntry[] };
export type NutritionState = Readonly<Record<string, ClientNutrition>>;

// Shared, in-memory prototype adapter. Target updates and food edits are separate
// operations so a new goal can never rewrite the quantities a client logged.
export function createNutritionRepository(initial: NutritionState) {
  let state: NutritionState = JSON.parse(JSON.stringify(initial));
  const listeners = new Set<() => void>();
  function client(id: string) {
    const value = Object.hasOwn(state, id) ? state[id] : undefined;
    if (!value) throw new Error("This demo client's nutrition plan is unavailable.");
    return value;
  }
  function publish(id: string, next: ClientNutrition) {
    state = { ...state, [id]: next };
    listeners.forEach((listener) => listener());
  }
  return {
    getState: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    savePlan(id: string, draft: NutritionPlanDraft, expectedRevision: number) {
      const current = client(id);
      if (current.plan.revision !== expectedRevision) throw new Error("This plan changed. Close and reopen the editor before saving again.");
      const targets = targetsFromDraft(draft);
      publish(id, { ...current, plan: { targets, tip: draft.tip.trim(), revision: current.plan.revision + 1 } });
    },
    updateFood(id: string, update: (entries: FoodEntry[]) => FoodEntry[]) {
      const current = client(id);
      publish(id, { ...current, entries: update(current.entries) });
    },
  };
}
