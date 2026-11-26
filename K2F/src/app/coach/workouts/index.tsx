import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachClientsState } from "@/clients/clientStore";
import { ThemedBackground } from "@/components/ThemedBackground";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { WorkoutAssignmentConfirmation } from "@/components/WorkoutAssignmentConfirmation";
import { useWorkoutAssignment } from "@/hooks/useWorkoutAssignment";
import { BuilderButton, BuilderField, ClientAssignmentPicker, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { WorkoutLibraryItemLink, WorkoutLibraryLoadStatus } from "@/components/WorkoutLibraryControls";
import { isCompactLayout, spacing } from "@/theme";
import { countLabel } from "@/workouts/workoutLabels";
import { searchWorkoutLibrary, type WorkoutLibraryItemKind } from "@/workouts/workoutLibraryBrowse";
import { workoutTemplateSummary, type WorkoutTemplate } from "@/workouts/workoutLibraryModel";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";

type LibraryFilter = "all" | WorkoutLibraryItemKind;

export default function WorkoutLibraryScreen() {
  const { clientId, saved } = useLocalSearchParams<{ clientId?: string; saved?: string }>();
  // Tabs retain their screens. A different client entry starts a fresh selection/review.
  return <WorkoutLibraryContent key={clientId || "library"} clientId={clientId || undefined} saved={saved} />;
}

function WorkoutLibraryContent({ clientId, saved }: { clientId?: string; saved?: string }) {
  const router = useRouter();
  const state = useWorkoutLibraryState();
  const { clients, loadStatus } = useCoachClientsState();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>(clientId ? "template" : "all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>(clientId ? [clientId] : []);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutTemplate | null>(null);
  const [working, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const assignment = useWorkoutAssignment();
  const review = assignment.state.status === "review" || assignment.state.status === "saving" ? assignment.state : null;
  const busy = working || review !== null;
  const assigned = assignment.state.status === "saved" ? assignment.state : null;
  const { templates, assignments } = state.data;
  const clientNames = new Map(clients.map((client) => [client.id, client.name]));
  const matching = searchWorkoutLibrary(state.data, search, clientNames);
  const showTemplates = filter !== "workout";
  const visibleTemplates = showTemplates ? matching.templates : [];
  const visibleWorkouts = filter !== "template" ? matching.workouts : [];
  const total = templates.length + assignments.length;
  const filters: { value: LibraryFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: total },
    { value: "template", label: "Templates", count: templates.length },
    { value: "workout", label: "Assigned workouts", count: assignments.length },
  ];
  const filterCount = filters.find(({ value }) => value === filter)?.count ?? 0;
  const previewTarget = assigned?.assignments[0]?.clientId ?? (assignments.some((item) => item.clientId === clientId) ? clientId : null);
  const assignmentFeedback = assigned ? `Assigned ${assigned.review.template.title} to ${assigned.review.clients.map((client) => client.name).join(", ")}.` : "";

  function openDetails(kind: WorkoutLibraryItemKind, itemId: string) {
    router.push({ pathname: "/coach/workouts/details/[kind]/[itemId]", params: { kind, itemId, ...(clientId ? { clientId } : {}) } });
  }

  async function act(operation: () => Promise<void>) {
    setBusy(true); setError(""); setFeedback("");
    try { await operation(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Your changes could not be saved. Try again."); }
    finally { setBusy(false); }
  }

  return <ThemedBackground><ScrollView style={styles.screen} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
    <K2FBrand coach />
    <PageTitle>Workout Library</PageTitle>
    <View style={styles.field}>
      <Text style={styles.muted}>Templates and assigned workouts on this device.</Text>
      {state.status === "ready" && <>
        <BuilderButton label="Create workout" onPress={() => router.push({ pathname: "/coach/workouts/editor", params: { clientId: clientId ?? "" } })} disabled={busy} />
        {total > 0 && <>
          <BuilderField label="Search workouts and templates" value={search} onChange={setSearch} disabled={busy} />
          <View style={[styles.actions, compact && styles.stacked]}>
            {filters.map(({ value, label, count }) => <BuilderButton key={value} label={`${label} (${count})`}
              selected={filter === value} disabled={busy} onPress={() => setFilter(value)} />)}
          </View>
        </>}
        {(feedback || assignmentFeedback || saved) && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback || assignmentFeedback || "Workout saved on this device."}</Text>}
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {previewTarget && <BuilderButton label="Preview assigned client workout" secondary disabled={busy}
          onPress={() => { void act(async () => { await workoutLibrary.setPreviewClient(previewTarget); router.push("/client/home"); }); }} />}
      </>}
    </View>
    {state.status !== "ready" ? <WorkoutLibraryLoadStatus state={state} retry={() => { void workoutLibrary.load(); }} /> : <>
      {total === 0 ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Your library is empty</Text>
        <Text style={styles.muted}>Create a workout to save a reusable template or assign it to a client.</Text>
      </View> : filterCount === 0 ? <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>{filter === "template" ? "No reusable templates yet" : "No assigned workouts yet"}</Text>
        <Text style={styles.muted}>{filter === "template" ? "Create a workout and save it as a reusable template." : "Build a workout for a client or assign a reusable template."}</Text>
      </View> : visibleTemplates.length + visibleWorkouts.length === 0 && <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>No matching library items</Text>
        <Text style={styles.muted}>Try another workout name, exercise, or client name.</Text>
        <BuilderButton label="Clear search" secondary onPress={() => setSearch("")} />
      </View>}
      {visibleTemplates.map((template) => <View key={template.id} style={styles.card}>
        <WorkoutLibraryItemLink kind="template" title={template.title} summary={workoutTemplateSummary(template)} disabled={busy}
          onPress={() => openDetails("template", template.id)} />
        <BuilderButton label={selectedId === template.id ? "Hide actions" : "Assign or manage"}
          accessibilityLabel={selectedId === template.id ? `Hide actions for ${template.title}` : `Assign or manage ${template.title}`}
          expanded={selectedId === template.id} secondary disabled={busy} onPress={() => setSelectedId(selectedId === template.id ? null : template.id)} />
        {selectedId === template.id && <>
        <Text accessibilityRole="header" style={styles.heading}>Assign to clients</Text>
        <ClientAssignmentPicker clients={clients} loadStatus={loadStatus} selected={selectedClients} onChange={setSelectedClients} disabled={busy} />
        <BuilderButton label={`Assign workout · ${selectedClients.length} selected`} disabled={busy || !selectedClients.length || loadStatus !== "ready"}
          onPress={() => { setFeedback(""); setError(""); assignment.review({ template,
            clients: selectedClients.map((id) => ({ id, name: clientNames.get(id) ?? "Unavailable client" })) }); }} />
        {[...new Set(assignments.filter((item) => item.templateId === template.id).map((item) => item.clientId))].map((id) =>
          <View key={id} style={styles.field}>
            <Text style={styles.feedback}>Assigned to {clientNames.get(id) ?? "Unavailable client"}</Text>
            {clientNames.has(id) && <BuilderButton label={`View assignments for ${clientNames.get(id)}`} secondary disabled={busy}
              onPress={() => router.push({ pathname: "/coach-client/[clientId]/workouts", params: { clientId: id } })} />}
          </View>)}
        <View style={[styles.actions, compact && styles.stacked]}>
          <BuilderButton label="Duplicate" accessibilityLabel={`Duplicate ${template.title}`} secondary disabled={busy} onPress={() => {
            void act(async () => { setSelectedId(await workoutLibrary.duplicateTemplate(template.id)); setFeedback("Template duplicated."); });
          }} />
          <BuilderButton label="Edit" accessibilityLabel={`Edit ${template.title}`} secondary disabled={busy}
            onPress={() => router.push({ pathname: "/coach/workouts/editor", params: { templateId: template.id, clientId: clientId ?? "" } })} />
          <BuilderButton label="Delete" accessibilityLabel={`Delete ${template.title}`} secondary disabled={busy} onPress={() => setDeleteTarget(template)} />
        </View>
        </>}
      </View>)}
      {visibleWorkouts.map(({ assignment: item, workout }) => <WorkoutLibraryItemLink key={item.id}
        kind="workout" title={workout.title} summary={countLabel(workout.exercises.length, "exercise")} disabled={busy}
        metadata={`Assigned to ${clientNames.get(item.clientId) ?? "Unavailable client"} · ${new Date(item.assignedAt).toLocaleString()}`}
        onPress={() => openDetails("workout", item.id)} />)}
    </>}
  </ScrollView>
  {review && <WorkoutAssignmentConfirmation title={review.review.template.title} summary={workoutTemplateSummary(review.review.template)}
    clients={review.review.clients} saving={review.status === "saving"} error={review.error}
    onConfirm={() => { void assignment.confirm(); }} onCancel={assignment.cancel} />}
  <Modal transparent visible={deleteTarget !== null} animationType="fade" onRequestClose={() => { if (!busy) setDeleteTarget(null); }}>
    <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View accessibilityViewIsModal style={styles.modal}>
        <Text style={styles.heading}>Delete Workout Template?</Text>
        <ScrollView contentContainerStyle={styles.field}>
        <Text style={styles.label}>{deleteTarget?.title}</Text>
        <Text style={styles.muted}>This removes the reusable template from your library. Workouts already assigned to clients stay available.</Text>
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </ScrollView>
        <BuilderButton label={busy ? "Deleting…" : "Delete template"} danger disabled={busy} onPress={() => {
          if (deleteTarget) void act(async () => { await workoutLibrary.deleteTemplate(deleteTarget.id); setDeleteTarget(null); setFeedback("Template deleted."); });
        }} />
        <BuilderButton label="Cancel deletion" secondary disabled={busy} onPress={() => setDeleteTarget(null)} />
      </View>
    </View>
  </Modal>
  </ThemedBackground>;
}
