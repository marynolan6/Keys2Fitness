import type { CheckIn } from "./checkIn";

export const weightRanges = [30, 90, "all"] as const;
export type WeightRange = (typeof weightRanges)[number];
export const rangeLabel = (range: WeightRange) => range === "all" ? "All time" : `${range} days`;

const dayMs = 86_400_000;

// Use UTC only as a calendar-day index: DST and the device's time zone must not
// shift a check-in across an inclusive range boundary.
function calendarDay(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date ? time / dayMs : null;
}

type Reading = Pick<CheckIn, "id" | "date" | "weightKg">;
type ChartPoint = Reading & { x: number; y: number }; // fractions from the left/top of the plot
export type WeightPlot = {
  kind: "single" | "same-day" | "line";
  points: ChartPoint[];
  startDate: string;
  endDate: string;
  lowKg: number;
  highKg: number;
  // Fraction from the top of the plot for the goal target, when one was given.
  targetY?: number;
};

// `targetKg` (an active weight goal) is kept inside the vertical scale so its line is always visible.
export function buildWeightChart(checkIns: readonly Reading[], range: WeightRange, through: string, targetKg?: number):
  WeightPlot | { kind: "empty"; hasEarlier: boolean } {
  const end = calendarDay(through);
  if (end === null) return { kind: "empty", hasEarlier: false };
  const cutoff = range === "all" ? -Infinity : end - (range - 1);
  let hasEarlier = false;
  const readings = checkIns.flatMap(({ id, date, weightKg }) => {
    const day = calendarDay(date);
    if (day === null || day > end || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > Number.MAX_SAFE_INTEGER) return [];
    if (day < cutoff) { hasEarlier = true; return []; }
    return [{ id, date, weightKg, day }];
  }).sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
  if (!readings.length) return { kind: "empty", hasEarlier };

  const first = readings[0];
  const last = readings[readings.length - 1];
  const start = range === "all" ? first.day : cutoff;
  let min = first.weightKg, max = first.weightKg;
  for (const { weightKg } of readings) { min = Math.min(min, weightKg); max = Math.max(max, weightKg); }
  const hasTarget = targetKg !== undefined && Number.isFinite(targetKg) && targetKg > 0;
  if (hasTarget) { min = Math.min(min, targetKg); max = Math.max(max, targetKg); }
  // A flat series (including a single weigh-in) still has a usable vertical scale.
  const padding = Math.max(0.5, (max - min) / 10, max * Number.EPSILON);
  const lowKg = Math.max(0, Math.floor(min - padding));
  const highKg = Math.ceil(max + padding);

  return {
    kind: readings.length === 1 ? "single" : first.day === last.day ? "same-day" : "line",
    startDate: new Date(start * dayMs).toISOString().slice(0, 10), endDate: through, lowKg, highKg,
    ...(hasTarget && { targetY: (highKg - targetKg) / (highKg - lowKg) }),
    points: readings.map(({ day, ...reading }) => ({ ...reading,
      x: start === end ? 0.5 : (day - start) / (end - start),
      y: (highKg - reading.weightKg) / (highKg - lowKg),
    })),
  };
}
