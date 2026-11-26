import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  buildCheckInRows,
  CheckIn,
  CheckInRow,
  groupCheckInsByMonth,
} from "@/checkins/checkIn";
import {
  applyToSampleCheckIn,
  draftFromSampleCheckIn,
  emptyCheckInDraft,
  localDateString,
  sampleCheckInFromValues,
} from "@/checkins/checkInForm";
import { CheckInForm } from "@/components/CheckInForm";
import { GoalNoDataNotice } from "@/components/GoalStatusBanner";
import { formatMeasurement, formatShortGoalDate, formatSignedMeasurement } from "@/goals/goal";
import { colors, layout, radii, spacing, typography } from "@/theme";

const COLLAPSED_COUNT = 4;

type CheckInHistoryProps = {
  checkIns: readonly CheckIn[];
  onAdd: (checkIn: Omit<CheckIn, "id">) => void;
  onUpdate: (checkIn: CheckIn) => void;
  onDelete: (id: string) => void;
};

// Only one thing at a time: adding a check-in, or editing / confirming deletion of one row.
type RowAction = { kind: "add" } | { id: string; kind: "edit" | "confirm-delete" } | null;

export function CheckInHistory({ checkIns, onAdd, onUpdate, onDelete }: CheckInHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<RowAction>(null);
  const rows = buildCheckInRows(checkIns);
  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const months = groupCheckInsByMonth(visibleRows);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          Check-in history
        </Text>
        {action?.kind !== "add" && (
          <RowButton label="Add check-in" onPress={() => setAction({ kind: "add" })} />
        )}
      </View>
      <Text style={styles.caption}>
        {rows.length === 0
          ? "Your progress check-ins"
          : `${rows.length} check-in${rows.length === 1 ? "" : "s"} · newest first`}
      </Text>

      {action?.kind === "add" && (
        <CheckInForm
          initialDraft={emptyCheckInDraft(localDateString())}
          today={localDateString()}
          isEditing={false}
          saving={false}
          saveError=""
          onSave={(values) => {
            onAdd(sampleCheckInFromValues(values));
            setAction(null);
          }}
          onCancel={() => setAction(null)}
        />
      )}

      {rows.length === 0 ? (
        <GoalNoDataNotice
          title="No check-ins yet"
          body="Each time you or your coach record a check-in, it will be listed here with your weight and measurements."
        />
      ) : (
        months.map((month) => (
          <View key={month.title} style={styles.month}>
            <Text style={styles.monthTitle}>{month.title}</Text>
            {month.rows.map((row) =>
              action?.kind === "edit" && action.id === row.checkIn.id ? (
                <CheckInForm
                  key={row.checkIn.id}
                  initialDraft={draftFromSampleCheckIn(row.checkIn)}
                  today={localDateString()}
                  isEditing
                  saving={false}
                  saveError=""
                  onSave={(values) => {
                    onUpdate(applyToSampleCheckIn(row.checkIn, values));
                    setAction(null);
                  }}
                  onCancel={() => setAction(null)}
                />
              ) : (
                <CheckInListItem
                  key={row.checkIn.id}
                  row={row}
                  confirmingDelete={action?.kind === "confirm-delete" && action.id === row.checkIn.id}
                  onEdit={() => setAction({ id: row.checkIn.id, kind: "edit" })}
                  onAskDelete={() => setAction({ id: row.checkIn.id, kind: "confirm-delete" })}
                  onCancelDelete={() => setAction(null)}
                  onConfirmDelete={() => {
                    onDelete(row.checkIn.id);
                    setAction(null);
                  }}
                />
              ),
            )}
          </View>
        ))
      )}

      {rows.length > COLLAPSED_COUNT && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
        >
          <Text style={styles.toggleButtonText}>
            {expanded ? "Show fewer" : `Show all ${rows.length} check-ins`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

type CheckInListItemProps = {
  row: CheckInRow;
  confirmingDelete: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

function CheckInListItem({ row, confirmingDelete, onEdit, onAskDelete, onCancelDelete, onConfirmDelete }: CheckInListItemProps) {
  const { checkIn, isLatest, isFirst, weightChange, measurements } = row;
  const [year, month, day] = checkIn.date.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short" });

  const changeText =
    weightChange === null
      ? "Starting check-in"
      : `${formatSignedMeasurement(weightChange, "kg")} since last check-in`;

  return (
    <View style={[styles.itemCard, isLatest && styles.itemLatest]}>
      <View
        style={styles.item}
        accessible
        accessibilityLabel={[
          `${isLatest ? "Latest check-in, " : ""}${formatShortGoalDate(checkIn.date)}`,
          `weight ${formatMeasurement(checkIn.weightKg, "kg")}`,
          changeText,
          ...measurements.map((m) => `${m.label} ${formatMeasurement(m.value, "cm")}`),
          checkIn.note,
        ]
          .filter(Boolean)
          .join(", ")}
      >
        <View style={[styles.dateChip, isLatest && styles.dateChipLatest]}>
          <Text style={[styles.dateWeekday, isLatest && styles.dateTextLatest]}>{weekday}</Text>
          <Text style={[styles.dateDay, isLatest && styles.dateTextLatest]}>{day}</Text>
        </View>

        <View style={styles.itemBody}>
          <View style={styles.weightRow}>
            <Text style={styles.weight}>{formatMeasurement(checkIn.weightKg, "kg")}</Text>
            {isLatest && (
              <View style={styles.latestBadge}>
                <Text style={styles.latestBadgeText}>Latest</Text>
              </View>
            )}
          </View>
          <Text style={[styles.change, isFirst && styles.changeFirst]}>{changeText}</Text>

          {measurements.length > 0 && (
            <Text style={styles.measurements}>
              {measurements
                .map(
                  (m) =>
                    `${m.label} ${formatMeasurement(m.value, "cm")}${
                      m.change === null ? "" : ` (${formatSignedMeasurement(m.change, "cm")})`
                    }`,
                )
                .join(" · ")}
            </Text>
          )}

          {checkIn.note && <Text style={styles.note}>“{checkIn.note}”</Text>}
        </View>
      </View>

      {confirmingDelete ? (
        <View style={styles.confirm} accessibilityLiveRegion="polite">
          <Text style={styles.confirmText}>Delete the {formatShortGoalDate(checkIn.date)} check-in? This can’t be undone.</Text>
          <View style={styles.actions}>
            <RowButton label="Keep it" onPress={onCancelDelete} />
            <RowButton label="Delete" danger onPress={onConfirmDelete} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <RowButton label="Edit" accessibilityLabel={`Edit ${formatShortGoalDate(checkIn.date)} check-in`} onPress={onEdit} />
          <RowButton label="Delete" danger accessibilityLabel={`Delete ${formatShortGoalDate(checkIn.date)} check-in`} onPress={onAskDelete} />
        </View>
      )}
    </View>
  );
}

type RowButtonProps = { label: string; accessibilityLabel?: string; danger?: boolean; onPress: () => void };

function RowButton({ label, accessibilityLabel, danger = false, onPress }: RowButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.rowButton, danger && styles.rowButtonDanger, pressed && styles.toggleButtonPressed]}
    >
      <Text style={[styles.rowButtonText, danger && styles.rowButtonTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const CHIP_SIZE = 48;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
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
  caption: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  month: {
    marginTop: spacing.md,
  },
  monthTitle: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  itemCard: {
    borderRadius: radii.control,
    paddingBottom: spacing.sm,
  },
  item: {
    flexDirection: "row",
    gap: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + spacing.xs,
  },
  itemLatest: {
    backgroundColor: colors.surfaceMuted,
  },
  dateChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    height: CHIP_SIZE,
    justifyContent: "center",
    width: CHIP_SIZE,
  },
  dateChipLatest: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  dateWeekday: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dateDay: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  dateTextLatest: {
    color: colors.surface,
  },
  itemBody: {
    flex: 1,
  },
  weightRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  weight: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  latestBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  latestBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "700",
  },
  change: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: 2,
  },
  changeFirst: {
    fontStyle: "italic",
  },
  measurements: {
    color: colors.text,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  note: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  rowButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget * 2,
    paddingHorizontal: spacing.md,
  },
  rowButtonDanger: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerMuted,
  },
  rowButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  rowButtonTextDanger: {
    color: colors.danger,
  },
  confirm: {
    gap: spacing.sm,
  },
  confirmText: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "600",
    paddingHorizontal: spacing.sm,
  },
  toggleButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  toggleButtonPressed: {
    opacity: 0.8,
  },
  toggleButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
