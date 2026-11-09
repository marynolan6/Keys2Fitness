import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CoachClient } from "@/clients/mockClients";
import { reloadCoachClients, type ClientsLoadStatus } from "@/clients/clientStore";
import { ClientAvatar } from "@/components/ClientAvatar";
import { colors, layout, radii, spacing, typography } from "@/theme";
import { exerciseCatalog } from "@/workouts/exerciseCatalog";

export function BuilderButton({ label, onPress, secondary = false, danger = false, disabled = false, accessibilityLabel }: {
  label: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; accessibilityLabel?: string;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress}
    style={({ pressed }) => [builderStyles.button, secondary && builderStyles.secondary,
      danger && builderStyles.danger, pressed && builderStyles.pressed, disabled && builderStyles.disabled]}>
    <Text style={[builderStyles.buttonText, secondary && builderStyles.secondaryText]}>{label}</Text>
  </Pressable>;
}

export function BuilderField({ label, value, onChange, multiline = false, error, keyboardType = "default", disabled = false, accessibilityLabel }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean;
  error?: string; keyboardType?: KeyboardTypeOptions; disabled?: boolean; accessibilityLabel?: string;
}) {
  return <View style={builderStyles.field}>
    <Text style={builderStyles.label}>{label}</Text>
    <TextInput accessibilityLabel={accessibilityLabel ?? label} value={value} onChangeText={onChange} multiline={multiline}
      editable={!disabled} keyboardType={keyboardType} textAlignVertical={multiline ? "top" : "center"}
      style={[builderStyles.input, multiline && builderStyles.multiline, error && builderStyles.invalid]} />
    {error && <Text accessibilityRole="alert" style={builderStyles.error}>{error}</Text>}
  </View>;
}

export function PrescriptionStepper({ label, exerciseName, value, onChange, min, max, step = 1, error, disabled = false }: {
  label: string; exerciseName: string; value: string; onChange: (value: string) => void;
  min: number; max: number; step?: number; error?: string; disabled?: boolean;
}) {
  const adjust = (delta: number) => {
    const numeric = Number(value);
    onChange(String(Math.min(max, Math.max(min, (Number.isFinite(numeric) ? numeric : min) + delta))));
  };
  return <View style={builderStyles.stepperField}>
    <Text style={builderStyles.label}>{label}</Text>
    <View style={builderStyles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label} for ${exerciseName}`} disabled={disabled}
        onPress={() => adjust(-step)} style={({ pressed }) => [builderStyles.stepButton, pressed && builderStyles.pressed]}>
        <Text style={builderStyles.stepText}>−</Text>
      </Pressable>
      <TextInput accessibilityLabel={`${label} for ${exerciseName}`} value={value} onChangeText={onChange}
        keyboardType={step === 1 ? "number-pad" : "decimal-pad"} editable={!disabled}
        style={[builderStyles.stepInput, error && builderStyles.invalid]} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label} for ${exerciseName}`} disabled={disabled}
        onPress={() => adjust(step)} style={({ pressed }) => [builderStyles.stepButton, pressed && builderStyles.pressed]}>
        <Text style={builderStyles.stepText}>+</Text>
      </Pressable>
    </View>
    {error && <Text accessibilityRole="alert" style={builderStyles.error}>{error}</Text>}
  </View>;
}

export function ClientAssignmentPicker({ clients, loadStatus, selected, onChange, disabled = false }: {
  clients: readonly CoachClient[]; loadStatus: ClientsLoadStatus; selected: string[];
  onChange: (ids: string[]) => void; disabled?: boolean;
}) {
  if (loadStatus === "loading") return <Text style={builderStyles.muted}>Loading clients…</Text>;
  if (loadStatus === "error") return <View style={builderStyles.field}>
    <Text style={builderStyles.error}>Clients could not be loaded.</Text>
    <BuilderButton label="Retry clients" secondary onPress={reloadCoachClients} />
  </View>;
  if (!clients.length) return <Text style={builderStyles.muted}>No clients available to assign yet. You can still save a template.</Text>;
  return <View style={builderStyles.field}>{clients.map((client) => {
    const checked = selected.includes(client.id);
    return <Pressable key={client.id} accessibilityRole="checkbox" accessibilityLabel={`Assign to ${client.name}`}
      accessibilityState={{ checked, disabled }} disabled={disabled}
      onPress={() => onChange(checked ? selected.filter((id) => id !== client.id) : [...selected, client.id])}
      style={({ pressed }) => [builderStyles.clientRow, checked && builderStyles.selected, pressed && builderStyles.pressed]}>
      <View style={[builderStyles.checkbox, checked && builderStyles.checkboxChecked]}>
        {checked && <Text style={builderStyles.check}>✓</Text>}
      </View>
      <ClientAvatar name={client.name} size={layout.minTouchTarget} />
      <View style={builderStyles.flex}>
        <Text style={builderStyles.label}>{client.name}</Text>
        <Text style={builderStyles.muted}>{client.status === "inactive" ? "Inactive client" : client.goal}</Text>
      </View>
    </Pressable>;
  })}</View>;
}

export function ExercisePicker({ title, onSelect, onClose }: {
  title: string; onSelect: (exercise: { name: string; instructions: string }) => void; onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const query = search.trim().toLowerCase();
  const results = exerciseCatalog.filter((exercise) => exercise.name.toLowerCase().includes(query));
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <View style={[builderStyles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View accessibilityViewIsModal style={builderStyles.modal}>
        <Text accessibilityRole="header" style={builderStyles.heading}>{title}</Text>
        <BuilderField label="Search exercises or enter a custom name" value={search} onChange={setSearch} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={builderStyles.field}>
          {results.map((exercise) => <Pressable key={exercise.name} accessibilityRole="button"
            accessibilityLabel={`Choose ${exercise.name}`} onPress={() => onSelect(exercise)}
            style={({ pressed }) => [builderStyles.catalogRow, pressed && builderStyles.pressed]}>
            <Text style={builderStyles.label}>{exercise.name}</Text>
            <Text style={builderStyles.muted}>{exercise.instructions}</Text>
          </Pressable>)}
          {query && !exerciseCatalog.some((exercise) => exercise.name.toLowerCase() === query) &&
            <BuilderButton label={`Use custom exercise: ${search.trim()}`} secondary
              onPress={() => onSelect({ name: search.trim(), instructions: "" })} />}
          {!results.length && <Text style={builderStyles.muted}>No catalog matches. Use your custom name above.</Text>}
        </ScrollView>
        <BuilderButton label="Close exercise picker" secondary onPress={onClose} />
      </View>
    </View>
  </Modal>;
}

export const builderStyles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.lg,
    paddingBottom: spacing.xl, gap: spacing.md },
  brand: { color: colors.primaryDark, fontSize: typography.caption, fontWeight: "700", letterSpacing: 1 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: "300", flexShrink: 1 },
  heading: { color: colors.text, fontSize: typography.heading, fontWeight: "500", flexShrink: 1 },
  label: { color: colors.text, fontSize: typography.label, fontWeight: "600", flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: typography.caption, lineHeight: typography.bodyLineHeight },
  feedback: { color: colors.primaryDark, fontSize: typography.body },
  error: { color: colors.danger, fontSize: typography.label },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.md },
  field: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  stacked: { flexDirection: "column", alignItems: "stretch" },
  flex: { flex: 1 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.control,
    color: colors.text, fontSize: typography.body, minHeight: layout.minTouchTarget, padding: spacing.sm },
  multiline: { minHeight: layout.minTouchTarget * 2 },
  invalid: { borderColor: colors.danger },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget * 2, padding: spacing.sm,
    borderRadius: radii.button, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center", flexGrow: 1 },
  buttonText: { fontSize: typography.label, fontWeight: "600", color: colors.surface, textAlign: "center" },
  secondary: { backgroundColor: colors.surfaceMuted },
  secondaryText: { color: colors.primaryDark },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  selected: { backgroundColor: colors.surfaceMuted },
  clientRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm,
    borderRadius: radii.control, minHeight: layout.minTouchTarget },
  checkbox: { width: spacing.lg, height: spacing.lg, borderWidth: 1, borderColor: colors.primaryDark,
    borderRadius: spacing.xs, justifyContent: "center", alignItems: "center" },
  checkboxChecked: { backgroundColor: colors.primaryDark },
  check: { color: colors.surface, fontSize: typography.body },
  stepperField: { gap: spacing.xs, flexGrow: 1 },
  stepper: { flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radii.control, alignItems: "center" },
  stepButton: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, alignItems: "center", justifyContent: "center" },
  stepText: { color: colors.primaryDark, fontSize: typography.heading },
  stepInput: { flex: 1, minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, textAlign: "center",
    color: colors.text, fontSize: typography.body, borderWidth: 1, borderColor: colors.border, borderRadius: radii.control },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.md },
  modal: { width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "100%", backgroundColor: colors.surface,
    borderRadius: radii.card, padding: spacing.md, gap: spacing.md },
  catalogRow: { minHeight: layout.minTouchTarget, padding: spacing.md, gap: spacing.xs,
    backgroundColor: colors.surfaceMuted, borderRadius: radii.control },
});
