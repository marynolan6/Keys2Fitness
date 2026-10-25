import type { GoalDate } from "@/goals/goal";

// Any value can be missing (`null`) until it's been recorded.
export type ClientStats = {
  latestWeight: { value: number; unit: string; date: GoalDate } | null;
  heightCm: number | null;
  age: number | null;
  workoutsCompleted: number | null;
  dailySteps: number | null;
  consistencyPercent: number | null;
};

export type StatItem = {
  label: string;
  // `null` when the stat hasn't been recorded.
  value: string | null;
  detail?: string;
};

const formatCount = (value: number) => Math.round(value).toLocaleString("en-US");
const formatDecimal = (value: number) => `${Number(value.toFixed(1))}`;

export function buildStatItems(
  stats: ClientStats,
  formatDate: (date: GoalDate) => string,
): StatItem[] {
  const { latestWeight } = stats;
  const orNull = <T,>(value: T | null, format: (v: T) => string) =>
    value === null ? null : format(value);

  return [
    {
      label: "Weight",
      value: latestWeight ? `${formatDecimal(latestWeight.value)} ${latestWeight.unit}` : null,
      detail: latestWeight ? formatDate(latestWeight.date) : undefined,
    },
    { label: "Height", value: orNull(stats.heightCm, (v) => `${formatCount(v)} cm`) },
    { label: "Age", value: orNull(stats.age, formatCount) },
    { label: "Workouts", value: orNull(stats.workoutsCompleted, formatCount) },
    { label: "Daily steps", value: orNull(stats.dailySteps, formatCount) },
    { label: "Consistency", value: orNull(stats.consistencyPercent, (v) => `${Math.round(v)}%`) },
  ];
}

// Height and age describe the client; everything else is progress they've recorded over time.
export function hasRecordedProgress(stats: ClientStats): boolean {
  return (
    stats.latestWeight !== null ||
    stats.workoutsCompleted !== null ||
    stats.dailySteps !== null ||
    stats.consistencyPercent !== null
  );
}
