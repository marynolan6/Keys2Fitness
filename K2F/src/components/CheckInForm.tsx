import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import {
  CHECK_IN_MEASUREMENTS,
  validateCheckIn,
  type CheckInDraft,
  type CheckInField,
  type CheckInValues,
} from "@/checkins/checkInForm";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

type CheckInFormProps = {
  initialDraft: CheckInDraft;
  today: string;
  isEditing: boolean;
  saving: boolean;
  // Shown when saving fails; the draft stays filled in so nothing is lost.
  saveError: string;
  onSave: (values: CheckInValues) => void;
  onCancel: () => void;
};

export function CheckInForm({ initialDraft, today, isEditing, saving, saveError, onSave, onCancel }: CheckInFormProps) {
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<Partial<Record<CheckInField, string>>>({});

  const update = (field: CheckInField) => (text: string) => {
    setDraft((current) => ({ ...current, [field]: text }));
    setErrors(({ [field]: _cleared, ...rest }) => rest);
  };

  const submit = () => {
    const result = validateCheckIn(draft, today);
    if (result.ok) onSave(result.values);
    else setErrors(result.errors);
  };

  return (
    <View style={styles.form}>
      <View style={[styles.row, compact && styles.stacked]}>
        <Field compact={compact} label="Date" hint="YYYY-MM-DD" value={draft.date} error={errors.date} onChangeText={update("date")}
          keyboardType="numbers-and-punctuation" />
        <Field compact={compact} label="Weight (lb)" value={draft.weight} error={errors.weight} onChangeText={update("weight")}
          placeholder="e.g. 165.5" keyboardType="decimal-pad" autoFocus={!isEditing} />
      </View>

      <Text style={styles.sectionLabel}>Body measurements (optional, inches)</Text>
      <View style={[styles.row, compact && styles.stacked]}>
        {CHECK_IN_MEASUREMENTS.map(({ key, label }) => (
          <Field key={key} compact={compact} label={label} value={draft[key]} error={errors[key]} onChangeText={update(key)}
            placeholder="—" keyboardType="decimal-pad" />
        ))}
      </View>

      {Object.keys(errors).length > 0 ? (
        <Text style={styles.summary} accessibilityRole="alert">Nothing was saved. Fix the fields marked in red.</Text>
      ) : null}
      {saveError ? <Text style={styles.error} accessibilityLiveRegion="polite">{saveError}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onCancel}
          style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} disabled={saving}
          onPress={submit} style={({ pressed }) => [styles.button, styles.save, pressed && styles.pressed]}>
          <Text style={styles.saveText}>{saving ? "Saving…" : isEditing ? "Update check-in" : "Save check-in"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type FieldProps = {
  // Stacked fields size to their content; side-by-side fields share the row equally.
  compact: boolean;
  label: string;
  hint?: string;
  value: string;
  error?: string;
  placeholder?: string;
  keyboardType: "decimal-pad" | "numbers-and-punctuation";
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
};

function Field({ compact, label, hint, value, error, placeholder, keyboardType, autoFocus, onChangeText }: FieldProps) {
  return (
    <View style={compact ? null : styles.rowField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={hint ? `${label}, ${hint}` : label}
        accessibilityHint={error}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder ?? hint}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
      />
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stacked: {
    flexDirection: "column",
  },
  rowField: {
    flex: 1,
    minWidth: 0,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
  },
  label: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  summary: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.control,
    color: colors.danger,
    fontSize: typography.label,
    fontWeight: "700",
    padding: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  button: {
    alignItems: "center",
    borderRadius: radii.button,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  cancel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  save: {
    backgroundColor: colors.primaryDark,
  },
  saveText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});
