import { useSyncExternalStore } from "react";
import { demoClients } from "@/clients/mockClients";
import { nutritionDate } from "@/utils/nutrition";
import { createNutritionRepository, type ClientNutrition } from "./nutritionRepository";
import { unassignedNutritionTargets } from "./nutritionPlan";

const samples: Record<string, ClientNutrition> = {
  "1": { plan: { revision: 0, targets: { calories: 2400, protein: 180, carbs: 280, fats: 75 },
    tip: "Spencer: spread your protein across meals and include a meal after your strength session." }, entries: [
    { id: "spencer-breakfast", name: "Oatmeal", serving: "1 bowl", date: nutritionDate(), calories: 300, protein: 10, carbs: 55, fats: 5 },
  ] },
  "2": { plan: { revision: 0, targets: { calories: 2000, protein: 150, carbs: 220, fats: 65 },
    tip: "Alex: plan a protein source and vegetables with lunch. Keep logging portions so we can review your week together." }, entries: [
    { id: "alex-eggs", name: "Eggs", serving: "2 eggs", date: nutritionDate(), calories: 150, protein: 12, carbs: 1, fats: 10 },
    { id: "alex-lunch", name: "Chicken and Rice", serving: "1 plate", date: nutritionDate(), calories: 500, protein: 40, carbs: 60, fats: 8 },
    { id: "alex-yesterday", name: "Oatmeal", serving: "1 cup", date: nutritionDate(1), calories: 300, protein: 10, carbs: 55, fats: 5 },
  ] },
  "3": { plan: { revision: 0, targets: { calories: 2100, protein: null, carbs: 250, fats: null }, tip: "" }, entries: [] },
};

export const nutritionRepository = createNutritionRepository(Object.fromEntries(demoClients.map(({ id }) => [id,
  samples[id] ?? { plan: { revision: 0, targets: unassignedNutritionTargets(), tip: "" }, entries: [] },
])));

export function useClientNutrition(clientId: string) {
  const state = useSyncExternalStore(nutritionRepository.subscribe, nutritionRepository.getState, nutritionRepository.getState);
  return Object.hasOwn(state, clientId) ? state[clientId] : undefined;
}
