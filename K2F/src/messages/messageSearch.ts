import type { MockMessage } from "./mockMessageCoachClient";

export type TextSegment = { text: string; isMatch: boolean };

export type MessageSearchResult = {
  message: MockMessage;
  // Message text split into matched / unmatched parts, for highlighting.
  segments: TextSegment[];
};

// Searches only the messages it's given (the current conversation), matching the query
// case-insensitively against the message text. Returns new result objects, newest first,
// and never changes the messages passed in. An empty or blank query returns no results.
export function searchMessages(messages: readonly MockMessage[], query: string): MessageSearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return messages
    .filter((message) => message.message.toLowerCase().includes(needle))
    .map((message) => ({ message, segments: splitByMatch(message.message, needle) }))
    .sort((a, b) => new Date(b.message.createdAt).getTime() - new Date(a.message.createdAt).getTime());
}

// "Increase it a little", "increase" -> [{ "Increase", match }, { " it a little", no match }]
function splitByMatch(text: string, lowerNeedle: string): TextSegment[] {
  const lowerText = text.toLowerCase();
  const segments: TextSegment[] = [];
  let start = 0;
  let index = lowerText.indexOf(lowerNeedle);

  while (index !== -1) {
    if (index > start) segments.push({ text: text.slice(start, index), isMatch: false });
    segments.push({ text: text.slice(index, index + lowerNeedle.length), isMatch: true });
    start = index + lowerNeedle.length;
    index = lowerText.indexOf(lowerNeedle, start);
  }
  if (start < text.length) segments.push({ text: text.slice(start), isMatch: false });
  return segments;
}
