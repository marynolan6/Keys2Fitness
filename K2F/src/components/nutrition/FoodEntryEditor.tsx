import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BuilderButton, BuilderField, builderStyles } from "@/components/WorkoutBuilderControls";
import { foodEntryErrors, meals, nutrientLabels, nutrients, type FoodEntry, type Meal } from "@/utils/nutrition";
import { colors, layout, radii, spacing, typography } from "@/theme";
import { NutritionDialog } from "./NutritionDialog";

export function FoodEntryEditor({ initialMeal, entry, date, context, onSave, onDelete, onClose }: {
  initialMeal: Meal; entry?: FoodEntry; date: string; context: string; onSave: (value: FoodEntry) => void; onDelete: (id: string) => void; onClose: () => void;
}) {
  const [meal, setMeal] = useState(initialMeal);
  const [form, setForm] = useState(() => ({ name: entry?.name ?? "", serving: entry?.serving ?? "",
    calories: entry?.calories.toString() ?? "", protein: entry?.protein.toString() ?? "",
    carbs: entry?.carbs.toString() ?? "", fats: entry?.fats.toString() ?? "" }));
  const [attempted, setAttempted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errors = foodEntryErrors(form);
  function field(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function save() {
    setAttempted(true);
    if (Object.keys(errors).length) return;
    onSave({ id: entry?.id ?? `food-${Date.now()}-${Math.random()}`, date, meal, name: form.name.trim(), serving: form.serving.trim(),
      calories: Number(form.calories), protein: Number(form.protein), carbs: Number(form.carbs), fats: Number(form.fats) });
  }
  if (entry && confirmDelete) return <NutritionDialog title="Delete this food?" closeLabel="Keep food" onClose={() => setConfirmDelete(false)}
    primary={{ label: "Delete food", danger: true, onPress: () => onDelete(entry.id) }}>
    <Text style={builderStyles.label}>{entry.name}</Text>
    <Text style={builderStyles.muted}>{context} · {entry.meal}. Its nutrients will be removed from this day’s totals.</Text>
  </NutritionDialog>;
  return <NutritionDialog title={entry ? "Edit food" : "Add food"} closeLabel="Cancel" onClose={onClose}
    message={attempted ? Object.values(errors)[0] : undefined}
    primary={{ label: entry ? "Save changes" : "Save food", onPress: save }}>
    <Text style={builderStyles.muted}>{context}</Text>
    <Text style={builderStyles.label}>Meal</Text>
    <View style={styles.meals}>
      {meals.map((choice) => <Pressable accessibilityRole="radio" accessibilityLabel={choice} accessibilityState={{ checked: choice === meal }} key={choice}
        onPress={() => setMeal(choice)} style={({ pressed }) => [styles.meal, choice === meal && styles.selected, pressed && builderStyles.pressed]}>
        <Text style={[styles.mealText, choice === meal && styles.selectedText]}>{choice}</Text>
      </Pressable>)}
    </View>
    <BuilderField label="Food name" value={form.name} error={attempted ? errors.name : undefined} onChange={(value) => field("name", value)} />
    <BuilderField label="Serving" value={form.serving} error={attempted ? errors.serving : undefined} onChange={(value) => field("serving", value)} />
    {nutrients.map((key) => <BuilderField key={key} label={`${nutrientLabels[key].label} (${nutrientLabels[key].unit})`}
      value={form[key]} keyboardType="decimal-pad" error={attempted ? errors[key] : undefined} onChange={(value) => field(key, value)} />)}
    {entry && <BuilderButton label={`Delete ${entry.name}`} secondary onPress={() => setConfirmDelete(true)} />}
  </NutritionDialog>;
}

const styles = StyleSheet.create({
  meals: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  meal: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, paddingHorizontal: spacing.sm, justifyContent: "center", borderRadius: radii.control, backgroundColor: colors.surfaceMuted },
  selected: { backgroundColor: colors.primaryDark },
  mealText: { color: colors.primaryDark, fontSize: typography.label },
  selectedText: { color: colors.surface, fontWeight: "600" },
});
