
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Import the function that calculates progress percentages.
import { getGoalPercentage } from "../../utils/nutrition";

// Import the type that defines calories, protein, carbs, and fats.
import type { NutritionTotals } from "../../utils/nutrition";

/*
 * K2F-176: Build Goal-Progress Summary
 *
 * This component compares a client's daily nutrition totals
 * against their nutrition goals.
 *
 * It displays:
 * - A separate card for daily calories
 * - Progress bars for protein, carbs, and fats
 * - The amount of calories remaining
 * - Orange progress bars when a goal is exceeded
 */

// These values are passed from the daily nutrition summary.
type Props = {
  totals: NutritionTotals; // How much the client has consumed.
  goals: NutritionTotals;  // The client's daily nutrition targets.
};

/*
 * ProgressBar Component
 *
 * Creates a progress bar showing how close a client
 * is to reaching a nutrition goal.
 */
function ProgressBar({
  current,
  goal,
}: {
  current: number;
  goal: number;
}) {
  // Calculate the percentage of the goal completed.
  // Example: 50 out of 100 = 50%.
  const percent = getGoalPercentage(current, goal);

  // Check whether the client has exceeded the goal.
  const overGoal = goal > 0 && current > goal;

  // Limit the visible bar to 100% so it doesn't overflow.
  const barWidth = Math.min(100, Math.max(0, percent));

  return (
    <View>
      {/* Gray background represents the full nutrition goal. */}
      <View style={styles.track}>

        {/* Blue shows normal progress; orange means over goal. */}
        <View
          style={[
            styles.fill,
            {
              width: `${barWidth}%`,

              // Change the bar color when the goal is exceeded.
              backgroundColor: overGoal
                ? "#E58A50"
                : "#5B9FD5",
            },
          ]}
        />
      </View>

      {/* Display a warning when the client exceeds their goal. */}
      {overGoal && (
        <Text style={styles.overGoal}>
          Over goal by {Math.round(current - goal)}
        </Text>
      )}
    </View>
  );
}

/*
 * MacroRow Component
 *
 * Displays one macronutrient:
 * Protein, Carbs, or Fat.
 *
 * Each row shows:
 * - Nutrient name
 * - Amount consumed / daily goal
 * - Progress bar
 */
function MacroRow({
  label,
  current,
  goal,
}: {
  label: string;
  current: number;
  goal: number;
}) {
  return (
    <View style={styles.macroRow}>

      {/* Display the nutrient name and values. */}
      <View style={styles.macroHeading}>
        <Text style={styles.macroLabel}>
          {label}
        </Text>

        <Text style={styles.macroValue}>
          {current} / {goal} g
        </Text>
      </View>

      {/* Reuse the same progress bar for every macro. */}
      <ProgressBar current={current} goal={goal} />
    </View>
  );
}

/*
 * Main NutritionProgress Component
 *
 * Displays the daily calorie goal and macronutrient goals.
 *
 * The totals automatically update when the parent component
 * passes updated food-entry totals.
 */
export default function NutritionProgress({
  totals,
  goals,
}: Props) {

  // Calculate remaining calories.
  // Example: 2000 goal - 650 consumed = 1350 remaining.
  const remaining = goals.calories - totals.calories;

  // Calculate the percentage of daily calories consumed.
  const percent = Math.round(
    getGoalPercentage(totals.calories, goals.calories)
  );

  return (
    <View style={styles.container}>

      {/* ========================================
          CARD 1: DAILY CALORIE GOAL
          K2F-175 and K2F-176
      ======================================== */}

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          Daily calorie goal
        </Text>

        {/* Show calories consumed next to the daily goal. */}
        <View style={styles.calorieRow}>

          {/* Calories consumed from logged meals. */}
          <View>
            <Text style={styles.calorieNumber}>
              {totals.calories.toLocaleString()}
            </Text>

            <Text style={styles.caption}>
              Calories logged
            </Text>
          </View>

          {/* Daily calorie goal. */}
          <View>
            <Text style={styles.calorieNumber}>
              {goals.calories.toLocaleString()}
            </Text>

            <Text style={styles.caption}>
              Daily goal
            </Text>
          </View>
        </View>

        {/* Show progress toward the daily calorie goal. */}
        <ProgressBar
          current={totals.calories}
          goal={goals.calories}
        />

        {/* Display remaining calories or exceeded calories. */}
        <Text style={styles.remainingText}>
          {goals.calories > 0
            ? `${percent}% of your goal · ${
                remaining >= 0
                  ? `${remaining} kcal remaining`
                  : `${Math.abs(remaining)} kcal over`
              }`
            : "No calorie goal set"}
        </Text>
      </View>

      {/* ========================================
          CARD 2: MACRONUTRIENT GOALS
          K2F-176
      ======================================== */}

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          Your macros
        </Text>

        {/* Protein progress bar. */}
        <MacroRow
          label="Protein"
          current={totals.protein}
          goal={goals.protein}
        />

        {/* Carbohydrate progress bar. */}
        <MacroRow
          label="Carbs"
          current={totals.carbs}
          goal={goals.carbs}
        />

        {/* Fat progress bar. */}
        <MacroRow
          label="Fat"
          current={totals.fats}
          goal={goals.fats}
        />
      </View>
    </View>
  );
}

/*
 * STYLING
 *
 * Uses Keys2Fitness colors inspired by the Figma design.
 * White rounded cards are displayed over the blue background.
 */
const styles = StyleSheet.create({

  // Container holding both nutrition cards.
  container: {
    gap: 14,
  },

  // White rounded cards for calories and macros.
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    gap: 12,
  },

  // Heading inside each nutrition card.
  cardTitle: {
    fontSize: 23,
    fontWeight: "500",
    color: "#182A39",
    marginBottom: 4,
  },

  // Places calories consumed and daily goal side by side.
  calorieRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 16,
  },

  // Large calorie numbers.
  calorieNumber: {
    fontSize: 31,
    fontWeight: "500",
    color: "#182A39",
  },

  // Small text underneath calorie numbers.
  caption: {
    fontSize: 13,
    color: "#687D8B",
    fontWeight: "600",
    marginTop: 3,
  },

  // Gray background of each progress bar.
  track: {
    height: 10,
    backgroundColor: "#E5EFF5",
    borderRadius: 20,
    overflow: "hidden",
  },

  // Colored portion showing completed progress.
  fill: {
    height: "100%",
    borderRadius: 20,
  },

  // Text displaying remaining calories.
  remainingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2176A9",
  },

  // Spacing between protein, carbs, and fat rows.
  macroRow: {
    gap: 8,
    marginBottom: 8,
  },

  // Places macro names and values on the same row.
  macroHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Protein, Carbs, and Fat labels.
  macroLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F303E",
  },

  // Current macro intake compared with its goal.
  macroValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F303E",
  },

  // Orange warning when a nutrition goal is exceeded.
  overGoal: {
    color: "#C36B35",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
