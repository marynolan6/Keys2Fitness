import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { coachCheckIns } from "@/checkins/coachCheckIns";
import { reloadCoachClients, useCoachClientsState } from "@/clients/clientStore";
import { getActiveClients } from "@/clients/mockClients";
import { CoachDashboardGrid } from "@/components/CoachDashboardGrid";
import { CoachDashboardPanel, type CoachPanel } from "@/components/CoachDashboardPanel";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { K2FBrand } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ActionButton } from "@/components/ActionButton";
import { useRecentClientActivity } from "@/hooks/useRecentClientActivity";
import { auth } from "@/lib/firebase";
import { isUnreadFor, mockMessages } from "@/messages/mockMessageCoachClient";
import { colors, isCompactLayout, layout, radii, spacing, textStyles } from "@/theme";
import { formatVideoDate } from "@/videoReviews/videoReview";
import { useVideoReviewQueue } from "@/videoReviews/videoReviewStore";

const count = (value: number, singular: string) => `${value} ${singular}${value === 1 ? "" : "s"}`;

export default function CoachHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= layout.twoColumnWidth && !isCompactLayout(width, fontScale);
  const [panel, setPanel] = useState<CoachPanel | null>(null);
  const [name, setName] = useState("Coach");
  useEffect(() => onAuthStateChanged(auth, (user) => setName(user?.displayName?.trim().split(/\s+/)[0] || "Coach")), []);

  const { loadStatus, clients } = useCoachClientsState();
  const activeClients = getActiveClients(clients);
  const { pending } = useVideoReviewQueue();
  const oldest = pending[0];
  const messages = mockMessages.filter((m) => m.senderType === "client" && isUnreadFor(m, "coach"))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const { status, activities } = useRecentClientActivity(clients);
  const activitySummary = status === "loading" ? "Loading client activity…" : status === "error" ? "Client activity could not be loaded." :
    activities.length ? `${count(activities.length, "workout")} in the last 7 days` : "No workouts in the last 7 days.";
  const latest = coachCheckIns[0];

  return <ThemedBackground variant="home">
    <ScrollView contentContainerStyle={[styles.content, wide && styles.wideContent, { paddingTop: insets.top + spacing.md }]}>
      <K2FBrand coach />
      <DashboardGreeting name={name} />
      <View style={[styles.workspace, wide && styles.columns]}>
      <View style={[styles.workspace, wide && styles.column]}>
      <View style={styles.inbox}>
        <Text style={textStyles.eyebrow}>FORM CHECK INBOX</Text>
        <Text accessibilityRole="header" style={textStyles.page}>{oldest ? count(pending.length, "pending video") : "All caught up"}</Text>
        <Text style={textStyles.body}>{oldest ? `${oldest.clientName} · ${oldest.exerciseName}` : "There are no form checks waiting for feedback."}</Text>
        {oldest && <><Text style={textStyles.meta}>Oldest submission · {formatVideoDate(oldest.submittedAt)}</Text>
          <ActionButton label="Review oldest video" onPress={() => router.push({ pathname: "/coach-videos/[videoId]", params: { videoId: oldest.id } })} />
        </>}
      </View>
      <Text accessibilityRole="header" style={styles.heading}>Coach Dashboard</Text>
      <CoachDashboardGrid tiles={[
        { id: "videos", title: "Video reviews", summary: "Open full queue",
          action: "View videos to review", onPress: () => router.push("/coach-videos") },
        { id: "messages", title: "Recent Messages", summary: count(messages.length, "unread message"),
          action: "View recent messages", onPress: () => setPanel("messages") },
        { id: "clients", title: "Active Clients", summary: loadStatus === "loading" ? "Loading clients…" : loadStatus === "error" ? "Could not load clients. Tap to retry." : count(activeClients.length, "active client"),
          loading: loadStatus === "loading",
          action: loadStatus === "error" ? "Retry clients" : "Open active client list", onPress: loadStatus === "error" ? reloadCoachClients : () => setPanel("clients") },
        { id: "activity", title: "Client Activity", summary: activitySummary, action: "View recent activity", onPress: () => setPanel("activity") },
      ]} />
      </View>
      <View style={[styles.workspace, wide && styles.column]}>
      <View style={styles.checkIn}>
        <Text accessibilityRole="header" style={styles.heading}>Latest check-in</Text>
        {latest ? <>
          <Text style={styles.meta}>Demo check-in · {latest.date}</Text>
          <Text style={styles.name}>{latest.clientName}</Text>
          {latest.workoutsCompleted != null && latest.workoutsScheduled != null &&
            <Text style={styles.body}>{latest.workoutsCompleted} of {latest.workoutsScheduled} scheduled workouts completed</Text>}
          {latest.notes ? <Text style={styles.body}>{latest.notes}</Text> : null}
        </> : <Text style={styles.body}>No client check-ins yet.</Text>}
        <ActionButton label="View Recent Check-ins →" secondary onPress={() => router.push("/coach-checkins")} />
      </View>
      <ActionButton label="Open workout library" secondary onPress={() => router.push("/coach/workouts")} />
      </View>
      </View>
    </ScrollView>
    {panel && <CoachDashboardPanel panel={panel} clients={activeClients} messages={messages} activities={activities}
      activitySummary={activitySummary} onClose={() => setPanel(null)}
      onClient={(clientId) => router.push({ pathname: "/coach-client/[clientId]", params: { clientId } })} />}
  </ThemedBackground>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  workspace: { gap: spacing.md },
  wideContent: { maxWidth: layout.workspaceWidth },
  columns: { flexDirection: "row", alignItems: "flex-start", gap: spacing.lg },
  column: { flex: 1, minWidth: 0 },
  inbox: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: spacing.xs, borderLeftColor: colors.primaryDark },
  heading: textStyles.section,
  checkIn: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  name: textStyles.label,
  body: textStyles.body,
  meta: textStyles.meta,
});
