export const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;
export type Meal = (typeof meals)[number];

export type FoodEntry = NutritionTotals & {
  id: string;
  name: string;
  serving?: string;
  date: string; // Local YYYY-MM-DD
  meal: Meal;
};

export const nutrients = ["calories", "protein", "carbs", "fats"] as const;
export type Nutrient = (typeof nutrients)[number];
export type NutritionTotals = Record<Nutrient, number>;
// Missing is different from an explicit zero target.
export type NutritionTargets = Record<Nutrient, number | null>;
export const nutrientLabels: Record<Nutrient, { label: string; unit: string }> = {
  calories: { label: "Calories", unit: "kcal" },
  protein: { label: "Protein", unit: "g" },
  carbs: { label: "Carbohydrates", unit: "g" },
  fats: { label: "Fat", unit: "g" },
};

export function foodEntryErrors(form: Record<"name" | "serving" | Nutrient, string>) {
  const errors: Partial<Record<keyof typeof form, string>> = {};
  if (!form.name.trim()) errors.name = "Enter a food name.";
  if (!form.serving.trim()) errors.serving = "Enter a serving, such as 1 bowl.";
  for (const key of nutrients) {
    const value = Number(form[key]);
    if (!form[key].trim() || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
      errors[key] = `Enter ${nutrientLabels[key].label.toLowerCase()} as zero or a positive number.`;
    }
  }
  return errors;
}

export function compareNutrition(current: number, target: number | null) {
  if (target === null) return { status: "unassigned" as const, percent: null, remaining: null };
  if (target === 0) return { status: "zero-target" as const, percent: null, remaining: -current };
  return { status: "assigned" as const, percent: Math.min(100, Math.max(0, current / target * 100)), remaining: target - current };
}

export function nutritionDate(daysAgo = 0, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDailyNutrition(entries: readonly FoodEntry[], date: string) {
  const byMeal: Record<Meal, FoodEntry[]> = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  const totals: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  let count = 0;
  for (const entry of entries) {
    if (entry.date !== date) continue;
    byMeal[entry.meal].push(entry);
    count++;
    for (const nutrient of nutrients) totals[nutrient] += entry[nutrient];
  }
  return { byMeal, count, totals };
}
