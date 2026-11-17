
/**
 * K2F-127: Daily nutrition calculations
 *
 * This file calculates calories and macros from logged meals.
 * It supports K2F-175 and K2F-177.
 */

// Defines the information stored for each logged food.
export type FoodEntry = {
  id: string;
  name: string;
  serving?: string; // Example: "2 eggs" or "1 cup"
  date: string;      // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

// Defines the daily nutrition goals.
export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

// Starts every total at zero.
export const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

/**
 * Adds the nutrition values from all food entries.
 *
 * When there are no entries, all totals remain zero.
 */
export function calculateDailyTotals(
  entries: FoodEntry[]
): NutritionTotals {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    { ...EMPTY_TOTALS }
  );
}

/**
 * Filters meals to the selected day before calculating totals.
 */
export function getTotalsForDate(
  entries: FoodEntry[],
  selectedDate: string
): NutritionTotals {
  const dailyEntries = entries.filter(
    (entry) => entry.date === selectedDate
  );

  return calculateDailyTotals(dailyEntries);
}

/**
 * Calculates progress toward a goal as a percentage.
 * A goal of zero returns 0 to avoid division by zero.
 */
export function getGoalPercentage(
  current: number,
  goal: number
): number {
  if (goal <= 0) return 0;

  return (current / goal) * 100;
}