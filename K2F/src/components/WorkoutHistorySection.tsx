import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCoachClients } from "@/clients/clientStore";
import { WorkoutHistoryDetails } from "@/components/WorkoutHistoryDetails";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { workoutHistoryTotals } from "@/workouts/workoutSessionModel";
import { formatWorkoutTime } from "@/workouts/workoutTimer";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

export function WorkoutHistorySection() {
  const library = useWorkoutLibraryState();
  const clientId = library.data.previewClientId;
  const clients = useCoachClients();
  const clientName = clients.find((client) => client.id === clientId)?.name ?? "Selected client";
  // Do not query the default/previous client's history before library restoration.
  const history = useWorkoutHistory(library.status === "ready" ? clientId : null);
  const totals = workoutHistoryTotals(history.entries);
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const loading = library.status === "loading" || history.status === "loading" || history.status === "idle";
  const failed = library.status === "error" || history.status === "error";
  const retry = () => {
    if (library.status === "error") void workoutLibrary.load();
    else history.retry();
  };
  const feedback = failed ? <>
    <Text accessibilityRole="alert" style={styles.body}>Workout history could not be loaded. Your saved records have not been changed.</Text>
    <Pressable accessibilityRole="button" onPress={retry} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.link}>Retry workout history</Text>
    </Pressable>
  </> : loading ? <Text accessibilityLiveRegion="polite" style={styles.body}>Loading workout history…</Text> : null;

  return <View style={styles.card}>
    <View style={styles.content} importantForAccessibility={history.detailOpen ? "no-hide-descendants" : "auto"}>
      <Text accessibilityRole="header" style={styles.heading}>Workout history</Text>
      <Text style={styles.muted}>Demo client: {clientName} · saved on this device</Text>
      {feedback ?? <>
        <Text accessibilityLiveRegion="polite" style={styles.total}>{totals.completed} {totals.completed === 1 ? "workout" : "workouts"} completed</Text>
        <Text style={styles.body}>{formatWorkoutTime(totals.activeMs)} total active time in completed workouts</Text>
        {totals.endedEarly > 0 && <Text style={styles.muted}>{totals.endedEarly} ended early · excluded from completed totals</Text>}
        <View style={[styles.filters, compact && styles.stacked]}>
          {(["completed", "all"] as const).map((filter) => <Pressable key={filter} accessibilityRole="button"
            accessibilityState={{ selected: history.filter === filter }}
            onPress={() => history.dispatch({ type: "filter", filter })}
            style={({ pressed }) => [styles.filter, history.filter === filter && styles.selected, pressed && styles.pressed]}>
            <Text style={styles.link}>{filter === "completed" ? "Completed workouts" : "All finished workouts"}</Text>
          </Pressable>)}
        </View>
        {!history.visibleEntries.length && <Text style={styles.body}>{history.filter === "completed"
          ? "No completed workouts yet. Confirm a completed workout to record it here."
          : "No finished workouts yet. Completed and ended-early workouts will appear here."}</Text>}
        {(history.expanded ? history.visibleEntries : history.visibleEntries.slice(0, 3)).map((entry) => <Pressable
          key={JSON.stringify([entry.session.workoutId, entry.id])} accessibilityRole="button"
          accessibilityLabel={`View ${entry.title}, ${entry.session.outcome === "completed" ? "completed" : "ended early"}, ${new Date(entry.session.finishedAt).toLocaleString()}`}
          onPress={() => history.dispatch({ type: "select", key: { workoutId: entry.session.workoutId, sessionId: entry.id } })}
          style={({ pressed }) => [styles.entry, pressed && styles.pressed]}>
          <Text style={styles.label}>{entry.title.trim() || "Untitled workout"}</Text>
          <Text style={styles.link}>{entry.session.outcome === "completed" ? "Completed" : "Ended early"}</Text>
          <Text style={styles.muted}>{new Date(entry.session.finishedAt).toLocaleString()} · {formatWorkoutTime(entry.session.timer.elapsedMs)} active</Text>
          <Text style={styles.muted}>{entry.session.exercises.filter((exercise) => exercise.completed).length}/{entry.session.exercises.length} exercises complete · View recorded sets</Text>
        </Pressable>)}
        {history.visibleEntries.length > 3 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: history.expanded }}
          onPress={() => history.dispatch({ type: "toggle-expanded" })} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.link}>{history.expanded ? "Show recent workouts" : "Show all workout history"}</Text>
        </Pressable>}
      </>}
    </View>
    <Modal visible={history.detailOpen} transparent animationType="slide" onRequestClose={() => history.dispatch({ type: "back" })}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md,
        paddingLeft: insets.left + spacing.md, paddingRight: insets.right + spacing.md }]}>
        <View accessibilityViewIsModal style={[styles.modal, !compact && styles.roomy]}>
          <Text accessibilityRole="header" style={styles.heading}>Recorded workout</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.detail}>
            {feedback ?? (history.detail ? <WorkoutHistoryDetails entry={history.detail} />
              : <Text style={styles.body}>This workout record is unavailable for the selected client. Return to workout history and choose another record.</Text>)}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={() => history.dispatch({ type: "back" })}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.link}>Back to workout history</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.md },
  content: { gap: spacing.sm },
  heading: { color: colors.text, fontSize: typography.heading, fontWeight: "600" },
  total: { color: colors.primaryDark, fontSize: typography.heading, fontWeight: "700" },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
  muted: { color: colors.textMuted, fontSize: typography.label },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  link: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "600", textAlign: "center" },
  entry: { backgroundColor: colors.surfaceMuted, borderRadius: radii.control, padding: spacing.md, gap: spacing.sm, minHeight: layout.minTouchTarget },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center", alignItems: "center", padding: spacing.sm, borderRadius: radii.button },
  filters: { flexDirection: "row", gap: spacing.sm },
  stacked: { flexDirection: "column" },
  filter: { flex: 1, minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, padding: spacing.sm,
    justifyContent: "center", alignItems: "center", borderRadius: radii.button, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  selected: { backgroundColor: colors.surfaceMuted },
  pressed: { backgroundColor: colors.border },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center" },
  modal: { flex: 1, width: "100%", maxWidth: layout.maxContentWidth, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.md },
  roomy: { padding: spacing.lg },
  scroll: { flex: 1 },
  detail: { paddingBottom: spacing.sm },
});
