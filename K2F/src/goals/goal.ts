// Local calendar date, "YYYY-MM-DD".
export type GoalDate = string;

export type GoalEntry = {
  date: GoalDate;
  value: number;
};

export type FitnessGoal = {
  title: string;
  metricLabel: string;
  unit: string;
  startValue: number;
  targetValue: number;
  startDate: GoalDate;
  // Recorded measurements, in any order.
  entries: GoalEntry[];
};

// "no-data": nothing recorded yet, so progress can't be measured.
// "achieved": a recorded measurement has reached the target.
export type GoalStatus = "no-data" | "in-progress" | "achieved";

export type GoalProgress = {
  status: GoalStatus;
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
  const { startValue, targetValue } = goal;
  const latest = sortEntriesNewestFirst(goal.entries)[0];
  const currentValue = latest?.value ?? startValue;

  const direction = targetValue < startValue ? "decrease" : "increase";
  const sign = direction === "decrease" ? -1 : 1;

  const total = (targetValue - startValue) * sign;
  const changeSoFar = Math.max(0, (currentValue - startValue) * sign);
  const remaining = Math.max(0, (targetValue - currentValue) * sign);
  const hasEntries = latest !== undefined;
  const fraction = !hasEntries ? 0 : total <= 0 ? 1 : Math.min(1, changeSoFar / total);
  const reached = hasEntries && remaining === 0;
  const hitsTarget = (value: number) => (targetValue - value) * sign <= 0;
  const achievedOn = reached
    ? [...goal.entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .find((entry) => hitsTarget(entry.value))?.date
    : undefined;

  return {
    status: reached ? "achieved" : hasEntries ? "in-progress" : "no-data",
    currentValue,
    asOf: latest?.date ?? goal.startDate,
    hasEntries,
    fraction,
    percent: Math.round(fraction * 100),
    changeSoFar,
    remaining,
    direction,
    reached,
    achievedOn,
  };
}

// "4 kg down since September 1 · 3.2 kg to go"; different wording with no data or once the target is hit.
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

// 68.2 -> "68.2", 65 -> "65"
export function formatMeasurement(value: number, unit: string): string {
  return `${Number(value.toFixed(1))} ${unit}`;
}

// -4 -> "−4 kg", 1.5 -> "+1.5 kg"
export function formatSignedMeasurement(value: number, unit: string): string {
  const rounded = Number(value.toFixed(1));
  if (rounded === 0) return `0 ${unit}`;
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
