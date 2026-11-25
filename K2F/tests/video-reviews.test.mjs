import assert from "node:assert/strict";
import test from "node:test";
import { mockVideoSubmissions } from "../src/videoReviews/mockVideoSubmissions.ts";
import { completeReview, formatVideoDate, MAX_FEEDBACK_LENGTH, splitByStatus } from "../src/videoReviews/videoReview.ts";

// K2F-58: coach video review queue rules

const video = (id, status, submittedAt, extra = {}) => ({
  id,
  clientId: "1",
  clientName: "Spencer",
  exerciseName: "Bench Press",
  submittedAt,
  uri: "https://example.com/clip.mp4",
  isSample: true,
  status,
  ...extra,
});

const reviewedAt = new Date("2026-11-18T12:00:00.000Z");

test("pending videos are listed with the one waiting longest first", () => {
  const { pending, reviewed } = splitByStatus([
    video("b", "pending", "2026-11-16T10:00:00.000Z"),
    video("old", "reviewed", "2026-11-01T10:00:00.000Z", { reviewedAt: "2026-11-02T10:00:00.000Z" }),
    video("a", "pending", "2026-11-14T10:00:00.000Z"),
  ]);
  assert.deepEqual(pending.map((item) => item.id), ["a", "b"]);
  assert.deepEqual(reviewed.map((item) => item.id), ["old"]);
});

test("reviewed videos are kept apart, most recently reviewed first", () => {
  const { pending, reviewed } = splitByStatus([
    video("r1", "reviewed", "2026-11-01T10:00:00.000Z", { reviewedAt: "2026-11-03T10:00:00.000Z" }),
    video("r2", "reviewed", "2026-11-02T10:00:00.000Z", { reviewedAt: "2026-11-05T10:00:00.000Z" }),
  ]);
  assert.equal(pending.length, 0);
  assert.deepEqual(reviewed.map((item) => item.id), ["r2", "r1"]);
});

test("every sample video names the client who sent it", () => {
  assert.ok(mockVideoSubmissions.length > 0);
  for (const item of mockVideoSubmissions) {
    assert.ok(item.clientId && item.clientName.trim(), item.id);
    assert.equal(item.isSample, true, item.id);
  }
  assert.ok(splitByStatus(mockVideoSubmissions).pending.length > 0);
});

test("completing a review saves trimmed feedback and moves the video out of pending", () => {
  const list = [video("a", "pending", "2026-11-14T10:00:00.000Z"), video("b", "pending", "2026-11-15T10:00:00.000Z")];
  const result = completeReview(list, "a", "  Keep your elbows tucked.  ", reviewedAt);

  assert.equal(result.ok, true);
  const saved = result.submissions.find((item) => item.id === "a");
  assert.equal(saved.status, "reviewed");
  assert.equal(saved.feedback, "Keep your elbows tucked.");
  assert.equal(saved.reviewedAt, reviewedAt.toISOString());
  assert.deepEqual(splitByStatus(result.submissions).pending.map((item) => item.id), ["b"]);
  // The original list is left alone
  assert.equal(list[0].status, "pending");
});

test("blank feedback is rejected and nothing changes", () => {
  const list = [video("a", "pending", "2026-11-14T10:00:00.000Z")];
  assert.deepEqual(completeReview(list, "a", "   \n ", reviewedAt), { ok: false, error: "empty-feedback" });
  assert.equal(list[0].status, "pending");
});

test("a video can't be reviewed twice, so a double tap doesn't overwrite feedback", () => {
  const first = completeReview([video("a", "pending", "2026-11-14T10:00:00.000Z")], "a", "First", reviewedAt);
  assert.equal(first.ok, true);
  const second = completeReview(first.submissions, "a", "Second", reviewedAt);
  assert.deepEqual(second, { ok: false, error: "already-reviewed" });
  assert.equal(first.submissions[0].feedback, "First");
});

test("an unknown video id is reported, not created", () => {
  assert.deepEqual(completeReview([], "missing", "Nice work", reviewedAt), { ok: false, error: "not-found" });
});

test("very long feedback is cut to the limit", () => {
  const result = completeReview([video("a", "pending", "2026-11-14T10:00:00.000Z")], "a", "x".repeat(MAX_FEEDBACK_LENGTH + 50), reviewedAt);
  assert.equal(result.submissions[0].feedback.length, MAX_FEEDBACK_LENGTH);
});

test("dates read like Nov 14, 2026 and bad dates don't crash", () => {
  assert.equal(formatVideoDate(new Date(2026, 10, 14, 17, 20).toISOString()), "Nov 14, 2026");
  assert.equal(formatVideoDate("not a date"), "Unknown date");
});
