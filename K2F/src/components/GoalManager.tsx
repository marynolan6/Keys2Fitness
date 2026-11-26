import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { mockCheckIns } from "@/checkins/mockCheckIns";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { formatGoalDate, formatMeasurement, type FitnessGoal } from "@/goals/goal";
import {
  buildGoal,
  draftFromGoal,
  emptyGoalDraft,
  GOAL_TYPES,
  goalTypeInfo,
  localDateString,
  validateGoal,
  type GoalDraft,
  type GoalField,
  type GoalValues,
} from "@/goals/goalForm";
import { describeGoalStanding, withCheckIns } from "@/goals/goalProgress";
import { addGoal, deleteGoal, newGoalId, updateGoal, useGoals } from "@/goals/goalStore";
import { colors, layout, radii, spacing, typography } from "@/theme";

// Only one thing at a time: adding a goal, or editing / confirming deletion of one goal.
type GoalAction = { kind: "add" } | { id: string; kind: "edit" | "confirm-delete" } | null;

// K2F-130: the client's goals (sample data) with create, edit and delete.
export function GoalManager() {
  const goals = useGoals();
  const [action, setAction] = useState<GoalAction>(null);

  const save = (values: GoalValues, previous?: FitnessGoal) => {
    const goal = buildGoal(previous?.id ?? newGoalId(), values, mockCheckIns, localDateString(), previous);
    if (previous) updateGoal(goal);
    else addGoal(goal);
    setAction(null);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle} accessibilityRole="header">Your goals</Text>
        {action?.kind !== "add" && (
          <ActionButton label="Add goal" onPress={() => setAction({ kind: "add" })} />
        )}
      </View>

      {action?.kind === "add" && (
        <GoalForm initialDraft={emptyGoalDraft()} isEditing={false} onSave={(values) => save(values)} onCancel={() => setAction(null)} />
      )}

      {goals.length === 0 && action?.kind !== "add" ? (
        <Text style={styles.empty}>No goals yet. Add one to start tracking a target weight or measurement.</Text>
      ) : null}

      {goals.map((goal) =>
        action?.kind === "edit" && action.id === goal.id ? (
          <GoalForm
            key={goal.id}
            initialDraft={draftFromGoal(goal)}
            isEditing
            onSave={(values) => save(values, goal)}
            onCancel={() => setAction(null)}
          />
        ) : (
          <GoalRow
            key={goal.id}
            goal={withCheckIns(goal, mockCheckIns)}
            confirmingDelete={action?.kind === "confirm-delete" && action.id === goal.id}
            onEdit={() => setAction({ id: goal.id, kind: "edit" })}
            onAskDelete={() => setAction({ id: goal.id, kind: "confirm-delete" })}
            onCancelDelete={() => setAction(null)}
            onConfirmDelete={() => {
              deleteGoal(goal.id);
              setAction(null);
            }}
          />
        ),
      )}
    </View>
  );
}

type GoalRowProps = {
  goal: FitnessGoal;
  confirmingDelete: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

function GoalRow({ goal, confirmingDelete, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }: GoalRowProps) {
  const { label } = goalTypeInfo(goal.type);
  // With the year, since a target can fall in the next calendar year.
  const targetDate = `${formatGoalDate(goal.targetDate)}, ${goal.targetDate.slice(0, 4)}`;
  const { progress, headline, detail, deadline } = describeGoalStanding(goal, localDateString());
  const achieved = progress.status === "achieved";

  return (
    <View style={styles.row}>
      <View accessible accessibilityLabel={[`${goal.title}. ${label} goal, target ${formatMeasurement(goal.targetValue, goal.unit)} by ${targetDate}`, headline, detail, deadline].filter(Boolean).join(". ")}>
        <Text style={styles.rowType}>{label}</Text>
        <Text style={styles.rowTitle}>{goal.title}</Text>
        <Text style={styles.rowDetail}>
          Target {formatMeasurement(goal.targetValue, goal.unit)} by {targetDate}
        </Text>
      </View>

      <View style={[styles.standing, progress.status === "no-data" && styles.standingEmpty]}>
        <Text style={[styles.standingHeadline, achieved && styles.standingAchieved]}>{headline}</Text>
        {progress.status !== "no-data" && (
          <GoalProgressBar
            fraction={progress.fraction}
            percent={progress.percent}
            startValue={progress.startValue ?? progress.currentValue}
            currentValue={progress.currentValue}
            targetValue={goal.targetValue}
            unit={goal.unit}
            achieved={achieved}
          />
        )}
        <Text style={styles.rowDetail}>{detail}</Text>
        {deadline ? <Text style={styles.rowDetail}>{deadline}</Text> : null}
      </View>

      {confirmingDelete ? (
        <View style={styles.confirm} accessibilityLiveRegion="polite">
          <Text style={styles.confirmText}>Delete “{goal.title}”? This can’t be undone.</Text>
          <View style={styles.actions}>
            <ActionButton label="Keep it" onPress={onCancelDelete} />
            <ActionButton label="Delete goal" danger onPress={onConfirmDelete} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <ActionButton label="Edit" accessibilityLabel={`Edit ${goal.title}`} onPress={onEdit} />
          <ActionButton label="Delete" danger accessibilityLabel={`Delete ${goal.title}`} onPress={onAskDelete} />
        </View>
      )}
    </View>
  );
}

type GoalFormProps = {
  initialDraft: GoalDraft;
  isEditing: boolean;
  onSave: (values: GoalValues) => void;
  onCancel: () => void;
};

function GoalForm({ initialDraft, isEditing, onSave, onCancel }: GoalFormProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<Partial<Record<GoalField, string>>>({});
  const info = goalTypeInfo(draft.type);

  const update = (field: GoalField) => (text: string) => {
    setDraft((current) => ({ ...current, [field]: text }));
    setErrors(({ [field]: _cleared, ...rest }) => rest);
  };

  const submit = () => {
    const result = validateGoal(draft, localDateString());
    if (result.ok) onSave(result.values);
    else setErrors(result.errors);
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label} nativeID="goal-type-label">Goal type</Text>
      <View style={styles.typeRow} accessibilityRole="radiogroup" accessibilityLabelledBy="goal-type-label">
        {GOAL_TYPES.map(({ type, label }) => {
          const selected = draft.type === type;
          return (
            <Pressable
              key={type}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                setDraft((current) => ({ ...current, type }));
                setErrors(({ targetValue: _cleared, ...rest }) => rest);
              }}
              style={({ pressed }) => [styles.typeOption, selected && styles.typeOptionSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.typeOptionText, selected && styles.typeOptionTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Field
        label={`Target ${info.label.toLowerCase()} (${info.displayUnit})`}
        value={draft.targetValue}
        error={errors.targetValue}
        placeholder={info.displayUnit === "lb" ? "e.g. 150" : "e.g. 30"}
        keyboardType="decimal-pad"
        autoFocus={!isEditing}
        onChangeText={update("targetValue")}
      />
      <Field
        label="Target date"
        hint="YYYY-MM-DD"
        value={draft.targetDate}
        error={errors.targetDate}
        keyboardType="numbers-and-punctuation"
        onChangeText={update("targetDate")}
      />

      {Object.keys(errors).length > 0 ? (
        <Text style={styles.summary} accessibilityRole="alert">Nothing was saved. Fix the fields marked in red.</Text>
      ) : null}
      <View style={styles.actions}>
        <ActionButton label="Cancel" onPress={onCancel} />
        <ActionButton label={isEditing ? "Update goal" : "Save goal"} primary onPress={submit} />
      </View>
    </View>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  value: string;
  error?: string;
  placeholder?: string;
  keyboardType: "decimal-pad" | "numbers-and-punctuation";
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
};

function Field({ label, hint, value, error, placeholder, keyboardType, autoFocus, onChangeText }: FieldProps) {
  return (
    <View>
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

type ActionButtonProps = {
  label: string;
  accessibilityLabel?: string;
  primary?: boolean;
  danger?: boolean;
  onPress: () => void;
};

function ActionButton({ label, accessibilityLabel, primary = false, danger = false, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        danger && styles.buttonDanger,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary, danger && styles.buttonTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.md,
    // Matches the weight chart card above it.
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
  },
  empty: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  row: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  rowType: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  rowDetail: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  standing: {
    gap: spacing.xs,
  },
  standingEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    padding: spacing.md,
  },
  standingHeadline: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  standingAchieved: {
    color: colors.achieved,
  },
  confirm: {
    gap: spacing.sm,
  },
  confirmText: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget * 2,
    paddingHorizontal: spacing.md,
  },
  buttonPrimary: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  buttonDanger: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerMuted,
  },
  buttonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  buttonTextPrimary: {
    color: colors.surface,
  },
  buttonTextDanger: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  form: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    gap: spacing.md,
    padding: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget * 1.5,
    paddingHorizontal: spacing.md,
  },
  typeOptionSelected: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  typeOptionText: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "600",
  },
  typeOptionTextSelected: {
    color: colors.surface,
    fontWeight: "700",
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
});
