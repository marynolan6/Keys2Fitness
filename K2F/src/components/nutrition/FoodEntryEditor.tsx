import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BuilderButton, BuilderField, builderStyles } from "@/components/WorkoutBuilderControls";
import { meals, nutrientLabels, nutrients, type FoodEntry, type Meal } from "@/utils/nutrition";
import { colors, layout, radii, spacing, typography } from "@/theme";
import { NutritionDialog } from "./NutritionDialog";

export function FoodEntryEditor({ initialMeal, entry, date, context, onSave, onClose }: {
  initialMeal: Meal; entry?: FoodEntry; date: string; context: string; onSave: (value: FoodEntry) => void; onClose: () => void;
}) {
  const [meal, setMeal] = useState(initialMeal);
  const [form, setForm] = useState(() => ({ name: entry?.name ?? "", serving: entry?.serving ?? "",
    calories: entry?.calories.toString() ?? "", protein: entry?.protein.toString() ?? "",
    carbs: entry?.carbs.toString() ?? "", fats: entry?.fats.toString() ?? "" }));
  const [error, setError] = useState("");
  function field(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value })); setError("");
  }
  function save() {
    if (!form.name.trim() || !form.serving.trim() || !nutrients.every((key) => form[key].trim() !== "" && Number.isFinite(Number(form[key])) &&
        Number(form[key]) >= 0 && Number(form[key]) <= Number.MAX_SAFE_INTEGER)) {
      setError("Enter a food name, serving, and nonnegative nutrition values."); return;
    }
    onSave({ id: entry?.id ?? `food-${Date.now()}-${Math.random()}`, date, meal, name: form.name.trim(), serving: form.serving.trim(),
      calories: Number(form.calories), protein: Number(form.protein), carbs: Number(form.carbs), fats: Number(form.fats) });
  }
  return <NutritionDialog title={entry ? "Edit food" : "Add food"} closeLabel="Cancel" onClose={onClose}>
    <Text style={builderStyles.muted}>{context}</Text>
    <Text style={builderStyles.label}>Meal</Text>
    <View style={styles.meals}>
      {meals.map((choice) => <Pressable accessibilityRole="radio" accessibilityLabel={choice} accessibilityState={{ checked: choice === meal }} key={choice}
        onPress={() => setMeal(choice)} style={({ pressed }) => [styles.meal, choice === meal && styles.selected, pressed && builderStyles.pressed]}>
        <Text style={[styles.mealText, choice === meal && styles.selectedText]}>{choice}</Text>
      </Pressable>)}
    </View>
    <BuilderField label="Food name" value={form.name} onChange={(value) => field("name", value)} />
    <BuilderField label="Serving" value={form.serving} onChange={(value) => field("serving", value)} />
    {nutrients.map((key) => <BuilderField key={key} label={`${nutrientLabels[key].label} (${nutrientLabels[key].unit})`}
      value={form[key]} keyboardType="decimal-pad" onChange={(value) => field(key, value)} />)}
    {error ? <Text accessibilityRole="alert" style={builderStyles.error}>{error}</Text> : null}
    <BuilderButton label={entry ? "Save changes" : "Save food"} onPress={save} />
  </NutritionDialog>;
}

const styles = StyleSheet.create({
  meals: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  meal: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, paddingHorizontal: spacing.sm, justifyContent: "center", borderRadius: radii.control, backgroundColor: colors.surfaceMuted },
  selected: { backgroundColor: colors.primaryDark },
  mealText: { color: colors.primaryDark, fontSize: typography.label },
  selectedText: { color: colors.surface, fontWeight: "600" },
});
