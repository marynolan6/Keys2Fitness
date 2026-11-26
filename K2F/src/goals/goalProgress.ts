import type { CheckIn } from "../checkins/checkIn";
import { formatMeasurement, formatShortGoalDate, getGoalProgress, type FitnessGoal, type GoalDate, type GoalProgress } from "./goal";
import { goalEntries, goalTypeInfo } from "./goalForm";

// The goal with its values read from the given check-ins, so progress always uses the
// latest check-in that recorded this goal's type.
export function withCheckIns(goal: FitnessGoal, checkIns: readonly CheckIn[]): FitnessGoal {
  return { ...goal, entries: goalEntries(goal.type, checkIns) };
}

export type GoalStanding = {
  progress: GoalProgress;
  // e.g. "5.4 lb to go", "Goal reached", "No waist measurement yet"
  headline: string;
  // e.g. "62% of the way · latest check-in Oct 3"
  detail: string;
  // e.g. "36 days left until Dec 31, 2026"; omitted once the goal is reached.
  deadline?: string;
};

export function describeGoalStanding(goal: FitnessGoal, today: GoalDate): GoalStanding {
  const progress = getGoalProgress(goal);
  const { label } = goalTypeInfo(goal.type);
  const noun = goal.type === "weight" ? "weight" : `${label.toLowerCase()} measurement`;
  const latest = `latest check-in ${formatShortGoalDate(progress.asOf)}`;

  if (progress.status === "no-data") {
    return {
      progress,
      headline: `No ${noun} recorded yet`,
      detail: `Progress will show after a check-in that includes your ${noun}.`,
      deadline: describeDeadline(goal.targetDate, today),
    };
  }
  if (progress.status === "achieved") {
    const reachedOn = progress.achievedOn ? ` on ${formatShortGoalDate(progress.achievedOn)}` : "";
    return { progress, headline: `Goal reached${reachedOn}`, detail: `Now ${formatMeasurement(progress.currentValue, goal.unit)} · ${latest}` };
  }

  // Moving away from the target shows plainly instead of as "0% done".
  const start = progress.startValue ?? progress.currentValue;
  const movedAway = progress.changeSoFar === 0 && progress.currentValue !== start;
  const where = movedAway
    ? `${progress.direction === "decrease" ? "Up" : "Down"} ${formatMeasurement(Math.abs(progress.currentValue - start), goal.unit)} since you started`
    : `${progress.percent}% of the way`;
  return {
    progress,
    headline: `${formatMeasurement(progress.remaining, goal.unit)} to go`,
    detail: `${where} · ${latest}`,
    deadline: describeDeadline(goal.targetDate, today),
  };
}

function describeDeadline(targetDate: GoalDate, today: GoalDate): string {
  const days = Math.round((Date.parse(`${targetDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  const date = `${formatShortGoalDate(targetDate)}, ${targetDate.slice(0, 4)}`;
  if (days > 1) return `${days} days left until ${date}`;
  if (days === 1) return `1 day left until ${date}`;
  if (days === 0) return `Target date is today (${date})`;
  return `Target date passed (${date})`;
}

// The goal the weight chart marks: the first weight goal whose target date hasn't passed.
export function activeWeightGoal(goals: readonly FitnessGoal[], today: GoalDate): FitnessGoal | undefined {
  return goals.find((goal) => goal.type === "weight" && goal.targetDate >= today);
}
