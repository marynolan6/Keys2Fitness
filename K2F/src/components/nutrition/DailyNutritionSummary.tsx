import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import NutritionProgress from "./NutritionProgress";
import { getTotalsForDate, nutritionDate, nutrients, nutrientLabels, type FoodEntry, type NutritionTargets } from "@/utils/nutrition";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

type FoodForm = { id: string | null; name: string; serving: string; calories: string; protein: string; carbs: string; fats: string; error: string };
const emptyForm = (): FoodForm => ({ id: null, name: "", serving: "", calories: "", protein: "", carbs: "", fats: "", error: "" });
const displayDate = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

type Props = {
  entries: FoodEntry[];
  setEntries: Dispatch<SetStateAction<FoodEntry[]>>;
  goals: NutritionTargets;
  tip: string;
  clientName: string;
};

export default function DailyNutritionSummary({ entries, setEntries, goals, tip, clientName }: Props) {
  const [selectedDate, setSelectedDate] = useState(nutritionDate);
  const [form, setForm] = useState<FoodForm | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const totals = useMemo(() => getTotalsForDate(entries, selectedDate), [entries, selectedDate]);
  const dailyEntries = entries.filter((entry) => entry.date === selectedDate);
  const today = nutritionDate();

  function moveDay(days: number) {
    setSelectedDate(nutritionDate(-days, new Date(`${selectedDate}T12:00:00`)));
    setForm(null);
  }
  function editField(field: keyof Omit<FoodForm, "id" | "error">, value: string) {
    setForm((current) => current ? { ...current, [field]: value, error: "" } : null);
  }
  function saveFood() {
    if (!form) return;
    const valid = form.name.trim() && form.serving.trim() && nutrients.every((key) =>
      form[key].trim() !== "" && Number.isFinite(Number(form[key])) && Number(form[key]) >= 0 && Number(form[key]) <= Number.MAX_SAFE_INTEGER);
    if (!valid) { setForm({ ...form, error: "Enter a food name, serving and nonnegative nutrition values." }); return; }
    const entry: FoodEntry = { id: form.id ?? `food-${Date.now()}-${Math.random()}`, name: form.name.trim(), serving: form.serving.trim(),
      date: selectedDate, calories: Number(form.calories), protein: Number(form.protein), carbs: Number(form.carbs), fats: Number(form.fats) };
    setEntries((current) => form.id ? current.map((item) => item.id === form.id ? entry : item) : [...current, entry]);
    setForm(null);
  }

  return <View style={styles.content}>
    <View style={styles.dateRow}>
      <Button label="‹" accessibilityLabel="Previous day" onPress={() => moveDay(-1)} />
      <View style={styles.dateText}>
        <Text accessibilityLiveRegion="polite" style={styles.label}>{selectedDate === today ? "Today" : displayDate(selectedDate)}</Text>
        {selectedDate !== today && <Button label="Back to Today" onPress={() => { setSelectedDate(today); setForm(null); }} />}
      </View>
      <Button label="›" accessibilityLabel="Next day" disabled={selectedDate >= today} onPress={() => moveDay(1)} />
    </View>

    <NutritionProgress totals={totals} goals={goals} />
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Coach nutrition tips</Text>
      <Text style={styles.caption}>Current plan for {clientName}</Text>
      <Text style={styles.body}>{tip.trim() || "No coach tips for this plan yet."}</Text>
    </View>

    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Food log</Text>
        <Text style={styles.caption}>{dailyEntries.length} {dailyEntries.length === 1 ? "entry" : "entries"}</Text>
      </View>
      {!dailyEntries.length && <Text style={styles.caption}>No food logged for this day.</Text>}
      {dailyEntries.map((entry) => <View key={entry.id} style={[styles.food, compact && styles.stacked]}>
        <View style={styles.foodText}>
          <Text style={styles.label}>{entry.name}</Text>
          <Text style={styles.caption}>{entry.serving || "Serving not specified"} · {entry.calories} kcal</Text>
          <Text style={styles.caption}>Protein {entry.protein} g · Carbs {entry.carbs} g · Fat {entry.fats} g</Text>
        </View>
        <View style={styles.actions}>
          <Button label="Edit" accessibilityLabel={`Edit ${entry.name}`} onPress={() => setForm({ id: entry.id, name: entry.name, serving: entry.serving ?? "",
            calories: String(entry.calories), protein: String(entry.protein), carbs: String(entry.carbs), fats: String(entry.fats), error: "" })} />
          <Button label="Delete" accessibilityLabel={`Delete ${entry.name}`} onPress={() => {
            setEntries((current) => current.filter((item) => item.id !== entry.id));
            if (form?.id === entry.id) setForm(null);
          }} />
        </View>
      </View>)}
      {!form && <Button label="Add food" primary onPress={() => setForm(emptyForm())} />}
    </View>

    {form && <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{form.id ? "Edit food" : "Add food"}</Text>
      <Text style={styles.caption}>Logging for {displayDate(selectedDate)}</Text>
      {([ ["name", "Food name"], ["serving", "Serving"], ...nutrients.map((key) => [key, `${nutrientLabels[key].label} (${nutrientLabels[key].unit})`] as const) ] as const).map(([field, label]) =>
        <View key={field} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput accessibilityLabel={label} value={form[field]} placeholderTextColor={colors.textMuted}
            keyboardType={field === "name" || field === "serving" ? "default" : "decimal-pad"}
            onChangeText={(value) => editField(field, value)} style={styles.input} />
        </View>)}
      {!!form.error && <Text accessibilityRole="alert" style={styles.error}>{form.error}</Text>}
      <Button label={form.id ? "Save changes" : "Save food"} primary onPress={saveFood} />
      <Button label="Cancel" onPress={() => setForm(null)} />
    </View>}
  </View>;
}

function Button({ label, accessibilityLabel = label, onPress, disabled, primary }: {
  label: string; accessibilityLabel?: string; onPress: () => void; disabled?: boolean; primary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, primary && styles.primary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, primary && styles.primaryText]}>{label}</Text>
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
  food: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  foodText: { flex: 1, gap: spacing.xs, minWidth: 0 },
  stacked: { flexDirection: "column", alignItems: "stretch" },
  actions: { flexDirection: "row", gap: spacing.sm },
  field: { gap: spacing.xs },
  input: { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: radii.control,
    fontSize: typography.body, padding: spacing.sm, minHeight: layout.minTouchTarget },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center", alignItems: "center", padding: spacing.sm, borderRadius: radii.control },
  buttonText: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "600", textAlign: "center" },
  primary: { backgroundColor: colors.primaryDark },
  primaryText: { color: colors.surface },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  error: { color: colors.danger, fontSize: typography.label },
});
