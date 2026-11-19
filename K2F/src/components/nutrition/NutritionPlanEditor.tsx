import { useReducer } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BuilderButton, BuilderField } from "@/components/WorkoutBuilderControls";
import { createNutritionEditorState, nutritionEditorReducer } from "@/nutrition/nutritionEditorReducer";
import { validateNutritionPlan, type NutritionPlan } from "@/nutrition/nutritionPlan";
import { nutritionRepository } from "@/nutrition/nutritionStore";
import { nutrients, nutrientLabels } from "@/utils/nutrition";
import { colors, radii, spacing, typography } from "@/theme";

export function NutritionPlanEditor({ clientId, plan, onClose, onSaved }: {
  clientId: string; plan: NutritionPlan; onClose: () => void; onSaved: () => void;
}) {
  const [state, dispatch] = useReducer(nutritionEditorReducer, plan, createNutritionEditorState);
  function save() {
    if (state.status === "saved") return;
    const errors = validateNutritionPlan(state.draft);
    if (Object.keys(errors).length) { dispatch({ type: "invalid", errors }); return; }
    try {
      nutritionRepository.savePlan(clientId, state.draft, state.expectedRevision);
      dispatch({ type: "saved" });
      onSaved();
    } catch (cause) { dispatch({ type: "failed", message: cause instanceof Error ? cause.message : "The plan could not be updated." }); }
  }
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Edit daily targets</Text>
    <Text style={styles.body}>Leave a target blank for Not assigned. Changes apply to comparisons; they do not change this client&apos;s food log.</Text>
    {nutrients.map((key) => <BuilderField key={key} label={`${nutrientLabels[key].label} target (${nutrientLabels[key].unit})`}
      keyboardType="decimal-pad" value={state.draft.targets[key]} error={state.errors[key]}
      onChange={(value) => dispatch({ type: "target", key, value })} />)}
    <BuilderField label="Coach nutrition tips" multiline value={state.draft.tip} onChange={(value) => dispatch({ type: "tip", value })} />
    {!!state.message && <Text accessibilityRole="alert" style={styles.error}>{state.message}</Text>}
    <BuilderButton label="Save nutrition plan" onPress={save} />
    <BuilderButton label="Cancel nutrition changes" secondary onPress={onClose} />
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.md },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "500" },
  body: { color: colors.textMuted, fontSize: typography.body },
  error: { color: colors.danger, fontSize: typography.body },
});
