
import { useRouter } from "expo-router";
import {
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// K2F-236: Client data shared with the client list
import { reloadCoachClients, useCoachClientsState } from "@/clients/clientStore";
import { getActiveClients, getClientById } from "@/clients/mockClients";
import { ClientAvatar } from "@/components/ClientAvatar";

// Coach messages widget
import { NewCoachMessagesWidget } from "@/components/RecentMessageWidgetCoach";
import { ThemedBackground } from "@/components/ThemedBackground";
import { mockMessages } from "@/messages/mockMessageCoachClient";

// Shared Keys2Fitness theme
import { colors, layout, radii, spacing, typography } from "@/theme";

// Max items shown in each dashboard section
const MAX_SUMMARY_CLIENTS = 3;
const MAX_RECENT_ACTIVITY = 3;

// K2F-235: Recent activity (client messages for now, newest first)
const recentActivity = mockMessages
  .filter((message) => 
      message.clientId === "1" &&
      message.senderType === "coach",
  )
  .sort(
   (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )
  .slice(0, MAX_RECENT_ACTIVITY);

// Formats the date and time for each activity item
function formatActivityTime(createdAt: string): string {
  const date = new Date(createdAt);

  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day} · ${time}`;
}

// Coach Dashboard screen
export default function CoachHome() {
  const router = useRouter();

  // K2F-53: One source for every "active" number and list on the dashboard; re-renders when a client's status changes.
  const { loadStatus, clients } = useCoachClientsState();
  const activeClients = getActiveClients(clients);
  const summaryClients = activeClients.slice(0, MAX_SUMMARY_CLIENTS);

  // K2F-237: Open client details from the dashboard
  const openClientProfile = (clientId: string) =>
    router.push({ pathname: "/coach-client/[clientId]", params: { clientId } });

  const openConversation = (clientId: string) =>
    router.push({
      pathname: "/coach-client/[clientId]/conversation",
      params: { clientId },
    });

  return (
    // Keep the gradient background from main
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Dashboard heading */}
        <Text style={styles.title}>Coach Dashboard</Text>

        {/* K2F-235 / K2F-236: Current clients summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Current Clients
            </Text>
            <Text style={styles.demoLabel}>Demo data</Text>
          </View>

          {loadStatus === "loading" ? (
            <Text style={styles.emptyText}>Loading clients…</Text>
          ) : loadStatus === "error" ? (
            // No count or "no clients" message while the data is unavailable
            <>
              <Text style={styles.emptyText}>
                Clients couldn&apos;t be loaded right now.
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Retry loading clients"
                onPress={reloadCoachClients}
                style={({ pressed }) => [styles.linkButton, pressed && styles.rowPressed]}>
                <Text style={styles.linkText}>Try again</Text>
              </Pressable>
            </>
          ) : activeClients.length === 0 ? (
            // Shown when there are no active clients
            <Text style={styles.emptyText}>
              No active clients yet. Clients assigned to you will appear here.
            </Text>
          ) : (
            <>
              <Text style={styles.sectionMeta}>
                {activeClients.length} active{" "}
                {activeClients.length === 1 ? "client" : "clients"}
              </Text>

              {summaryClients.map((client) => (
                <Pressable
                  key={client.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${client.name}, ${client.goal}. Open client profile`}
                  onPress={() => openClientProfile(client.id)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <ClientAvatar name={client.name} size={40} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{client.name}</Text>
                    <Text style={styles.rowSubtitle}>{client.goal}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all clients"
                onPress={() => router.push("/coach/client_list")}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.linkText}>See all clients →</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* K2F-235: Recent activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Recent Activity
            </Text>
            <Text style={styles.demoLabel}>Demo data</Text>
          </View>

          {recentActivity.length === 0 ? (
            <Text style={styles.emptyText}>No recent client activity.</Text>
          ) : (
            recentActivity.map((item, index) => {
              const clientName =
                getClientById(item.clientId)?.name ?? item.clientName;
              const isLatest = index === 0;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${isLatest ? "Latest: " : ""}${clientName} sent a message: ${item.message}. Open conversation`}
                  onPress={() => openConversation(item.clientId)}
                  style={({ pressed }) => [
                    styles.row,
                    isLatest && styles.latestRow,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <ClientAvatar name={clientName} size={40} />
                  <View style={styles.rowText}>
                    {/* Label the most recent item */}
                    {isLatest && <Text style={styles.latestBadge}>Latest</Text>}
                    <Text style={styles.rowTitle}>
                      {clientName} sent a message
                    </Text>
                    <Text style={styles.rowSubtitle} numberOfLines={2}>
                       {`"${item.message}"`}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {formatActivityTime(item.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Display recent coach messages */}
        <NewCoachMessagesWidget
          messages={mockMessages}
          onPress={() => router.push("/coach/messages")}
        />

        {/* K2F-264: View recent client check-ins */}
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => {
            // Open the recent client check-ins screen
            router.push("/coach-checkins");
          }}
        >
          <Text style={styles.checkInButtonText}>
            View Recent Check-ins →
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </ThemedBackground>
  );
}

// Styles for the Coach Dashboard
const styles = StyleSheet.create({
  // Dashboard spacing
  container: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Coach Dashboard title.
  // On Expo Web, leave room for the navigation tabs
  // so they don't overlap the heading.
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",

    // Add extra spacing only on web.
    // Native mobile layouts keep their original spacing.
    marginTop: Platform.OS === "web" ? 48 : 0,
  },

  // K2F-235: Card for each dashboard section
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },

  // Section title and demo label
  sectionHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  sectionMeta: {
    color: colors.textMuted,
    fontSize: typography.label,
  },

  demoLabel: {
    color: colors.primaryDark,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.label,
    fontWeight: "700",
    overflow: "hidden",
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  // Client and activity rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: layout.minTouchTarget,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Highlights the most recent activity
  latestRow: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceMuted,
  },

  // Feedback when a row is pressed
  rowPressed: {
    opacity: 0.7,
  },

  rowText: {
    flex: 1,
    gap: spacing.xs,
  },

  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  rowSubtitle: {
    color: colors.textMuted,
    fontSize: typography.label,
  },

  rowMeta: {
    color: colors.textMuted,
    fontSize: typography.label,
  },

  latestBadge: {
    alignSelf: "flex-start",
    color: colors.surface,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.label,
    fontWeight: "700",
    overflow: "hidden",
  },

  chevron: {
    color: colors.primaryDark,
    fontSize: typography.heading,
  },

  linkButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.button,
  },

  linkText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },

  // K2F-264: Check-in navigation button
  checkInButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },

  // Text inside the check-in button
  checkInButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
