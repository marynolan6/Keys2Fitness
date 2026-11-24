import type { VideoSubmission } from "./videoReview";

// K2F-58: Sample videos until clients can upload their own.
// Client IDs and names match mockClients.ts (1 = Spencer, 2 = Alex Morgan).
// The clip is a free CC0 sample from MDN, NOT a real client video. The UI labels it as a sample.
const sampleClip = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

// Set to true to see the empty review queue
export const PREVIEW_NO_VIDEOS = false;

const sampleSubmissions: VideoSubmission[] = [
  {
    id: "v1",
    clientId: "1",
    clientName: "Spencer",
    exerciseName: "Bench Press",
    submittedAt: "2026-11-14T17:20:00.000Z",
    uri: sampleClip,
    isSample: true,
    clientNote: "Last set felt shaky. Is my elbow angle okay?",
    status: "pending",
  },
  {
    id: "v2",
    clientId: "2",
    clientName: "Alex Morgan",
    exerciseName: "Back Squat",
    submittedAt: "2026-11-15T14:05:00.000Z",
    uri: sampleClip,
    isSample: true,
    clientNote: "First time going below parallel.",
    status: "pending",
  },
  {
    id: "v3",
    clientId: "1",
    clientName: "Spencer",
    exerciseName: "Seated Cable Row",
    submittedAt: "2026-11-16T19:45:00.000Z",
    uri: sampleClip,
    isSample: true,
    status: "pending",
  },
  {
    id: "v4",
    clientId: "2",
    clientName: "Alex Morgan",
    exerciseName: "Romanian Deadlift",
    submittedAt: "2026-11-10T16:00:00.000Z",
    uri: sampleClip,
    isSample: true,
    clientNote: "Hamstrings were really tight.",
    status: "reviewed",
    feedback: "Good hip hinge. Keep the bar closer to your legs on the way down.",
    reviewedAt: "2026-11-11T15:30:00.000Z",
  },
];

export const mockVideoSubmissions: VideoSubmission[] = PREVIEW_NO_VIDEOS ? [] : sampleSubmissions;
