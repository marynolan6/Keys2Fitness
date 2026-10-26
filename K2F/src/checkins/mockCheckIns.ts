import type { CheckIn } from "./checkIn";

// Flip to `true` to preview a client with no recorded progress (no check-ins, no progress stats).
export const PREVIEW_NO_PROGRESS = false;

// Placeholder until check-ins come from the backend. Kept out of date order on purpose; screens sort them.
const sampleCheckIns: CheckIn[] = [
  { id: "c2", date: "2026-09-08", weightKg: 71.4 },
  { id: "c3", date: "2026-09-15", weightKg: 70.6, note: "First full week hitting 3 workouts." },
  {
    id: "c6",
    date: "2026-10-03",
    weightKg: 68.2,
    measurements: { waistCm: 76, hipsCm: 96, armCm: 31 },
    note: "Bench press up to 110 lb. Coach asked for a form-check video.",
  },
  {
    id: "c1",
    date: "2026-09-01",
    weightKg: 72.2,
    measurements: { waistCm: 79, hipsCm: 98, armCm: 30 },
    note: "Starting check-in with Coach Keys.",
  },
  { id: "c5", date: "2026-09-29", weightKg: 69.0 },
  { id: "c4", date: "2026-09-22", weightKg: 69.9 },
];

export const mockCheckIns: CheckIn[] = PREVIEW_NO_PROGRESS ? [] : sampleCheckIns;
