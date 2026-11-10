import type { ClientWorkoutAssignment, WorkoutLibraryData, WorkoutTemplate } from "./workoutLibraryModel";
import type { WorkoutSession } from "./workoutSessionModel";

export type SaveWorkoutPlan = {
  template?: WorkoutTemplate;
  assignments: ClientWorkoutAssignment[];
  // Checked atomically with the write, so a deleted source cannot be resurrected.
  existingTemplateId?: string;
};

// Application ports describe domain operations, never JSON keys or AsyncStorage.
// A remote implementation must preserve atomic plan/assignment commits and snapshots.
export interface WorkoutLibraryRepository {
  listTemplates(): Promise<readonly WorkoutTemplate[]>;
  findTemplate(id: string): Promise<WorkoutTemplate | null>;
  listAssignments(clientId?: string): Promise<readonly ClientWorkoutAssignment[]>;
  findAssignment(id: string): Promise<ClientWorkoutAssignment | null>;
  getPreviewClientId(): Promise<string>;
  saveWorkoutPlan(plan: SaveWorkoutPlan): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  setPreviewClient(clientId: string): Promise<void>;
}

export type WorkoutLibraryState =
  | { status: "loading"; data: WorkoutLibraryData; error: "" }
  | { status: "ready"; data: WorkoutLibraryData; error: "" }
  | { status: "error"; data: WorkoutLibraryData; error: string };

// The local adapter additionally exposes a reactive read model for React's external-store hook.
export interface ObservableWorkoutLibraryRepository extends WorkoutLibraryRepository {
  load(): Promise<void>;
  getState(): WorkoutLibraryState;
  subscribe(listener: () => void): () => void;
}

export interface WorkoutSessionRepository {
  saveWorkoutSession(session: WorkoutSession): Promise<void>;
  loadWorkoutSession(workoutId: string): Promise<WorkoutSession | null>;
  loadActiveWorkoutSession(isAvailable?: (id: string) => boolean): Promise<WorkoutSession | null>;
  clearWorkoutSession(workoutId: string): Promise<void>;
}

export interface WorkoutClientDirectory {
  listClientIds(): Promise<readonly string[]>;
}
