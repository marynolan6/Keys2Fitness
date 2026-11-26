import type { CheckIn } from "../checkins/checkIn";
import { formatMeasurement, sortEntriesNewestFirst, type FitnessGoal, type GoalDate, type GoalEntry, type GoalType } from "./goal";

type GoalTypeInfo = {
  type: GoalType;
  label: string;
  metricLabel: string;
  // Stored unit, and the imperial unit shown and typed in the form.
  unit: "kg" | "cm";
  displayUnit: "lb" | "in";
  // Largest target accepted, in the display unit.
  max: number;
  read: (checkIn: CheckIn) => number | undefined;
};

export const GOAL_TYPES: readonly GoalTypeInfo[] = [
  { type: "weight", label: "Weight", metricLabel: "Current weight", unit: "kg", displayUnit: "lb", max: 1000, read: (c) => c.weightKg },
  { type: "waist", label: "Waist", metricLabel: "Current waist", unit: "cm", displayUnit: "in", max: 100, read: (c) => c.measurements?.waistCm },
  { type: "hips", label: "Hips", metricLabel: "Current hips", unit: "cm", displayUnit: "in", max: 100, read: (c) => c.measurements?.hipsCm },
  { type: "arm", label: "Arm", metricLabel: "Current arm", unit: "cm", displayUnit: "in", max: 100, read: (c) => c.measurements?.armCm },
];

export function goalTypeInfo(type: GoalType): GoalTypeInfo {
  return GOAL_TYPES.find((info) => info.type === type) ?? GOAL_TYPES[0];
}

const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;
const toDisplay = (value: number, unit: "kg" | "cm") => Number((unit === "kg" ? value * LB_PER_KG : value / CM_PER_IN).toFixed(1));
const toStored = (value: number, unit: "kg" | "cm") => (unit === "kg" ? value / LB_PER_KG : value * CM_PER_IN);

// The device's local calendar day as "YYYY-MM-DD".
export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Raw text from the goal form.
export type GoalDraft = { type: GoalType; targetValue: string; targetDate: string };
export type GoalField = "targetValue" | "targetDate";
export type GoalValues = { type: GoalType; targetValue: number; targetDate: GoalDate }; // targetValue in the stored unit

export type GoalValidation =
  | { ok: true; values: GoalValues }
  | { ok: false; errors: Partial<Record<GoalField, string>> };

export function emptyGoalDraft(): GoalDraft {
  return { type: "weight", targetValue: "", targetDate: "" };
}

export function draftFromGoal(goal: FitnessGoal): GoalDraft {
  const { unit } = goalTypeInfo(goal.type);
  return { type: goal.type, targetValue: String(toDisplay(goal.targetValue, unit)), targetDate: goal.targetDate };
}

// Plain decimals only: Number() would also accept "0x10", "1e2" and "Infinity".
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/;

// `today` is the device's local "YYYY-MM-DD"; ISO dates compare correctly as strings.
export function validateGoal(draft: GoalDraft, today: string): GoalValidation {
  const info = goalTypeInfo(draft.type);
  const errors: Partial<Record<GoalField, string>> = {};

  const text = draft.targetValue.trim();
  const value = Number(text);
  const name = `Target ${info.label.toLowerCase()}`;
  if (!text) errors.targetValue = `Enter a target ${info.label.toLowerCase()} in ${info.displayUnit}.`;
  else if (!DECIMAL.test(text)) errors.targetValue = `${name} must be a number, like 150.5.`;
  else if (value < 0) errors.targetValue = `${name} can't be negative.`;
  else if (value === 0) errors.targetValue = `${name} must be more than 0 ${info.displayUnit}.`;
  else if (value > info.max) errors.targetValue = `${name} must be ${info.max.toLocaleString("en-US")} ${info.displayUnit} or less.`;

  const targetDate = draft.targetDate.trim();
  if (!isCalendarDate(targetDate)) errors.targetDate = "Enter the target date as YYYY-MM-DD, for example 2026-12-31.";
  else if (targetDate < today) errors.targetDate = "The target date can't be in the past.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, values: { type: draft.type, targetValue: toStored(value, info.unit), targetDate } };
}

function isCalendarDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}

export function goalEntries(type: GoalType, checkIns: readonly CheckIn[]): GoalEntry[] {
  const { read } = goalTypeInfo(type);
  return checkIns.flatMap((checkIn) => {
    const value = read(checkIn);
    return value === undefined ? [] : [{ date: checkIn.date, value }];
  });
}

// A new goal starts from the latest recorded value of its type. Editing keeps the starting
// point unless the type changes, so progress so far isn't reset by moving the target.
export function buildGoal(
  id: string,
  values: GoalValues,
  checkIns: readonly CheckIn[],
  today: GoalDate,
  previous?: FitnessGoal,
): FitnessGoal {
  const info = goalTypeInfo(values.type);
  const entries = goalEntries(values.type, checkIns);
  const keepStart = previous?.type === values.type;
  const latest = sortEntriesNewestFirst(entries)[0];

  return {
    id,
    type: values.type,
    title: `${info.label} to ${formatMeasurement(values.targetValue, info.unit)}`,
    metricLabel: info.metricLabel,
    unit: info.unit,
    // With nothing recorded yet, the next relevant check-in becomes the starting point.
    startValue: keepStart ? previous.startValue : (latest?.value ?? null),
    targetValue: values.targetValue,
    startDate: keepStart ? previous.startDate : (latest?.date ?? today),
    targetDate: values.targetDate,
    entries,
  };
}
