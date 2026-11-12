import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCoachClients } from "@/clients/clientStore";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { workoutHistoryTotals, type WorkoutHistoryEntry } from "@/workouts/workoutSessionModel";
import { formatWorkoutTime } from "@/workouts/workoutTimer";
import { colors, layout, radii, spacing, typography } from "@/theme";

export function WorkoutHistorySection() {
  const library = useWorkoutLibraryState();
  const clientId = library.data.previewClientId;
  const clients = useCoachClients();
  const clientName = clients.find((client) => client.id === clientId)?.name ?? "Selected client";
  const history = useWorkoutHistory(clientId);
  const totals = workoutHistoryTotals(history.entries);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<WorkoutHistoryEntry | null>(null);
  const insets = useSafeAreaInsets();
  const detail = selected?.clientId === clientId ? selected : null;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.heading}>Workout activity</Text>
    <Text style={styles.muted}>Demo client: {clientName} · saved on this device</Text>
    {library.status === "loading" || history.status === "loading" ? <Text style={styles.body}>Loading workout history…</Text>
      : library.status === "error" || history.status === "error" ? <>
        <Text accessibilityRole="alert" style={styles.body}>Workout history could not be loaded. Your saved records have not been changed.</Text>
        <Pressable accessibilityRole="button" onPress={() => {
          if (library.status === "error") void workoutLibrary.load();
          history.retry();
        }} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.link}>Retry workout history</Text>
        </Pressable>
      </> : <>
        <Text accessibilityLiveRegion="polite" style={styles.total}>{totals.completed} {totals.completed === 1 ? "workout" : "workouts"} completed</Text>
        <Text style={styles.body}>{formatWorkoutTime(totals.activeMs)} total active time in completed workouts</Text>
        {totals.endedEarly > 0 && <Text style={styles.muted}>{totals.endedEarly} ended early · excluded from completed totals</Text>}
        {!history.entries.length && <Text style={styles.body}>No finished workouts yet. Confirm a workout to record it here.</Text>}
        {(showAll ? history.entries : history.entries.slice(0, 3)).map((entry) => <Pressable key={entry.id}
          accessibilityRole="button" accessibilityLabel={`View ${entry.title}, ${entry.session.outcome === "completed" ? "completed" : "ended early"}`}
          onPress={() => setSelected(entry)} style={({ pressed }) => [styles.entry, pressed && styles.pressed]}>
          <Text style={styles.label}>{entry.title}</Text>
          <Text style={styles.link}>{entry.session.outcome === "completed" ? "Completed" : "Ended early"}</Text>
          <Text style={styles.muted}>{new Date(entry.session.finishedAt).toLocaleString()} · {formatWorkoutTime(entry.session.timer.elapsedMs)} active</Text>
          <Text style={styles.muted}>{entry.session.exercises.filter((exercise) => exercise.completed).length}/{entry.session.exercises.length} exercises complete · View recorded sets</Text>
        </Pressable>)}
        {history.entries.length > 3 && <Pressable accessibilityRole="button" onPress={() => setShowAll((current) => !current)}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.link}>{showAll ? "Show recent workouts" : "Show all workout history"}</Text>
        </Pressable>}
      </>}
    <Modal visible={detail !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View accessibilityViewIsModal style={styles.modal}>
          <Text style={styles.heading}>Recorded workout</Text>
          <ScrollView contentContainerStyle={styles.detail}>
            <Text style={styles.heading}>{detail?.title}</Text>
            <Text style={styles.body}>{detail?.session.outcome === "completed" ? "Completed" : "Ended early"}</Text>
            {detail && <Text style={styles.muted}>{new Date(detail.session.finishedAt).toLocaleString()} · {formatWorkoutTime(detail.session.timer.elapsedMs)} active</Text>}
            {detail?.session.exercises.map((exercise) => <View key={exercise.id} style={styles.entry}>
              <Text style={styles.label}>{exercise.name}</Text>
              <Text style={styles.muted}>Target: {exercise.sets} × {exercise.reps} · {exercise.weight || "Bodyweight"}</Text>
              {exercise.restSeconds !== undefined && <Text style={styles.muted}>Prescribed rest: {exercise.restSeconds} seconds</Text>}
              <Text style={styles.body}>{exercise.completed ? "Completed" : "Not complete"}</Text>
              {exercise.actualSets?.map((set, index) => <Text key={set.id} style={styles.body}>
                Set {index + 1}: {set.actualReps || "—"} reps · {set.actualWeightLb || "—"} lb · {set.completed ? "Confirmed" : "Unconfirmed"}
              </Text>)}
            </View>)}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={() => setSelected(null)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.link}>Close workout record</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  heading: { color: colors.text, fontSize: typography.heading, fontWeight: "600" },
  total: { color: colors.primaryDark, fontSize: typography.heading, fontWeight: "700" },
  body: { color: colors.text, fontSize: typography.body },
  muted: { color: colors.textMuted, fontSize: typography.caption },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  link: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "600" },
  entry: { backgroundColor: colors.surfaceMuted, borderRadius: radii.control, padding: spacing.md, gap: spacing.sm, minHeight: layout.minTouchTarget },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center", alignItems: "center", padding: spacing.sm },
  pressed: { opacity: 0.7 },
  overlay: { flex: 1, backgroundColor: colors.overlay, paddingHorizontal: spacing.md, justifyContent: "center", alignItems: "center" },
  modal: { maxHeight: "100%", width: "100%", maxWidth: layout.maxContentWidth, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.md },
  detail: { gap: spacing.md },
});
