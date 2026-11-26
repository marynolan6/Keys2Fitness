import { useSyncExternalStore } from "react";

import { mockVideoSubmissions } from "./mockVideoSubmissions";
import { completeReview, splitByStatus, type ReviewResult, type VideoSubmission } from "./videoReview";

// K2F-58: In-memory review state shared by the queue and review screens, same idea as
// clientStore.ts. Seeded from the sample videos, so it resets when the app restarts.
// Swap for Firebase once clients can upload.

let submissions: readonly VideoSubmission[] = mockVideoSubmissions;
const listeners = new Set<() => void>();

function getSubmissions(): readonly VideoSubmission[] {
  return submissions;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVideoSubmissions(): readonly VideoSubmission[] {
  return useSyncExternalStore(subscribe, getSubmissions, getSubmissions);
}

export function useVideoReviewQueue() {
  return splitByStatus(useVideoSubmissions());
}

export function submitVideoReview(videoId: string, feedback: string): ReviewResult {
  const result = completeReview(submissions, videoId, feedback, new Date());
  if (result.ok) {
    submissions = result.submissions;
    listeners.forEach((listener) => listener());
  }
  return result;
}
