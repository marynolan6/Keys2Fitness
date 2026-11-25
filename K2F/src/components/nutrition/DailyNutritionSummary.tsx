import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { FoodEntryEditor } from "./FoodEntryEditor";
import NutritionProgress from "./NutritionProgress";
import { getDailyNutrition, meals, nutritionDate, type FoodEntry, type Meal, type NutritionTargets } from "@/utils/nutrition";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

type Props = {
  entries: FoodEntry[]; updateFood: (update: (entries: FoodEntry[]) => FoodEntry[]) => void;
  goals: NutritionTargets; tip: string; clientName: string;
};

export default function DailyNutritionSummary({ entries, updateFood, goals, tip, clientName }: Props) {
  const [date, setDate] = useState(nutritionDate);
  const [editor, setEditor] = useState<{ meal: Meal; entry?: FoodEntry } | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const { byMeal, count, totals } = getDailyNutrition(entries, date);
  const today = nutritionDate();
  const day = new Date(`${date}T12:00:00`);
  const dateLabel = day.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const context = `${clientName} · ${dateLabel}`;

  return <View style={styles.content}>
    <View style={styles.dateRow}>
      <Action label="‹" name="Previous day" onPress={() => setDate(nutritionDate(1, day))} />
      <View style={styles.dateText}>
        <Text accessibilityLiveRegion="polite" style={styles.label}>{date === today ? "Today" : dateLabel}</Text>
        {date !== today && <Action label="Back to Today" onPress={() => setDate(today)} />}
      </View>
      <Action label="›" name="Next day" disabled={date >= today} onPress={() => setDate(nutritionDate(-1, day))} />
    </View>
    <NutritionProgress totals={totals} goals={goals} context={context} />
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Food log</Text>
        <Text style={styles.caption}>{count} {count === 1 ? "entry" : "entries"}</Text>
      </View>
      {meals.map((meal) => <View key={meal} style={styles.meal}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.label}>{meal}</Text>
          <Action label="+ Add food" name={`Add food to ${meal}`} onPress={() => setEditor({ meal })} />
        </View>
        {!byMeal[meal].length && <Text style={styles.caption}>No food logged.</Text>}
        {byMeal[meal].map((entry) => <View key={entry.id} style={[styles.food, compact && styles.stacked]}>
          <View style={styles.foodText}>
            <Text style={styles.label}>{entry.name}</Text>
            <Text style={styles.caption}>{entry.serving || "Serving not specified"} · {entry.calories} kcal</Text>
            <Text style={styles.caption}>Protein {entry.protein} g · Carbs {entry.carbs} g · Fat {entry.fats} g</Text>
          </View>
          <View style={styles.actions}>
            <Action label="Edit" name={`Edit ${entry.name}`} onPress={() => setEditor({ meal, entry })} />
            <Action label="Delete" name={`Delete ${entry.name}`} onPress={() => updateFood((current) => current.filter((food) => food.id !== entry.id))} />
          </View>
        </View>)}
      </View>)}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Coach nutrition tips</Text>
      <Text style={styles.caption}>Current plan for {clientName}</Text>
      <Text style={styles.body}>{tip.trim() || "No coach tips for this plan yet."}</Text>
    </View>
    {editor && <FoodEntryEditor initialMeal={editor.meal} entry={editor.entry} date={date} context={context} onClose={() => setEditor(null)}
      onSave={(food) => {
        updateFood((current) => editor.entry ? current.map((item) => item.id === food.id ? food : item) : [...current, food]);
        setEditor(null);
      }} />}
  </View>;
}

function Action({ label, name = label, onPress, disabled = false }: { label: string; name?: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "500", flexShrink: 1 },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  caption: { color: colors.textMuted, fontSize: typography.label },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dateText: { flex: 1, alignItems: "center" },
  meal: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing.xs },
  food: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  foodText: { flex: 1, gap: spacing.xs, minWidth: 0 },
  stacked: { flexDirection: "column", alignItems: "stretch" },
  actions: { flexDirection: "row", gap: spacing.sm },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center", alignItems: "center", padding: spacing.sm, borderRadius: radii.control },
  buttonText: { color: colors.primaryDeep, fontSize: typography.label, fontWeight: "600", textAlign: "center" },
  disabled: { opacity: 0.5 },
  pressed: { backgroundColor: colors.surfaceMuted },
});
