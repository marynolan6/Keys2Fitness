import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import type { WorkoutExercise } from "@/workouts/workout";
import { isValidPerformanceValue, prescribedSetDefaults, type PerformanceField } from "@/workouts/setPerformance";

type Props = {
  exercise: WorkoutExercise;
  disabled: boolean;
  onChange: (setId: string, field: PerformanceField, value: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onToggle: (setId: string) => void;
};

export function ExerciseSetEntries({ exercise, disabled, onChange, onAdd, onRemove, onToggle }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const rows = exercise.actualSets ?? [];
  const defaults = prescribedSetDefaults(exercise);

  function change(setId: string, field: PerformanceField, value: string) {
    if (disabled) return;
    // A decimal keypad can start with a dot; keep that editable as 0.
    const next = field === "actualWeightLb" && value === "." ? "0." : value;
    const key = `${setId}:${field}`;
    const error = isValidPerformanceValue(field, next) ? "" : field === "actualReps"
      ? "Use zero or a positive whole number." : "Use zero or a positive number in pounds.";
    setErrors((current) => ({ ...current, [key]: error }));
    if (!error) onChange(setId, field, next);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Your performed sets</Text>
      <Text style={styles.hint}>Gray = coach target. Check a set to record it, or enter your own values. 0 lb = no added weight.</Text>
      {rows.length === 0 && <Text style={styles.hint}>No performed sets. Add a set to record your workout.</Text>}
      {rows.map((set, index) => (
        <View key={set.id} style={[styles.setCard, set.completed && styles.completedCard]}>
          <View style={styles.rowHeader}>
            <View style={styles.rowTitle}>
              <Text style={styles.setNumber}>Set {index + 1}</Text>
              <Text style={styles.hint}>{set.completed ? "Completed" : "Not complete"}</Text>
            </View>
            <Pressable accessibilityRole="checkbox"
              accessibilityLabel={`${exercise.name}, set ${index + 1} completed`}
              accessibilityHint="Confirms the set. Untouched fields use the prescribed targets."
              accessibilityState={{ checked: !!set.completed, disabled }} disabled={disabled}
              onPress={() => {
                setErrors((current) => ({ ...current, [`${set.id}:actualReps`]: "", [`${set.id}:actualWeightLb`]: "" }));
                onToggle(set.id);
              }}
              style={({ pressed }) => [styles.checkbox, set.completed && styles.checkboxCompleted, pressed && styles.pressed]}>
              {set.completed && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          </View>
          <View style={[styles.fields, compact && styles.fieldsCompact]}>
            {(["actualReps", "actualWeightLb"] as const).map((field) => {
              const label = field === "actualReps" ? "Actual reps" : "Actual weight (lb)";
              const error = errors[`${set.id}:${field}`];
              return (
                <View key={field} style={styles.field}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    accessibilityLabel={`${exercise.name}, set ${index + 1}, ${label.toLowerCase()}`}
                    accessibilityHint={error || `Prescribed target: ${defaults[field] || "not specified"}. Checking the set records this target if left untouched.`}
                    editable={!disabled}
                    keyboardType={field === "actualReps" ? "number-pad" : "decimal-pad"}
                    inputMode={field === "actualReps" ? "numeric" : "decimal"}
                    placeholder={defaults[field] || "Not prescribed"}
                    placeholderTextColor={colors.textMuted}
                    value={set[field]}
                    onChangeText={(value) => change(set.id, field, value)}
                    style={[styles.input, disabled && styles.inputDisabled, !!error && styles.inputError]}
                  />
                  {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <View style={[styles.fields, compact && styles.fieldsCompact]}>
        <SetButton label="+ Add Set" accessibilityLabel={`Add performed set to ${exercise.name}`}
          disabled={disabled} onPress={onAdd} />
        <SetButton label="− Remove Set" accessibilityLabel={`Remove last performed set from ${exercise.name}`}
          disabled={disabled || rows.length === 0} onPress={onRemove} />
      </View>
      <Text style={styles.hint}>Remove Set removes the last performed row. Prescribed targets stay unchanged.</Text>
    </View>
  );
}

function SetButton({ label, accessibilityLabel, disabled, onPress }: {
  label: string; accessibilityLabel: string; disabled: boolean; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.inputDisabled, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md, gap: spacing.sm },
  heading: { color: colors.text, fontSize: typography.body, fontWeight: "700" },
  hint: { color: colors.textMuted, fontSize: typography.label },
  setCard: { borderColor: colors.border, borderWidth: 1, borderRadius: radii.control, padding: spacing.sm, gap: spacing.sm },
  completedCard: { backgroundColor: colors.achievedMuted, borderColor: colors.achieved },
  rowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  rowTitle: { flex: 1 },
  checkbox: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, borderRadius: radii.control, borderColor: colors.primaryDark, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkboxCompleted: { backgroundColor: colors.primaryDark },
  checkmark: { color: colors.surface, fontSize: typography.heading, fontWeight: "700" },
  setNumber: { color: colors.primaryDark, fontSize: typography.body, fontWeight: "700" },
  fields: { flexDirection: "row", gap: spacing.sm },
  fieldsCompact: { flexDirection: "column" },
  field: { flex: 1, gap: spacing.xs, minWidth: 0 },
  label: { color: colors.text, fontSize: typography.label },
  input: {
    color: colors.text, backgroundColor: colors.surface, borderColor: colors.textMuted, borderWidth: 1,
    borderRadius: radii.control, minHeight: layout.minTouchTarget, fontSize: typography.body,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
  },
  inputDisabled: { backgroundColor: colors.surfaceMuted },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: typography.label },
  button: {
    flexGrow: 1, flexBasis: 0, backgroundColor: colors.surfaceMuted, borderRadius: radii.button,
    justifyContent: "center", alignItems: "center", minHeight: layout.minTouchTarget,
    padding: spacing.sm,
  },
  buttonText: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.75 },
});
