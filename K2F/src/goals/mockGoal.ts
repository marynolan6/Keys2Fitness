import { mockCheckIns } from "@/checkins/mockCheckIns";

import type { FitnessGoal } from "./goal";

// Placeholder until goals come from the backend. Set to `null` to preview the no-goal state.
// Weight entries come from the client's check-ins so every screen shows the same numbers.
export const mockCurrentGoal: FitnessGoal | null = {
  title: "Build strength & reach 65 kg",
  metricLabel: "Current weight",
  unit: "kg",
  startValue: 72.2,
  targetValue: 65,
  startDate: "2026-09-01",
  entries: mockCheckIns.map((checkIn) => ({ date: checkIn.date, value: checkIn.weightKg })),
};
