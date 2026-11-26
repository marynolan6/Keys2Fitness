import { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { FoodEntryEditor } from "./FoodEntryEditor";
import NutritionProgress from "./NutritionProgress";
import { getDailyNutrition, meals, nutritionDate, type FoodEntry, type Meal, type NutritionTargets } from "@/utils/nutrition";
import { colors, isCompactLayout, layout, radii, spacing, textStyles, typography } from "@/theme";

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
      <Action label="Previous day" icon={{ ios: "arrow.left", android: "arrow_back", web: "arrow_back" }}
        onPress={() => setDate(nutritionDate(1, day))} />
      <View style={styles.dateText}>
        <Text accessibilityLiveRegion="polite" style={styles.label}>{date === today ? "Today" : dateLabel}</Text>
        {date !== today && <Action label="Back to Today" onPress={() => setDate(today)} />}
      </View>
      <Action label="Next day" icon={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }}
        disabled={date >= today} onPress={() => setDate(nutritionDate(-1, day))} />
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
        {byMeal[meal].map((entry) => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Edit ${entry.name}`}
          accessibilityHint={`${meal}. ${entry.serving || "Serving not specified"}. ${entry.calories} calories. Protein ${entry.protein} grams, carbs ${entry.carbs} grams, fat ${entry.fats} grams.`}
          onPress={() => setEditor({ meal, entry })} style={({ pressed }) => [styles.food, compact && styles.stacked, pressed && styles.pressed]}>
          <View style={styles.foodText}>
            <Text style={styles.label}>{entry.name}</Text>
            <Text style={styles.caption}>{entry.serving || "Serving not specified"}</Text>
            <Text style={styles.caption}>Protein {entry.protein} g · Carbs {entry.carbs} g · Fat {entry.fats} g</Text>
          </View>
          <View style={styles.foodValue}>
            <Text style={styles.label}>{entry.calories} kcal</Text>
            <Text style={styles.editLink}>Edit</Text>
          </View>
        </Pressable>)}
      </View>)}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Coach nutrition tips</Text>
      <Text style={styles.caption}>Current plan for {clientName}</Text>
      <Text style={styles.body}>{tip.trim() || "No coach tips for this plan yet."}</Text>
    </View>
    {editor && <FoodEntryEditor initialMeal={editor.meal} entry={editor.entry} date={date} context={context} onClose={() => setEditor(null)}
      onDelete={(id) => { updateFood((current) => current.filter((item) => item.id !== id)); setEditor(null); }}
      onSave={(food) => {
        updateFood((current) => editor.entry ? current.map((item) => item.id === food.id ? food : item) : [...current, food]);
        setEditor(null);
      }} />}
  </View>;
}

function Action({ label, name = label, icon, onPress, disabled = false }: {
  label: string; name?: string; icon?: SymbolViewProps["name"]; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
    {icon ? <SymbolView name={icon} size={spacing.xl} tintColor={disabled ? colors.textMuted : colors.primaryDeep} />
      : <Text style={styles.buttonText}>{label}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  title: { ...textStyles.section, flexShrink: 1 },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  caption: { color: colors.textMuted, fontSize: typography.label },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.card },
  dateText: { flex: 1, alignItems: "center", gap: spacing.xs },
  meal: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing.xs },
  food: { flexDirection: "row", alignItems: "center", minHeight: layout.minTouchTarget, gap: spacing.sm, padding: spacing.sm, borderRadius: radii.control, backgroundColor: colors.background },
  foodText: { flex: 1, gap: spacing.xs, minWidth: 0 },
  stacked: { flexDirection: "column", alignItems: "stretch" },
  foodValue: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  editLink: { ...textStyles.label, color: colors.primaryDeep, textDecorationLine: "underline" },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center", alignItems: "center", padding: spacing.sm,
    backgroundColor: colors.surface, borderColor: colors.primaryDark, borderWidth: 1, borderRadius: radii.control },
  buttonText: { color: colors.primaryDeep, fontSize: typography.label, fontWeight: "600", textAlign: "center" },
  disabled: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  pressed: { backgroundColor: colors.surfaceMuted },
});
