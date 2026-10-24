import { PREVIEW_NO_PROGRESS } from "@/checkins/mockCheckIns";
import { sortEntriesNewestFirst } from "@/goals/goal";
import { mockCurrentGoal } from "@/goals/mockGoal";

import type { ClientStats } from "./stats";

const latestGoalEntry = mockCurrentGoal ? sortEntriesNewestFirst(mockCurrentGoal.entries)[0] : undefined;

// Placeholder until stats come from the backend. Set any field to `null` to preview a missing value.
// Weight comes from the latest goal measurement so the profile and progress screens agree.
export const mockClientStats: ClientStats = {
  latestWeight:
    mockCurrentGoal && latestGoalEntry
      ? { value: latestGoalEntry.value, unit: mockCurrentGoal.unit, date: latestGoalEntry.date }
      : null,
  heightCm: 168,
  age: 29,
  workoutsCompleted: PREVIEW_NO_PROGRESS ? null : 24,
  dailySteps: PREVIEW_NO_PROGRESS ? null : 8240,
  consistencyPercent: PREVIEW_NO_PROGRESS ? null : 92,
};
