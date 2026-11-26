import assert from "node:assert/strict";
import test from "node:test";
import { registerSourceTypes } from "./helpers/source-types.mjs";

const hooks = registerSourceTypes();
const { buildCheckInRows } = await import("../src/checkins/checkIn.ts");
const { applyToSampleCheckIn, draftFromSampleCheckIn, localDateString, sampleCheckInFromValues, validateCheckIn } =
  await import("../src/checkins/checkInForm.ts");
const { addCheckIn, deleteCheckIn, getCheckIns, updateCheckIn } = await import("../src/checkins/checkInStore.ts");
hooks.deregister();

const newestFirst = () => buildCheckInRows(getCheckIns()).map((row) => row.checkIn.date);
const today = "2026-11-25";

test("sample check-ins are listed newest first", () => {
  const dates = newestFirst();
  assert.equal(dates.length, 6);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(dates[0], "2026-10-03");
});

test("editing a sample check-in shows its values in lb and inches and keeps its id and note", () => {
  const original = getCheckIns().find((checkIn) => checkIn.id === "c1");
  const draft = draftFromSampleCheckIn(original);
  assert.deepEqual(draft, { date: "2026-09-01", weight: "159.2", waistIn: "31.1", hipsIn: "38.6", armIn: "11.8" });

  const result = validateCheckIn({ ...draft, date: "2026-10-10", weight: "150", hipsIn: "" }, today);
  assert.equal(result.ok, true);
  updateCheckIn(applyToSampleCheckIn(original, result.values));

  const edited = getCheckIns().find((checkIn) => checkIn.id === "c1");
  assert.equal(edited.note, original.note);
  assert.equal(edited.date, "2026-10-10");
  assert.equal(draftFromSampleCheckIn(edited).weight, "150");
  assert.deepEqual(Object.keys(edited.measurements).sort(), ["armCm", "waistCm"]);
  assert.equal(newestFirst()[0], "2026-10-10"); // re-sorted after the date change
});

test("clearing every measurement removes them from the check-in", () => {
  const original = getCheckIns().find((checkIn) => checkIn.id === "c6");
  const values = { date: original.date, weightLb: 150, measurementsIn: {} };
  assert.equal("measurements" in applyToSampleCheckIn(original, values), false);
});

test("deleting a check-in removes only that one", () => {
  const before = getCheckIns();
  deleteCheckIn("c3");
  assert.deepEqual(getCheckIns().map((c) => c.id).sort(), before.map((c) => c.id).filter((id) => id !== "c3").sort());
  deleteCheckIn("missing");
  assert.equal(getCheckIns().length, before.length - 1);
});

test("an invalid edit never reaches the history", () => {
  const before = getCheckIns();
  const draft = draftFromSampleCheckIn(before[0]);
  assert.equal(validateCheckIn({ ...draft, weight: "-5" }, today).ok, false);
  assert.equal(getCheckIns(), before);
});

test("a submitted check-in is added to the history, newest first, and can then be edited and deleted", () => {
  const result = validateCheckIn({ date: "2026-11-20", weight: "149.5", waistIn: "29.5", hipsIn: "", armIn: "" }, today);
  assert.equal(result.ok, true);
  const before = getCheckIns().length;
  addCheckIn(sampleCheckInFromValues(result.values));

  assert.equal(getCheckIns().length, before + 1);
  const [latest] = buildCheckInRows(getCheckIns());
  assert.equal(latest.checkIn.date, "2026-11-20");
  assert.deepEqual(draftFromSampleCheckIn(latest.checkIn), {
    date: "2026-11-20", weight: "149.5", waistIn: "29.5", hipsIn: "", armIn: "",
  });

  updateCheckIn(applyToSampleCheckIn(latest.checkIn, { ...result.values, weightLb: 148 }));
  assert.equal(draftFromSampleCheckIn(getCheckIns().find((c) => c.id === latest.checkIn.id)).weight, "148");
  deleteCheckIn(latest.checkIn.id);
  assert.equal(getCheckIns().length, before);
});

test("the local date helper formats the device's calendar day", () => {
  assert.equal(localDateString(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});
