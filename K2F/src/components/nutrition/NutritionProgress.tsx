import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NutritionDialog } from "./NutritionDialog";
import { compareNutrition, nutrients, nutrientLabels, type NutritionTargets, type NutritionTotals } from "@/utils/nutrition";
import { colors, layout, radii, spacing, textStyles, typography } from "@/theme";

const amount = (value: number) => Number(value.toFixed(1)).toLocaleString();

export default function NutritionProgress({ totals, goals, context }: { totals: NutritionTotals; goals: NutritionTargets; context: string }) {
  const [expanded, setExpanded] = useState(false);
  const calories = goals.calories === null ? `${amount(totals.calories)} kcal logged · No calorie target` : `${amount(totals.calories)} / ${amount(goals.calories)} kcal`;
  const macros = `Protein ${amount(totals.protein)} g · Carbs ${amount(totals.carbs)} g · Fat ${amount(totals.fats)} g`;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Daily targets & intake" accessibilityState={{ expanded }}
      accessibilityHint={`${calories}. ${macros}. Opens the full breakdown.`} onPress={() => setExpanded(true)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.values}><Text style={styles.label}>Daily targets &amp; intake</Text><Text style={styles.target}>View details ›</Text></View>
      <Text style={textStyles.metric}>{calories}</Text><Text style={styles.caption}>{macros}</Text>
    </Pressable>
    {expanded && <NutritionDialog title="Daily targets & intake" closeLabel="Close nutrition details" onClose={() => setExpanded(false)}>
      <Text style={styles.caption}>{context}</Text>
      <Text style={styles.caption}>Current targets and intake logged for this day.</Text>
      {nutrients.map((key) => {
        const { label, unit } = nutrientLabels[key];
        const target = goals[key];
        const result = compareNutrition(totals[key], target);
        return <View key={key} style={styles.nutrient}>
          <Text style={styles.label}>{label} ({unit})</Text>
          <View style={styles.values}>
            <Text style={styles.body}>{amount(totals[key])} {unit} logged</Text>
            <Text style={styles.target}>Target: {target === null ? "Not assigned" : `${amount(target)} ${unit}`}</Text>
          </View>
          {result.percent !== null && <View accessibilityRole="progressbar" accessibilityLabel={`${label} intake`}
            accessibilityValue={{ min: 0, max: 100, now: result.percent, text: `${amount(totals[key])} of ${target} ${unit} logged` }} style={styles.track}>
            <View style={[styles.fill, { width: `${result.percent}%` }]} />
          </View>}
          {result.remaining !== null && <Text style={styles.caption}>
            {result.remaining >= 0 ? `${amount(result.remaining)} ${unit} remaining` : `${amount(-result.remaining)} ${unit} above target`}
          </Text>}
        </View>;
      })}
    </NutritionDialog>}
  </>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, minHeight: layout.minTouchTarget, padding: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: spacing.xs, borderLeftColor: colors.primaryDark },
  pressed: { backgroundColor: colors.surfaceMuted },
  caption: { color: colors.textMuted, fontSize: typography.label },
  nutrient: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md, marginTop: spacing.sm, gap: spacing.sm },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  body: { color: colors.text, fontSize: typography.body },
  values: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm },
  target: { color: colors.primaryDeep, fontSize: typography.body, fontWeight: "600" },
  track: { height: spacing.sm, backgroundColor: colors.progressTrack, borderRadius: radii.control, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.primaryDark, borderRadius: radii.control },
});
