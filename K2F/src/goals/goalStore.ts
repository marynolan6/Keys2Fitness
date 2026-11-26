import { useSyncExternalStore } from "react";

import type { FitnessGoal } from "./goal";
import { mockCurrentGoal } from "./mockGoal";

// In-memory sample goals shared by Progress (managing them) and Home (the first one is the
// current goal card). Resets when the app reloads.
// shortcut: sample data only, swap for the Firestore goals once the client screens use them.
let goals: readonly FitnessGoal[] = mockCurrentGoal ? [mockCurrentGoal] : [];
const listeners = new Set<() => void>();
let nextId = 1;

function setGoals(next: readonly FitnessGoal[]): void {
  goals = next;
  listeners.forEach((listener) => listener());
}

export function getGoals(): readonly FitnessGoal[] {
  return goals;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function newGoalId(): string {
  return `added-goal-${nextId++}`;
}

export function addGoal(goal: FitnessGoal): void {
  setGoals([...goals, goal]);
}

export function updateGoal(updated: FitnessGoal): void {
  if (!goals.some((goal) => goal.id === updated.id)) return;
  setGoals(goals.map((goal) => (goal.id === updated.id ? updated : goal)));
}

export function deleteGoal(id: string): void {
  if (!goals.some((goal) => goal.id === id)) return;
  setGoals(goals.filter((goal) => goal.id !== id));
}

export function useGoals(): readonly FitnessGoal[] {
  return useSyncExternalStore(subscribe, getGoals, getGoals);
}
