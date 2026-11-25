// K2F-58: Client videos the coach reviews and gives feedback on.
// Plain functions only (no React) so the rules can be unit tested.

export type VideoReviewStatus = "pending" | "reviewed";

export type VideoSubmission = {
  id: string;
  clientId: string;
  clientName: string;
  exerciseName: string;
  // ISO date-time, e.g. "2026-11-16T18:30:00.000Z"
  submittedAt: string;
  uri: string;
  // True for the placeholder clips until clients can upload real videos
  isSample: boolean;
  clientNote?: string;
  status: VideoReviewStatus;
  feedback?: string;
  reviewedAt?: string;
};

export const MAX_FEEDBACK_LENGTH = 1000;

export type ReviewError = "empty-feedback" | "already-reviewed" | "not-found";

export type ReviewResult =
  | { ok: true; submissions: VideoSubmission[] }
  | { ok: false; error: ReviewError };

// K2F-265: pending videos first, the one waiting longest at the top.
// Reviewed videos below, most recently reviewed first.
export function splitByStatus(submissions: readonly VideoSubmission[]) {
  const pending = submissions
    .filter((video) => video.status === "pending")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id));
  const reviewed = submissions
    .filter((video) => video.status === "reviewed")
    .sort((a, b) => (b.reviewedAt ?? b.submittedAt).localeCompare(a.reviewedAt ?? a.submittedAt) || a.id.localeCompare(b.id));
  return { pending, reviewed };
}

// K2F-267: saves the feedback and marks the video reviewed.
// Returns a new list so the original is never changed. A video can only be reviewed once,
// which also stops a double tap on Send from saving twice.
export function completeReview(
  submissions: readonly VideoSubmission[],
  videoId: string,
  feedback: string,
  reviewedAt: Date,
): ReviewResult {
  const video = submissions.find((item) => item.id === videoId);
  if (!video) return { ok: false, error: "not-found" };
  if (video.status === "reviewed") return { ok: false, error: "already-reviewed" };

  const text = feedback.trim().slice(0, MAX_FEEDBACK_LENGTH);
  if (!text) return { ok: false, error: "empty-feedback" };

  return {
    ok: true,
    submissions: submissions.map((item): VideoSubmission =>
      item.id === videoId
        ? { ...item, status: "reviewed", feedback: text, reviewedAt: reviewedAt.toISOString() }
        : item),
  };
}

// "Nov 16, 2026"
export function formatVideoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
