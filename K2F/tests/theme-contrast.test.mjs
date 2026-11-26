import test from "node:test";
import assert from "node:assert/strict";
import { actionColors, colors, gradients } from "../src/theme.ts";

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
    .map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}

test("action labels remain legible on both their resting and pressed colors", () => {
  for (const [role, { ink, fill, pressed }] of Object.entries(actionColors)) {
    for (const surface of [fill, pressed]) assert.ok(contrast(ink, surface) >= 4.5, `${role}: ${ink} on ${surface}`);
  }
});
test("supporting text remains legible across the home and working gradients", () => {
  for (const fill of [...gradients.home.colors, ...gradients.screen.colors]) assert.ok(contrast(colors.textMuted, fill) >= 4.5, fill);
  assert.ok(contrast(colors.controlBorder, colors.surface) >= 3);
});
