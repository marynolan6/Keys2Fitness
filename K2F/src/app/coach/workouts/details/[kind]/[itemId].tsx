import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachClientsState } from "@/clients/clientStore";
import { ExerciseRecommendationEditor } from "@/components/ExerciseRecommendationEditor";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { WorkoutLibraryLoadStatus } from "@/components/WorkoutLibraryControls";
import { spacing } from "@/theme";
import { getCoachTip } from "@/workouts/coachTips";
import { countLabel, prescriptionLabel } from "@/workouts/workoutLabels";
import { findWorkoutLibraryItem, libraryItemLabels, type WorkoutLibraryItem } from "@/workouts/workoutLibraryBrowse";
import { workoutTemplateSummary, type TemplateExercise } from "@/workouts/workoutLibraryModel";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";

export default function WorkoutLibraryDetailsScreen() {
  const { kind, itemId, clientId } = useLocalSearchParams<{ kind: string; itemId: string; clientId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useWorkoutLibraryState();
  const item = state.status === "ready" ? findWorkoutLibraryItem(state.data, kind, itemId) : null;

  return <ThemedBackground><ScrollView key={`${kind}:${itemId}`} style={styles.screen} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
    <K2FBrand coach />
    <BuilderButton label="Back to workout library" secondary
      onPress={() => router.dismissTo({ pathname: "/coach/workouts", params: clientId ? { clientId } : {} })} />
    {state.status !== "ready" ? <><PageTitle>Workout details</PageTitle>
      <WorkoutLibraryLoadStatus state={state} retry={() => { void workoutLibrary.load(); }} /></> :
      item ? <WorkoutLibraryDetails item={item} clientId={clientId} /> : <View style={styles.card}>
        <PageTitle style={styles.heading}>Library item unavailable</PageTitle>
        <Text style={styles.muted}>This workout or template could not be found on this device.</Text>
      </View>}
  </ScrollView></ThemedBackground>;
}

function WorkoutLibraryDetails({ item, clientId }: { item: WorkoutLibraryItem; clientId?: string }) {
  const router = useRouter();
  const { clients, loadStatus } = useCoachClientsState();
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const assignment = item.kind === "workout" ? item.assignment : null;
  const client = assignment && loadStatus === "ready" ? clients.find((entry) => entry.id === assignment.clientId) : undefined;
  const clientName = client?.name ?? (loadStatus === "loading" ? "Loading client…" : "Unavailable client");
  const plan = item.kind === "template" ? item.template : item.workout;

  return <>
    <View style={styles.card}>
      <Text style={styles.feedback}>{libraryItemLabels[item.kind]}</Text>
      <PageTitle style={styles.title}>{plan.title}</PageTitle>
      {assignment && <>
        <Text style={styles.label}>Assigned to {clientName}</Text>
        <Text style={styles.muted}>{new Date(assignment.assignedAt).toLocaleString()}</Text>
      </>}
      <Text style={styles.muted}>{item.kind === "template" ? workoutTemplateSummary(item.template) :
        [countLabel(plan.exercises.length, "exercise"), plan.durationMinutes ? `${plan.durationMinutes} min` : null].filter(Boolean).join(" · ")}</Text>
      {plan.notes?.trim() && <DetailText label="Workout note" text={plan.notes} />}
      {item.kind === "template" ? <BuilderButton label="Edit template" onPress={() => router.push({ pathname: "/coach/workouts/editor",
        params: { templateId: item.template.id, clientId: clientId ?? "" } })} /> : client &&
        <BuilderButton label={`View workouts for ${client.name}`} secondary onPress={() => router.push({ pathname: "/coach-client/[clientId]/workouts",
          params: { clientId: client.id } })} />}
    </View>
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>Exercises</Text>
      {feedback && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
      {plan.exercises.length === 0 && <Text style={styles.muted}>No exercises saved.</Text>}
      {item.kind === "template" ? item.template.exercises.map((exercise) => <ExerciseDetails key={exercise.id} exercise={exercise}
        weight={exercise.weightLb === undefined ? "" : exercise.weightLb === 0 ? "Bodyweight" : `${exercise.weightLb} lb`}>
        {exercise.coachNotes.trim() && <DetailText label="Default coach recommendation" text={exercise.coachNotes} />}
      </ExerciseDetails>) : item.workout.exercises.map((exercise) => {
        const recommendation = getCoachTip({ assignments: [item.assignment] }, item.assignment.clientId, exercise);
        return <ExerciseDetails key={exercise.id} exercise={exercise} weight={exercise.weight}>
          {recommendation && <DetailText label="Client recommendation" text={recommendation} />}
          {client && <BuilderButton label="Edit recommendation" accessibilityLabel={`Edit recommendation for ${exercise.name}`} secondary
            onPress={() => { setFeedback(""); setEditingExerciseId(exercise.id); }} />}
        </ExerciseDetails>;
      })}
    </View>
    {assignment && client && editingExerciseId && <ExerciseRecommendationEditor
      key={`${assignment.id}:${editingExerciseId}`} clientId={client.id} clientName={client.name} assignmentId={assignment.id} exerciseId={editingExerciseId}
      onClose={() => setEditingExerciseId(null)} onSaved={() => { setEditingExerciseId(null); setFeedback(`Recommendation saved for ${client.name}.`); }} />}
  </>;
}

function DetailText({ label, text }: { label: string; text: string }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.muted}>{text}</Text>
  </View>;
}

function ExerciseDetails({ exercise, weight, children }: {
  exercise: Pick<TemplateExercise, "name" | "sets" | "reps" | "restSeconds" | "alternative"> & { instructions?: string };
  weight: string; children?: ReactNode;
}) {
  return <View style={styles.catalogRow}>
    <Text accessibilityRole="header" style={styles.label}>{exercise.name}</Text>
    <Text style={styles.muted}>{prescriptionLabel({ ...exercise, weight })}</Text>
    {exercise.restSeconds !== undefined && <Text style={styles.muted}>Rest: {countLabel(exercise.restSeconds, "second")}</Text>}
    {exercise.instructions?.trim() && <DetailText label="Instructions" text={exercise.instructions} />}
    {exercise.alternative?.trim() && <DetailText label="Alternative exercise" text={exercise.alternative} />}
    {children}
  </View>;
}
