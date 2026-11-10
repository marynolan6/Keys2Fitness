import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";

import { makeWorkoutId } from "./exerciseCatalog";
import { getWorkoutById } from "./mockWorkout";
import { createWorkoutLibraryRepository } from "./workoutLibraryRepository";
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

const initialData: WorkoutLibraryData = { version: 1, templates, assignments: [], previewClientId: "1" };
export const workoutLibrary = createWorkoutLibraryRepository(AsyncStorage, initialData, makeWorkoutId);

export function useWorkoutLibraryState() {
  const state = useSyncExternalStore(workoutLibrary.subscribe, workoutLibrary.getState, workoutLibrary.getState);
  useEffect(() => { void workoutLibrary.load(); }, []);
  return state;
}
