import assert from "node:assert/strict";
import test from "node:test";
import { searchMessages } from "../src/messages/messageSearch.ts";

const msg = (id, text, createdAt) => ({
  id,
  clientId: "1",
  clientName: "Spencer",
  sender: "Coach Keys",
  message: text,
  createdAt,
  senderType: "coach",
});

test("blank or empty query returns no results", () => {
  const messages = [msg("a", "hello world", "2026-11-03T08:00:00")];
  assert.deepEqual(searchMessages(messages, ""), []);
  assert.deepEqual(searchMessages(messages, "   "), []);
});

test("search matches case-insensitively", () => {
  const messages = [msg("a", "Hello World", "2026-11-03T08:00:00")];
  const results = searchMessages(messages, "HELLO");
  assert.equal(results.length, 1);
  assert.equal(results[0].message.id, "a");
});

test("returns messages newest first", () => {
  const messages = [
    msg("old", "apple", "2026-11-01T08:00:00"),
    msg("new", "apple", "2026-11-05T08:00:00"),
    msg("mid", "apple", "2026-11-03T08:00:00"),
  ];
  const results = searchMessages(messages, "apple");
  assert.deepEqual(results.map((r) => r.message.id), ["new", "mid", "old"]);
});

test("does not mutate the original messages", () => {
  const original = { id: "a", message: "Apple pie", createdAt: "2026-11-03T08:00:00" };
  const messages = [msg("a", "Apple pie", "2026-11-03T08:00:00")];
  searchMessages(messages, "apple");
  assert.equal(messages[0].message, "Apple pie");
});

test("splits text into matched and unmatched segments", () => {
  const messages = [msg("a", "Increase it a little", "2026-11-03T08:00:00")];
  const results = searchMessages(messages, "increase");
  assert.deepEqual(results[0].segments, [
    { text: "Increase", isMatch: true },
    { text: " it a little", isMatch: false },
  ]);
});

test("handles multiple matches in one message", () => {
  const messages = [msg("a", "cat and cat", "2026-11-03T08:00:00")];
  const results = searchMessages(messages, "cat");
  assert.deepEqual(results[0].segments, [
    { text: "cat", isMatch: true },
    { text: " and ", isMatch: false },
    { text: "cat", isMatch: true },
  ]);
});

test("returns no results when nothing matches", () => {
  const messages = [msg("a", "hello world", "2026-11-03T08:00:00")];
  assert.deepEqual(searchMessages(messages, "zzz"), []);
});
