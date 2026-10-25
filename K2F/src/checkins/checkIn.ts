import type { GoalDate } from "@/goals/goal";

export type BodyMeasurementKey = "waistCm" | "hipsCm" | "armCm";

export type CheckIn = {
  id: string;
  date: GoalDate;
  weightKg: number;
  // Body measurements are optional; most check-ins only record weight.
  measurements?: Partial<Record<BodyMeasurementKey, number>>;
  note?: string;
};

export const MEASUREMENT_LABELS: Record<BodyMeasurementKey, string> = {
  waistCm: "Waist",
  hipsCm: "Hips",
  armCm: "Arm",
};

export type MeasurementReading = {
  key: BodyMeasurementKey;
  label: string;
  value: number;
  // Change since the most recent earlier check-in that recorded this measurement.
  change: number | null;
};

export type CheckInRow = {
  checkIn: CheckIn;
  isLatest: boolean;
  isFirst: boolean;
  // Change since the previous check-in; `null` for the first one.
  weightChange: number | null;
  measurements: MeasurementReading[];
};

export type CheckInMonth = {
  // e.g. "October 2026"
  title: string;
  rows: CheckInRow[];
};

// Newest first; ties keep a stable order by id. "YYYY-MM-DD" strings sort chronologically.
export function sortCheckInsNewestFirst(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function buildCheckInRows(checkIns: CheckIn[]): CheckInRow[] {
  const newestFirst = sortCheckInsNewestFirst(checkIns);

  return newestFirst.map((checkIn, index) => {
    const older = newestFirst.slice(index + 1);
    const previous = older[0];
    const measurementKeys = Object.keys(MEASUREMENT_LABELS) as BodyMeasurementKey[];

    const measurements = measurementKeys.flatMap((key) => {
      const value = checkIn.measurements?.[key];
      if (value === undefined) return [];
      const earlier = older.find((c) => c.measurements?.[key] !== undefined)?.measurements?.[key];
      return [{ key, label: MEASUREMENT_LABELS[key], value, change: earlier === undefined ? null : value - earlier }];
    });

    return {
      checkIn,
      isLatest: index === 0,
      isFirst: previous === undefined,
      weightChange: previous ? checkIn.weightKg - previous.weightKg : null,
      measurements,
    };
  });
}

export function groupCheckInsByMonth(rows: CheckInRow[]): CheckInMonth[] {
  const months: CheckInMonth[] = [];
  for (const row of rows) {
    const [year, month] = row.checkIn.date.split("-").map(Number);
    const title = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const current = months[months.length - 1];
    if (current?.title === title) current.rows.push(row);
    else months.push({ title, rows: [row] });
  }
  return months;
}
