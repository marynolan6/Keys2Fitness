import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachClients } from "@/clients/clientStore";
import { ThemedBackground } from "@/components/ThemedBackground";
import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { WorkoutCoachNoteCard } from "@/components/WorkoutCoachNoteCard";
import { ExerciseRecommendationEditor } from "@/components/ExerciseRecommendationEditor";
import { getCoachTip } from "@/workouts/coachTips";
import { getWorkoutCoachNote } from "@/workouts/coachNote";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { spacing } from "@/theme";

export default function ClientWorkouts() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  return <ClientWorkoutsContent key={clientId} clientId={clientId} />;
}

function ClientWorkoutsContent({ clientId }: { clientId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clients = useCoachClients();
  const client = clients.find((item) => item.id === clientId);
  const state = useWorkoutLibraryState();
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ clientId: string; assignmentId: string; exerciseId: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const assignments = state.data.assignments.filter((assignment) => assignment.clientId === clientId);

  return <ThemedBackground><ScrollView style={styles.screen} contentContainerStyle={[styles.content,
    { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
    <BuilderButton label="Back to client profile" secondary onPress={() => router.replace({ pathname: "/coach-client/[clientId]", params: { clientId } })} />
    <Text style={styles.brand}>KEYS2FITNESS / COACH</Text>
    <Text style={styles.title}>{client ? `Workouts for ${client.name}` : "Client unavailable"}</Text>
    <Text style={styles.muted}>Local prototype · assigned workout copies and coach notes on this device.</Text>
    {client && <>
      <View style={styles.actions}>
        <BuilderButton label="Build workout for client" onPress={() => router.push({ pathname: "/coach/workouts/editor", params: { clientId } })} />
        <BuilderButton label="Choose from workout library" secondary onPress={() => router.push({ pathname: "/coach/workouts", params: { clientId } })} />
      </View>
      {state.status === "loading" ? <Text style={styles.muted}>Loading assigned workouts…</Text> : state.status === "error" ? <>
        <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
        <BuilderButton label="Retry assigned workouts" onPress={() => { void workoutLibrary.load(); }} />
      </> : assignments.length === 0 ? <View style={styles.card}>
        <Text style={styles.heading}>No built workouts assigned yet</Text>
        <Text style={styles.muted}>Build a plan or assign a reusable template to this client.</Text>
      </View> : assignments.map((assignment, index) => {
        const note = getWorkoutCoachNote(assignment.workout);
        return <View key={assignment.id} style={styles.card}>
          <Text style={styles.muted}>{index === 0 ? "Latest assignment" : "Earlier assignment"}</Text>
          <Text style={styles.feedback}>Assigned to {client.name} · {new Date(assignment.assignedAt).toLocaleString()}</Text>
          <Text style={styles.heading}>{assignment.workout.title}</Text>
          <Text style={styles.muted}>{assignment.workout.exercises.length} exercises{assignment.workout.durationMinutes ? ` · ${assignment.workout.durationMinutes} min` : ""}</Text>
          {assignment.workout.exercises.map((exercise) => <View key={exercise.id} style={styles.field}>
            <Text style={styles.label}>{exercise.name}: {exercise.sets} × {exercise.reps} · {exercise.weight || "No weight prescribed"}</Text>
            {exercise.restSeconds !== undefined && <Text style={styles.muted}>Rest: {exercise.restSeconds} seconds</Text>}
            <Text style={styles.muted}>Recommendation for {client.name}: {getCoachTip(state.data, clientId, exercise) ?? "None"}</Text>
            <BuilderButton label={`Edit recommendation for ${exercise.name}`} secondary
              onPress={() => { setFeedback(""); setEditing({ clientId, assignmentId: assignment.id, exerciseId: exercise.id }); }} />
          </View>)}
          {note && <WorkoutCoachNoteCard note={note} sessionLabel={assignment.workout.title} collapsible />}
          <BuilderButton label={`Preview ${assignment.workout.title} as ${client.name}`} secondary disabled={previewing}
            onPress={() => {
              setPreviewing(true); setError("");
              workoutLibrary.setPreviewClient(clientId).then(() => router.push({ pathname: "/client/home/workout/[workoutId]", params: { workoutId: assignment.id } }))
                .catch(() => setError("The workout preview could not be opened. Try again."))
                .finally(() => setPreviewing(false));
            }} />
        </View>;
      })}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {feedback && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
    </>}
  </ScrollView>
    {client && editing?.clientId === clientId && <ExerciseRecommendationEditor
      key={`${clientId}:${editing.assignmentId}:${editing.exerciseId}`} {...editing} clientName={client.name}
      onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setFeedback(`Recommendation saved for ${client.name}.`); }} />}
  </ThemedBackground>;
}
