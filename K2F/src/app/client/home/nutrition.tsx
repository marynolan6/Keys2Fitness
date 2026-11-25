/*
 * K2F-127: Daily Nutrition Totals
 * K2F-126: Food Logging Integration
 *
 * This screen allows clients to:
 * - View daily calories, protein, carbs, and fats.
 * - Compare their nutrition totals against daily goals.
 * - See visual progress bars.
 * - Navigate to previous days.
 * - Review food entries for the selected day.
 * - Add, edit, and delete food entries.
 *
 * The layout follows the Keys2Fitness Figma design.
 * It uses the shared gradient background from theme.ts.
 */

import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Allows us to customize the navigation header.
import { Stack } from "expo-router";

// Reuse the shared Keys2Fitness gradient background.
import { ThemedBackground } from "@/components/ThemedBackground";

// Keep the K2FBrand component imported from main.
// Only keep this import if the component is used in the screen.
import { K2FBrand } from "@/components/K2FBrand";

// Import the shared Keys2Fitness theme settings.
// These control the colors, spacing, and screen width.
import {
  colors,
  layout,
  spacing,
  typography,
} from "../../../theme";

// K2F-127: Displays daily totals, goal progress, and date navigation.
import DailyNutritionSummary from "../../../components/nutrition/DailyNutritionSummary";

// Import types for food entries and nutrition goals.
import type {
  FoodEntry,
  NutritionTotals,
} from "../../../utils/nutrition";

// Temporary daily nutrition goals for Sprint 4 testing.
// These will eventually be replaced with client-specific goals.
const demoGoals: NutritionTotals = {
  calories: 2000,
  protein: 150,
  carbs: 220,
  fats: 65,
};

/*
 * getDateKey()
 *
 * Creates a date in YYYY-MM-DD format.
 *
 * daysAgo = 0 means today.
 * daysAgo = 1 means yesterday.
 *
 * This helps organize food entries by calendar date.
 */
function getDateKey(daysAgo = 0): string {
  const date = new Date();

  // Move backward by the requested number of days.
  date.setDate(date.getDate() - daysAgo);

  // Get the year, month, and day using local time.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Example: 2026-11-17
  return `${year}-${month}-${day}`;
}

/*
 * NutritionScreen()
 *
 * Main Nutrition screen for clients.
 *
 * Displays:
 * - Keys2Fitness branding
 * - Nutrition page heading
 * - Daily calorie and macro progress
 * - Previous-day navigation
 * - Food entries and food-entry management
 */
export default function NutritionScreen() {

  /*
   * K2F-126 and K2F-127: Food entry state
   *
   * foodEntries:
   * Stores the current list of logged food.
   *
   * setFoodEntries:
   * Updates the food list when clients add,
   * edit, or delete an entry.
   *
   * React automatically re-renders the nutrition
   * summary when this state changes.
   *
   * Sample entries are used for Sprint 4 testing.
   * Firebase persistence can be added later.
   */
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([
    {
      id: "1",
      name: "Eggs",
      serving: "2 eggs",
      date: getDateKey(), // Today's date.
      calories: 150,
      protein: 12,
      carbs: 1,
      fats: 10,
    },
    {
      id: "2",
      name: "Chicken and Rice",
      serving: "1 plate",
      date: getDateKey(), // Today's date.
      calories: 500,
      protein: 40,
      carbs: 60,
      fats: 8,
    },
    {
      id: "3",
      name: "Oatmeal",
      serving: "1 cup",
      date: getDateKey(1), // Yesterday's date.
      calories: 300,
      protein: 10,
      carbs: 55,
      fats: 5,
    },
  ]);

  return (
    /*
     * Use the shared Keys2Fitness gradient.
     *
     * This replaces the old solid blue background
     * and matches the Workout History screen.
     */
    <ThemedBackground>

      {/* Set the navigation header title to Nutrition. */}
      <Stack.Screen options={{ title: "Nutrition" }} />

        {/* Keep keyboard taps working while clients use the food-entry form. */}
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        >
            
        {/* Center the screen content on desktop and mobile. */}
        <View style={styles.content}>

        {/* Display the shared Keys2Fitness branding component from main. */}
        <K2FBrand />

          {/* Main Nutrition page heading. */}
          <Text style={styles.title}>
            Nutrition
          </Text>

          {/* Subtitle displayed below the Nutrition heading. */}
          <Text style={styles.subtitle}>
            Fuel your progress, one meal at a time.
          </Text>

          {/*
            K2F-127: Daily Nutrition Summary

            This component handles the following:

            K2F-175:
            Calculate daily calories, protein, carbs, and fats.

            K2F-176:
            Compare nutrition totals against goals using
            progress bars.

            K2F-177:
            Navigate between previous days and display
            the selected day's food entries and totals.

            K2F-126:
            Add, edit, and delete food entries.

            entries = Food the client has logged.
            setEntries = Function to update logged food.
            goals = The client's daily nutrition targets.
          */}
          <DailyNutritionSummary
            entries={foodEntries}
            setEntries={setFoodEntries}
            goals={demoGoals}
          />

        </View>
      </ScrollView>

    </ThemedBackground>
  );
}

/*
 * STYLING
 *
 * Uses values from the shared theme.ts file.
 *
 * The gradient is handled by ThemedBackground,
 * so no backgroundColor is needed here.
 */
const styles = StyleSheet.create({

  // Allows the ScrollView to fill the available screen.
  scrollView: {
    flex: 1,
  },

  // Adds padding around the Nutrition page.
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,

    // Leave extra space so the bottom navigation
    // doesn't cover the Food Log section.
    paddingBottom: 110,

    // Center content horizontally on larger screens.
    alignItems: "center",
  },

  // Prevent nutrition cards from stretching too wide on desktop.
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
  },

    // Large Nutrition heading matching the Figma design.
    title: {
    marginTop: spacing.sm,
    fontSize: typography.title,
    fontWeight: "400",
    color: colors.text,
    },

  // Description displayed below the Nutrition heading.
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
