import { useSyncExternalStore } from "react";

import type { CheckIn } from "./checkIn";
import { mockCheckIns } from "./mockCheckIns";

// In-memory sample check-ins shared by the Profile history and the Progress chart, so an edit or
// delete shows on both. Resets when the app reloads.
// shortcut: sample data only, swap for the Firestore check-ins once the client screens use them.
let checkIns: readonly CheckIn[] = mockCheckIns;
const listeners = new Set<() => void>();

function setCheckIns(next: readonly CheckIn[]): void {
  checkIns = next;
  listeners.forEach((listener) => listener());
}

export function getCheckIns(): readonly CheckIn[] {
  return checkIns;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let nextId = 1;

export function addCheckIn(checkIn: Omit<CheckIn, "id">): void {
  setCheckIns([...checkIns, { ...checkIn, id: `added-${nextId++}` }]);
}

export function updateCheckIn(updated: CheckIn): void {
  if (!checkIns.some((checkIn) => checkIn.id === updated.id)) return;
  setCheckIns(checkIns.map((checkIn) => (checkIn.id === updated.id ? updated : checkIn)));
}

export function deleteCheckIn(id: string): void {
  if (!checkIns.some((checkIn) => checkIn.id === id)) return;
  setCheckIns(checkIns.filter((checkIn) => checkIn.id !== id));
}

export function useCheckIns(): readonly CheckIn[] {
  return useSyncExternalStore(subscribe, getCheckIns, getCheckIns);
}
