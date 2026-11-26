import type { BodyMeasurementKey, CheckIn } from "./checkIn";

export const CHECK_IN_MEASUREMENTS = [
  { key: "waistIn", label: "Waist" },
  { key: "hipsIn", label: "Hips" },
  { key: "armIn", label: "Arm" },
] as const;

export type CheckInMeasurementKey = (typeof CHECK_IN_MEASUREMENTS)[number]["key"];
export type CheckInMeasurements = Partial<Record<CheckInMeasurementKey, number>>;

// Raw text from the form inputs.
export type CheckInDraft = { date: string; weight: string } & Record<CheckInMeasurementKey, string>;
export type CheckInField = keyof CheckInDraft;

export type CheckInValues = { date: string; weightLb: number; measurementsIn: CheckInMeasurements };

export type CheckInValidation =
  | { ok: true; values: CheckInValues }
  | { ok: false; errors: Partial<Record<CheckInField, string>> };

const MAX_WEIGHT_LB = 1000;
const MAX_MEASUREMENT_IN = 100;

export function emptyCheckInDraft(date: string): CheckInDraft {
  return { date, weight: "", waistIn: "", hipsIn: "", armIn: "" };
}

export function draftFromCheckIn(date: string, weightLb: number, measurementsIn: CheckInMeasurements = {}): CheckInDraft {
  const draft = { ...emptyCheckInDraft(date), weight: String(weightLb) };
  for (const { key } of CHECK_IN_MEASUREMENTS) {
    const value = measurementsIn[key];
    if (value !== undefined) draft[key] = String(value);
  }
  return draft;
}

// `today` is the device's local "YYYY-MM-DD"; ISO dates compare correctly as strings.
export function validateCheckIn(draft: CheckInDraft, today: string): CheckInValidation {
  const errors: Partial<Record<CheckInField, string>> = {};

  const date = draft.date.trim();
  if (!isCalendarDate(date)) errors.date = "Enter the date as YYYY-MM-DD, for example 2026-11-25.";
  else if (date > today) errors.date = "The check-in date can't be in the future.";

  const weight = parseAmount(draft.weight, "Weight", "lb", MAX_WEIGHT_LB);
  if ("error" in weight) errors.weight = weight.error;

  const measurementsIn: CheckInMeasurements = {};
  for (const { key, label } of CHECK_IN_MEASUREMENTS) {
    if (!draft[key].trim()) continue;
    const measurement = parseAmount(draft[key], label, "in", MAX_MEASUREMENT_IN);
    if ("error" in measurement) errors[key] = measurement.error;
    else measurementsIn[key] = measurement.value;
  }

  if ("error" in weight || Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, values: { date, weightLb: weight.value, measurementsIn } };
}

// Plain decimals only: Number() would also accept "0x10", "1e2" and "Infinity".
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/;

function parseAmount(text: string, label: string, unit: string, max: number): { value: number } | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { error: `Enter ${label.toLowerCase()} in ${unit}.` };
  if (!DECIMAL.test(trimmed)) return { error: `${label} must be a number, like 32.5.` };
  const value = Number(trimmed);
  if (value < 0) return { error: `${label} can't be negative.` };
  if (value === 0) return { error: `${label} must be more than 0 ${unit}.` };
  if (value > max) return { error: `${label} must be ${max.toLocaleString("en-US")} ${unit} or less.` };
  return { value };
}

export function isCalendarDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}

export type StoredCheckIn = CheckInValues & { id: string };

// Firestore data is not trusted: an entry with an unusable date or weight is left out of the history,
// and an unusable measurement is dropped from its entry.
export function readStoredCheckIn(id: string, data: Record<string, unknown>): StoredCheckIn | null {
  const { date, weightLb, measurementsIn } = data;
  if (typeof date !== "string" || !isCalendarDate(date) || !isValidAmount(weightLb, MAX_WEIGHT_LB)) return null;

  const measurements: CheckInMeasurements = {};
  if (typeof measurementsIn === "object" && measurementsIn !== null) {
    for (const { key } of CHECK_IN_MEASUREMENTS) {
      const value = (measurementsIn as Record<string, unknown>)[key];
      if (isValidAmount(value, MAX_MEASUREMENT_IN)) measurements[key] = value;
    }
  }
  return { id, date, weightLb, measurementsIn: measurements };
}

function isValidAmount(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max;
}

// The device's local calendar day as "YYYY-MM-DD".
export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Sample check-ins are stored in kg and cm; the form works in lb and inches.
const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;
const oneDecimal = (value: number) => Number(value.toFixed(1));

export function draftFromSampleCheckIn(checkIn: CheckIn): CheckInDraft {
  const measurementsIn: CheckInMeasurements = {};
  for (const { key, sampleKey } of SAMPLE_MEASUREMENT_KEYS) {
    const cm = checkIn.measurements?.[sampleKey];
    if (cm !== undefined) measurementsIn[key] = oneDecimal(cm / CM_PER_IN);
  }
  return draftFromCheckIn(checkIn.date, oneDecimal(checkIn.weightKg * LB_PER_KG), measurementsIn);
}

// Form values as a sample check-in's date, weight and measurements (no id or note).
export function sampleCheckInFromValues({ date, weightLb, measurementsIn }: CheckInValues): Omit<CheckIn, "id"> {
  const measurements: CheckIn["measurements"] = {};
  for (const { key, sampleKey } of SAMPLE_MEASUREMENT_KEYS) {
    const inches = measurementsIn[key];
    if (inches !== undefined) measurements[sampleKey] = inches * CM_PER_IN;
  }
  return { date, weightKg: weightLb / LB_PER_KG, ...(Object.keys(measurements).length > 0 && { measurements }) };
}

// Keeps the check-in's id and note; replaces its date, weight and measurements.
export function applyToSampleCheckIn(checkIn: CheckIn, values: CheckInValues): CheckIn {
  const { measurements: _replaced, ...rest } = checkIn;
  return { ...rest, ...sampleCheckInFromValues(values) };
}

const SAMPLE_MEASUREMENT_KEYS = [
  { key: "waistIn", sampleKey: "waistCm" },
  { key: "hipsIn", sampleKey: "hipsCm" },
  { key: "armIn", sampleKey: "armCm" },
] as const satisfies readonly { key: CheckInMeasurementKey; sampleKey: BodyMeasurementKey }[];
