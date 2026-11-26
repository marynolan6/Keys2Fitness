// Local calendar date, "YYYY-MM-DD".
export type GoalDate = string;

export type GoalEntry = {
  date: GoalDate;
  value: number;
};

// Each type follows one value recorded in check-ins.
export type GoalType = "weight" | "waist" | "hips" | "arm";

export type FitnessGoal = {
  id: string;
  type: GoalType;
  title: string;
  metricLabel: string;
  unit: string;
  // `null` when the goal was set before anything of its type was recorded; the first
  // check-in on or after `startDate` then becomes the starting point.
  startValue: number | null;
  targetValue: number;
  startDate: GoalDate;
  targetDate: GoalDate;
  // Recorded measurements, in any order.
  entries: GoalEntry[];
};

// "no-data": nothing recorded yet, so progress can't be measured.
// "achieved": a recorded measurement has reached the target.
export type GoalStatus = "no-data" | "in-progress" | "achieved";

export type GoalProgress = {
  status: GoalStatus;
  // The goal's starting point, or `null` while nothing has been recorded to start from.
  startValue: number | null;
  // Most recent recorded value, or the start value if nothing has been recorded yet.
  currentValue: number;
  // Date of that value (the start date if nothing has been recorded yet).
  asOf: GoalDate;
  hasEntries: boolean;
  // 0–1, clamped.
  fraction: number;
  percent: number;
  // Distance already covered toward the target (always >= 0).
  changeSoFar: number;
  // Distance left to the target (always >= 0).
  remaining: number;
  direction: "decrease" | "increase";
  reached: boolean;
  // Date of the first measurement that hit the target, if any.
  achievedOn?: GoalDate;
};

// Newest first. "YYYY-MM-DD" strings sort chronologically.
export function sortEntriesNewestFirst(entries: GoalEntry[]): GoalEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function getGoalProgress(goal: FitnessGoal): GoalProgress {
  const { targetValue } = goal;
  const newestFirst = sortEntriesNewestFirst(goal.entries);
  const latest = newestFirst[0];
  const startValue = goal.startValue ?? firstEntrySince(newestFirst, goal.startDate)?.value ?? null;
  if (startValue === null || latest === undefined) return noDataProgress(goal, startValue);
  const currentValue = latest.value;

  const direction = targetValue < startValue ? "decrease" : "increase";
  const sign = direction === "decrease" ? -1 : 1;

  const total = (targetValue - startValue) * sign;
  const changeSoFar = Math.max(0, (currentValue - startValue) * sign);
  const remaining = Math.max(0, (targetValue - currentValue) * sign);
  const fraction = total <= 0 ? 1 : Math.min(1, changeSoFar / total);
  const reached = remaining === 0;
  const hitsTarget = (value: number) => (targetValue - value) * sign <= 0;
  const achievedOn = reached
    ? [...goal.entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .find((entry) => hitsTarget(entry.value))?.date
    : undefined;

  return {
    status: reached ? "achieved" : "in-progress",
    startValue,
    currentValue,
    asOf: latest.date,
    hasEntries: true,
    fraction,
    percent: Math.round(fraction * 100),
    changeSoFar,
    remaining,
    direction,
    reached,
    achievedOn,
  };
}

// Oldest entry dated on or after `date`, or the oldest entry if every one is earlier.
function firstEntrySince(newestFirst: GoalEntry[], date: GoalDate): GoalEntry | undefined {
  const oldestFirst = [...newestFirst].reverse();
  return oldestFirst.find((entry) => entry.date >= date) ?? oldestFirst[0];
}

function noDataProgress(goal: FitnessGoal, startValue: number | null): GoalProgress {
  return {
    status: "no-data",
    startValue,
    currentValue: startValue ?? goal.targetValue,
    asOf: goal.startDate,
    hasEntries: false,
    fraction: 0,
    percent: 0,
    changeSoFar: 0,
    remaining: startValue === null ? 0 : Math.abs(goal.targetValue - startValue),
    direction: startValue !== null && goal.targetValue < startValue ? "decrease" : "increase",
    reached: false,
  };
}

// Measurement values are stored in backend units but displayed in imperial units.
export function describeGoalProgress(goal: FitnessGoal, progress: GoalProgress): string {
  const verb = progress.direction === "decrease" ? "down" : "up";
  const since = formatGoalDate(goal.startDate);
  const changeText =
    progress.changeSoFar > 0
      ? `${formatMeasurement(progress.changeSoFar, goal.unit)} ${verb} since ${since}`
      : `Started ${since}`;
  if (progress.status === "no-data") {
    return `No measurements yet · aiming for ${formatMeasurement(goal.targetValue, goal.unit)}`;
  }
  if (progress.status === "achieved") {
    return `Goal reached! ${changeText}.`;
  }
  return `${changeText} · ${formatMeasurement(progress.remaining, goal.unit)} to go`;
}

// Convert stored metric values at the presentation boundary.
export function formatMeasurement(value: number, unit: string): string {
  if (unit === "kg") return `${Number((value * 2.20462).toFixed(1))} lb`;
  if (unit === "cm") return `${Number((value / 2.54).toFixed(1))} in`;
  return `${Number(value.toFixed(1))} ${unit}`;
}

// -4 -> "−8.8 lb", 1.5 -> "+3.3 lb"
export function formatSignedMeasurement(value: number, unit: string): string {
  const rounded = Number(value.toFixed(1));
  if (rounded === 0) return formatMeasurement(0, unit);
  return `${rounded > 0 ? "+" : "−"}${formatMeasurement(Math.abs(rounded), unit)}`;
}

function parseGoalDate(date: GoalDate): Date {
  // Parsed as a local date so it doesn't shift a day in US time zones.
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "2026-09-01" -> "September 1"
export function formatGoalDate(date: GoalDate): string {
  return parseGoalDate(date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// "2026-09-01" -> "Sep 1"
export function formatShortGoalDate(date: GoalDate): string {
  return parseGoalDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
