import { StyleSheet, Text, View } from "react-native";
import { compareNutrition, nutrients, nutrientLabels, type NutritionTargets, type NutritionTotals } from "@/utils/nutrition";
import { colors, radii, spacing, typography } from "@/theme";

const amount = (value: number) => Number(value.toFixed(1)).toLocaleString();

export default function NutritionProgress({ totals, goals }: { totals: NutritionTotals; goals: NutritionTargets }) {
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Daily targets & intake</Text>
    <Text style={styles.caption}>Current coach-assigned targets · food logged for the selected day</Text>
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
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "500" },
  caption: { color: colors.textMuted, fontSize: typography.label },
  nutrient: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md, marginTop: spacing.sm, gap: spacing.sm },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  body: { color: colors.text, fontSize: typography.body },
  values: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm },
  target: { color: colors.primaryDeep, fontSize: typography.body, fontWeight: "600" },
  track: { height: spacing.sm, backgroundColor: colors.progressTrack, borderRadius: radii.control, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.primaryDark, borderRadius: radii.control },
});
