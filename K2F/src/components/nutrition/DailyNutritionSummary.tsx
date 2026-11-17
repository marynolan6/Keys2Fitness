
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import NutritionProgress from "./NutritionProgress";
import { getTotalsForDate } from "../../utils/nutrition";

import type {
  FoodEntry,
  NutritionTotals,
} from "../../utils/nutrition";

// Shared Keys2Fitness theme.
import { colors, radii, spacing } from "@/theme";

/*
 * K2F-126 and K2F-127
 *
 * This component:
 * - Displays daily nutrition totals.
 * - Shows progress toward nutrition goals.
 * - Allows previous-day navigation.
 * - Adds new food entries.
 * - Edits and deletes existing entries.
 * - Validates nutrition input.
 */

// Data passed down from the main Nutrition screen.
type Props = {
  entries: FoodEntry[];
  setEntries: React.Dispatch<React.SetStateAction<FoodEntry[]>>;
  goals: NutritionTotals;
};

// Values entered in the food form.
// Strings are used because TextInput returns text.
type FoodForm = {
  name: string;
  serving: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
};

// Empty form used when adding a new food.
const EMPTY_FORM: FoodForm = {
  name: "",
  serving: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
};

// Convert a date to YYYY-MM-DD using local time.
function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Move forward or backward by a calendar day.
function moveDate(key: string, amount: number): string {
  const [year, month, day] = key.split("-").map(Number);

  return dateKey(new Date(year, month - 1, day + amount));
}

export default function DailyNutritionSummary({
  entries,
  setEntries,
  goals,
}: Props) {
  // Track which day's food entries are visible.
  const [selectedDate, setSelectedDate] = useState(
    () => dateKey(new Date())
  );

  // Controls whether the add/edit form is visible.
  const [showForm, setShowForm] = useState(false);

  // Holds the text entered by the client.
  const [form, setForm] = useState<FoodForm>(EMPTY_FORM);

  // Holds the ID of the entry being edited.
  // Null means the client is adding new food.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Displays validation messages under the form.
  const [error, setError] = useState("");

  const today = dateKey(new Date());

  /*
   * K2F-177: Show only entries for the selected date.
   *
   * When entries or the date change, useMemo
   * updates the visible food list.
   */
  const dailyEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate]
  );

  /*
   * K2F-175: Calculate the selected day's totals.
   *
   * When entries are added, edited, or deleted,
   * totals are automatically recalculated.
   */
  const totals = useMemo(
    () => getTotalsForDate(entries, selectedDate),
    [entries, selectedDate]
  );

  // Convert selected date into readable text.
  const [year, month, day] = selectedDate.split("-").map(Number);

  const displayDate = new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Update one input field without changing the others.
  function updateField(field: keyof FoodForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    // Clear the old error while the client corrects an input.
    setError("");
  }

  // Close the form and remove its temporary values.
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowForm(false);
  }

  // Start adding a new food entry.
  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  /*
   * K2F-159: Edit an existing food entry.
   *
   * Copy the selected entry into the form
   * so the client can change its values.
   */
  function startEditing(entry: FoodEntry) {
    setEditingId(entry.id);

    setForm({
      name: entry.name,
      serving: entry.serving ?? "",
      calories: String(entry.calories),
      protein: String(entry.protein),
      carbs: String(entry.carbs),
      fats: String(entry.fats),
    });

    setError("");
    setShowForm(true);
  }

  /*
   * K2F-158: Validate the food entry.
   *
   * Required fields cannot be empty.
   * Nutrition values must be numeric and nonnegative.
   */
  function saveFood() {
    const name = form.name.trim();
    const serving = form.serving.trim();

    if (!name || !serving) {
      setError("Enter a food name and serving size.");
      return;
    }

    // Validate all four nutrition values before saving.
    const fields = [
      form.calories,
      form.protein,
      form.carbs,
      form.fats,
    ];

    const valid = fields.every((value) => {
      const trimmed = value.trim();

      return (
        trimmed.length > 0 &&
        Number.isFinite(Number(trimmed)) &&
        Number(trimmed) >= 0
      );
    });

    if (!valid) {
      setError(
        "Enter valid numbers greater than or equal to zero."
      );
      return;
    }

    // Convert the validated text into numbers.
    const nutrition = {
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fats: Number(form.fats),
    };

    if (editingId !== null) {
      /*
       * EDIT: Replace the matching food entry.
       *
       * React receives a new array, which causes
       * the nutrition totals to recalculate.
       */
      setEntries((previous) =>
        previous.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                name,
                serving,
                ...nutrition,
              }
            : entry
        )
      );
    } else {
      /*
       * ADD: Create a new food entry.
       *
       * Date = the day the client is currently viewing.
       */
      const newEntry: FoodEntry = {
        id: `${Date.now()}-${Math.random()}`,
        name,
        serving,
        date: selectedDate,
        ...nutrition,
      };

      // Add the new entry without removing existing meals.
      setEntries((previous) => [...previous, newEntry]);
    }

    // Close and clear the form after saving.
    resetForm();
  }

  /*
   * K2F-159: Delete food.
   *
   * Filter removes the entry matching the given ID.
   * Totals then update automatically.
   */
  function deleteFood(id: string) {
    setEntries((previous) =>
      previous.filter((entry) => entry.id !== id)
    );

    // Close any form editing the deleted entry.
    if (editingId === id) {
      resetForm();
    }
  }

  // Move to another day and close an unfinished form.
  function changeSelectedDay(amount: number) {
    setSelectedDate((previous) => moveDate(previous, amount));
    resetForm();
  }

  return (
    <View style={styles.container}>

      {/* K2F-177: Previous-day navigation. */}
      <View style={styles.dateRow}>
        <Pressable
          onPress={() => changeSelectedDay(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          style={styles.dateButton}
        >
          <Text style={styles.arrow}>‹</Text>
        </Pressable>

        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>
            {selectedDate === today ? "Today" : displayDate}
          </Text>

          {selectedDate !== today && (
            <Pressable
              onPress={() => {
                setSelectedDate(today);
                resetForm();
              }}
            >
              <Text style={styles.todayLink}>
                Back to Today
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => changeSelectedDay(1)}
          disabled={selectedDate >= today}
          accessibilityRole="button"
          accessibilityLabel="Next day"
          style={styles.dateButton}
        >
          <Text
            style={[
              styles.arrow,
              selectedDate >= today && styles.disabled,
            ]}
          >
            ›
          </Text>
        </Pressable>
      </View>

      {/* K2F-175 and K2F-176: Reuse existing progress cards. */}
      <NutritionProgress totals={totals} goals={goals} />

      {/* K2F-159: Daily food log. */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Food log</Text>

          <Text style={styles.entryCount}>
            {dailyEntries.length} entries
          </Text>
        </View>

        {/* Display an empty message when no food is logged. */}
        {dailyEntries.length === 0 ? (
          <Text style={styles.emptyText}>
            No food logged for this day.
          </Text>
        ) : (
          dailyEntries.map((entry) => (
            <View key={entry.id} style={styles.foodRow}>
              <Text style={styles.foodIcon}>🍴</Text>

              <View style={styles.foodDetails}>
                <Text style={styles.foodName}>{entry.name}</Text>

                <Text style={styles.foodDescription}>
                  {entry.serving || "Serving not specified"}
                </Text>

                <Text style={styles.foodDescription}>
                  P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fats}g
                </Text>

                <Text style={styles.calories}>
                  {entry.calories} kcal
                </Text>
              </View>

              {/* Edit the selected entry. */}
              <Pressable
                onPress={() => startEditing(entry)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${entry.name}`}
                style={styles.smallButton}
              >
                <Text style={styles.editText}>Edit</Text>
              </Pressable>

              {/* Delete the selected entry. */}
              <Pressable
                onPress={() => {
                  // Confirm deletion before removing the food.
                  // On web, use an inline delete action because
                  // Alert.alert is not consistently supported.
                  deleteFood(entry.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${entry.name}`}
                style={styles.smallButton}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}

        {/* K2F-157: Open the food-entry form. */}
        {!showForm && (
          <Pressable
            style={styles.addButton}
            onPress={openAddForm}
            accessibilityRole="button"
          >
            <Text style={styles.addText}>+ Add Food</Text>
          </Pressable>
        )}
      </View>

      {/* K2F-157 and K2F-158: Food-entry form. */}
      {showForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {editingId ? "Edit Food" : "Add Food"}
          </Text>

          <Text style={styles.formSubtitle}>
            Logging for {displayDate}
          </Text>

          {/* Food name. */}
          <Text style={styles.label}>Food name</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Chicken and Rice"
            value={form.name}
            onChangeText={(value) => updateField("name", value)}
          />

          {/* Serving size. */}
          <Text style={styles.label}>Serving</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: 1 plate"
            value={form.serving}
            onChangeText={(value) => updateField("serving", value)}
          />

          {/* Numeric nutrition inputs. */}
          {(
            [
              ["calories", "Calories (kcal)"],
              ["protein", "Protein (g)"],
              ["carbs", "Carbs (g)"],
              ["fats", "Fats (g)"],
            ] as const
          ).map(([field, label]) => (
            <View key={field}>
              <Text style={styles.label}>{label}</Text>

              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="decimal-pad"
                value={form[field]}
                onChangeText={(value) =>
                  updateField(field, value)
                }
              />
            </View>
          ))}

          {/* Explain invalid input without adding the entry. */}
          {error !== "" && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Pressable
            style={styles.addButton}
            onPress={saveFood}
            accessibilityRole="button"
          >
            <Text style={styles.addText}>
              {editingId ? "Save Changes" : "Save Food"}
            </Text>
          </Pressable>

          <Pressable
            onPress={resetForm}
            style={styles.cancelButton}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/*
 * STYLING
 *
 * Uses the Keys2Fitness theme and rounded Figma cards.
 */
const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },

  dateButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  dateCenter: {
    alignItems: "center",
  },

  arrow: {
    fontSize: 32,
    color: colors.primaryDark,
  },

  disabled: {
    color: "#AABBC7",
  },

  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  todayLink: {
    marginTop: 5,
    color: colors.primaryDark,
    fontWeight: "600",
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    gap: 12,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 23,
    color: colors.text,
    fontWeight: "500",
  },

  entryCount: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  foodIcon: {
    fontSize: 20,
  },

  foodDetails: {
    flex: 1,
    minWidth: 0,
  },

  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  foodDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  calories: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
  },

  smallButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  editText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
  },

  deleteText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 12,
  },

  emptyText: {
    color: colors.textMuted,
    marginVertical: 12,
  },

  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },

  addText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  formSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },

  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },

  cancelButton: {
    padding: 12,
    alignItems: "center",
  },

  cancelText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});