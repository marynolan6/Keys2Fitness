import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachClientsState } from "@/clients/clientStore";
import { ThemedBackground } from "@/components/ThemedBackground";
import { BuilderButton, BuilderField, ClientAssignmentPicker, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { isCompactLayout, spacing } from "@/theme";
import { workoutTemplateSummary, type WorkoutTemplate } from "@/workouts/workoutLibraryModel";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";

export default function WorkoutLibraryScreen() {
  const router = useRouter();
  const { clientId, saved } = useLocalSearchParams<{ clientId?: string; saved?: string }>();
  const state = useWorkoutLibraryState();
  const { clients, loadStatus } = useCoachClientsState();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>(clientId ? [clientId] : []);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [previewClientId, setPreviewClientId] = useState<string | null>(null);
  const templates = state.data.templates;
  const filtered = templates.filter((template) => `${template.title} ${template.exercises.map((exercise) => exercise.name).join(" ")}`
    .toLowerCase().includes(search.trim().toLowerCase()));
  const selected = filtered.find((template) => template.id === selectedId) ?? filtered[0];
  const previewTarget = previewClientId ?? (state.data.assignments.some((assignment) => assignment.clientId === clientId) ? clientId : null);

  async function act(operation: () => Promise<void>) {
    setBusy(true); setError(""); setFeedback("");
    try { await operation(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Your changes could not be saved. Try again."); }
    finally { setBusy(false); }
  }

  return <ThemedBackground><ScrollView style={styles.screen} keyboardShouldPersistTaps="handled"
    contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
    <Text style={styles.brand}>KEYS2FITNESS / COACH</Text>
    <Text style={styles.title}>Workout Template Library</Text>
    <Text style={styles.muted}>Local prototype · templates and client assignments are saved on this device.</Text>
    {state.status === "loading" ? <Text style={styles.muted}>Loading workout library…</Text> : state.status === "error" ?
      <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>
        <BuilderButton label="Retry workout library" onPress={() => { void workoutLibrary.load(); }} /></View> : <>
      <View style={[styles.actions, compact && styles.stacked]}>
        <Text style={styles.muted}>{templates.length} saved {templates.length === 1 ? "template" : "templates"}</Text>
        <BuilderButton label="Create workout" onPress={() => router.push({ pathname: "/coach/workouts/editor", params: { clientId: clientId ?? "" } })} disabled={busy} />
      </View>
      <BuilderField label="Search workout templates" value={search} onChange={setSearch} />
      {(feedback || saved) && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback || "Workout saved on this device."}</Text>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {previewTarget && <BuilderButton label="Preview assigned client workout" secondary disabled={busy}
        onPress={() => { void act(async () => { await workoutLibrary.setPreviewClient(previewTarget); router.push("/client/home"); }); }} />}
      {!filtered.length && <View style={styles.card}>
        <Text style={styles.heading}>{templates.length ? "No matching templates" : "Your library is empty"}</Text>
        <Text style={styles.muted}>{templates.length ? "Try another name or exercise." : "Create a workout to save your first reusable plan."}</Text>
      </View>}
      {filtered.map((template) => <View key={template.id} style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Select ${template.title}`}
          accessibilityState={{ selected: selected?.id === template.id }} disabled={busy} onPress={() => setSelectedId(template.id)}
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
          <View style={styles.row}><Text style={[styles.heading, styles.flex]}>{template.title}</Text>
            {selected?.id === template.id && <Text style={styles.feedback}>Selected</Text>}</View>
          <Text style={styles.muted}>{workoutTemplateSummary(template)}</Text>
          <Text style={styles.muted}>{template.exercises.map((exercise) => `${exercise.name} ${exercise.sets} × ${exercise.reps}`).join(" · ")}</Text>
        </Pressable>
        <View style={[styles.actions, compact && styles.stacked]}>
          <BuilderButton label="Duplicate" accessibilityLabel={`Duplicate ${template.title}`} secondary disabled={busy} onPress={() => {
            void act(async () => { setSelectedId(await workoutLibrary.duplicateTemplate(template.id)); setFeedback("Template duplicated."); });
          }} />
          <BuilderButton label="Edit" accessibilityLabel={`Edit ${template.title}`} secondary disabled={busy}
            onPress={() => router.push({ pathname: "/coach/workouts/editor", params: { templateId: template.id, clientId: clientId ?? "" } })} />
          <BuilderButton label="Delete" accessibilityLabel={`Delete ${template.title}`} secondary disabled={busy} onPress={() => setDeleteTarget(template)} />
        </View>
      </View>)}
      <View style={styles.card}>
        <Text style={styles.heading}>Assign to clients</Text>
        <Text style={styles.muted}>{selected ? `Selected: ${selected.title}` : "Create a template before assigning."}</Text>
        <ClientAssignmentPicker clients={clients} loadStatus={loadStatus} selected={selectedClients} onChange={setSelectedClients} disabled={busy} />
        <BuilderButton label={`Assign workout · ${selectedClients.length} selected`} disabled={busy || !selected || !selectedClients.length || loadStatus !== "ready"}
          onPress={() => { if (selected) void act(async () => {
            const assigned = await workoutLibrary.assignTemplate({ templateId: selected.id, clientIds: selectedClients });
            setFeedback(`Assigned ${selected.title} to ${assigned.length} ${assigned.length === 1 ? "client" : "clients"}.`);
            setPreviewClientId(assigned[0].clientId);
          }); }} />
        {feedback && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
        {previewTarget && <BuilderButton label="Open assigned workout in demo client view" secondary disabled={busy}
          onPress={() => { void act(async () => { await workoutLibrary.setPreviewClient(previewTarget); router.push("/client/home"); }); }} />}
      </View>
    </>}
  </ScrollView>
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
