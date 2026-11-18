import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCoachClients } from "@/clients/clientStore";
import { WorkoutHistoryDetails } from "@/components/WorkoutHistoryDetails";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { workoutHistoryTotals, type WorkoutHistoryEntry } from "@/workouts/workoutSessionModel";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

const RECENT_LIMIT = 3;
const rowDate = new Intl.DateTimeFormat(undefined, {
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
});

function HistoryRow({ entry, onPress }: { entry: WorkoutHistoryEntry; onPress: () => void }) {
  const title = entry.title.trim() || "Untitled workout";
  const status = entry.session.outcome === "completed" ? "Completed" : "Ended early";
  const date = new Date(entry.session.finishedAt);
  const validDate = Number.isFinite(date.getTime());
  const dateLabel = validDate ? rowDate.format(date) : "Date unavailable";
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${title}, ${status.toLowerCase()}, ${validDate ? date.toLocaleString() : dateLabel}`}
    accessibilityHint="Opens the recorded sets for this workout" onPress={onPress}
    style={({ pressed }) => [styles.entry, pressed && styles.pressed]}>
    <View style={styles.entryText}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.muted}>{dateLabel} · {status}</Text>
    </View>
    <Text accessible={false} style={styles.chevron}>›</Text>
  </Pressable>;
}

export function WorkoutHistorySection() {
  const library = useWorkoutLibraryState();
  const clientId = library.data.previewClientId;
  const clients = useCoachClients();
  const clientName = clients.find((client) => client.id === clientId)?.name ?? "Selected client";
  // Do not query the default/previous client's history before library restoration.
  const history = useWorkoutHistory(library.status === "ready" ? clientId : null);
  const totals = workoutHistoryTotals(history.entries);
  const minutes = Math.floor(totals.activeMs / 60_000);
  const hasMore = history.visibleEntries.length > RECENT_LIMIT;
  const shown = history.expanded ? history.visibleEntries : history.visibleEntries.slice(0, RECENT_LIMIT);
  const includeEarly = history.filter === "all";
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

  return <View style={[styles.card, !compact && styles.roomy]}>
    <View style={styles.content} importantForAccessibility={history.detailOpen ? "no-hide-descendants" : "auto"}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>Workout history</Text>
        {library.status === "ready" && <Text style={styles.context}
          accessibilityLabel={`Demo client: ${clientName}. Saved on this device.`}>Demo · {clientName}</Text>}
      </View>
      {feedback ?? (history.entries.length === 0 ? (
        <Text accessibilityLiveRegion="polite" style={styles.muted}>Finish a workout to see it here.</Text>
      ) : <>
        <Text accessibilityLiveRegion="polite" style={styles.muted}>{totals.completed > 0
          ? `${totals.completed} completed${totals.activeMs > 0 ? ` · ${minutes || "<1"} min active` : ""}`
          : "No completed workouts yet."}</Text>
        {shown.length > 0 && <View>{shown.map((entry) => <HistoryRow key={JSON.stringify([entry.session.workoutId, entry.id])}
          entry={entry} onPress={() => history.dispatch({ type: "select", key: { workoutId: entry.session.workoutId, sessionId: entry.id } })} />)}</View>}
        {(totals.endedEarly > 0 || hasMore) && <View style={styles.actions}>
          {hasMore && <Pressable accessibilityRole="button" accessibilityState={{ expanded: history.expanded }}
            onPress={() => history.dispatch({ type: "toggle-expanded" })} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.link}>{history.expanded ? "Show recent" : `Show all ${history.visibleEntries.length} workouts`}</Text>
          </Pressable>}
          {totals.endedEarly > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: includeEarly }}
            onPress={() => history.dispatch({ type: "filter", filter: includeEarly ? "completed" : "all" })}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.link}>{includeEarly ? "Hide" : "Show"} early finishes ({totals.endedEarly})</Text>
          </Pressable>}
        </View>}
      </>)}
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
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: spacing.sm, rowGap: spacing.xs },
  heading: { color: colors.text, fontSize: typography.heading, fontWeight: "500", flexShrink: 1 },
  context: { color: colors.textMuted, fontSize: typography.caption, flexShrink: 1 },
  body: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
  muted: { color: colors.textMuted, fontSize: typography.label },
  label: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  link: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "600", textAlign: "center" },
  entry: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: layout.minTouchTarget,
    paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  entryText: { flex: 1, minWidth: 0, gap: spacing.xs },
  chevron: { color: colors.primaryDark, fontSize: typography.heading },
  actions: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.sm, justifyContent: "space-between" },
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, maxWidth: "100%", justifyContent: "center", alignItems: "center", padding: spacing.sm, borderRadius: radii.button },
  pressed: { backgroundColor: colors.surfaceMuted },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center" },
  modal: { flex: 1, width: "100%", maxWidth: layout.maxContentWidth, padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.md },
  roomy: { padding: spacing.lg },
  scroll: { flex: 1 },
  detail: { paddingBottom: spacing.sm },
});
