import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

import { makeWorkoutId } from "./exerciseCatalog";
import { getWorkoutById } from "./mockWorkout";
import { createWorkoutLibraryRepository } from "./workoutLibraryRepository";
import { createWorkoutLibraryService } from "./workoutLibraryService";
import { getCoachClientsState } from "../clients/clientStore";
import { auth } from "../lib/firebase";
import type { WorkoutLibraryData, WorkoutTemplate } from "./workoutLibraryModel";

const templates: WorkoutTemplate[] = ["today", "lower-body-next", "mobility-recovery"].flatMap((id) => {
  const workout = getWorkoutById(id);
  return workout ? [{ id: `template-${id}`, title: workout.title, durationMinutes: workout.durationMinutes,
    notes: workout.notes ?? "", updatedAt: "2026-11-06T00:00:00.000Z", exercises: workout.exercises.map((exercise) => ({
      id: exercise.id, name: exercise.name, sets: exercise.sets, reps: exercise.reps,
      weightLb: Number(exercise.weight.match(/\d+(?:\.\d+)?/)?.[0] ?? 0),
      // K2F-108: start blank so the shared mock note isn't copied to every client
      instructions: exercise.instructions ?? "", coachNotes: "",
    })) }] : [];
});

const initialData: WorkoutLibraryData = { templates, assignments: [], previewClientId: "1" };
export const workoutLibraryRepository = createWorkoutLibraryRepository(AsyncStorage, initialData);
export const workoutLibraryService = createWorkoutLibraryService(workoutLibraryRepository, {
  makeId: makeWorkoutId, now: () => new Date().toISOString(), getAuthorName: () => auth.currentUser?.displayName ?? "Coach",
  clients: { async listClientIds() {
    const state = getCoachClientsState();
    if (state.loadStatus !== "ready") throw new Error("Clients are not available right now. Please try again.");
    return state.clients.map((client) => client.id);
  } },
});
// Composition facade: views observe the adapter and invoke application use cases.
export const workoutLibrary = {
  getState: workoutLibraryRepository.getState, subscribe: workoutLibraryRepository.subscribe,
  load: workoutLibraryRepository.load, ...workoutLibraryService,
};

export function useWorkoutLibraryState() {
  const state = useSyncExternalStore(workoutLibrary.subscribe, workoutLibrary.getState, workoutLibrary.getState);
  useEffect(() => { void workoutLibrary.load(); }, []);
  return state;
}
