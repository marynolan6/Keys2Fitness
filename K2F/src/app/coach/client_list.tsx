// defines the client list screen for the coach, allowing them to view and select clients.
// K2F-151: client list screen
// K2F-152: selectable client cards
// K2F-153: open the selected client's profile
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { demoClients } from "@/clients/mockClients";
import { getPendingVideos } from "@/videos/mockVideos";
import { ClientAvatar } from "@/components/ClientAvatar";
import { ThemedBackground } from "@/components/ThemedBackground";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radii, spacing, typography } from "@/theme";

export default function Client_List() {
  const insets = useSafeAreaInsets();
  const clientCount = demoClients.length;
  const pendingVideos = getPendingVideos();

  return (
    <ThemedBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        <K2FBrand coach />
        <PageTitle>My Clients</PageTitle>

        {/* Number of clients */}
        <View style={styles.metaRow}>
          <Text style={styles.count}>
            {clientCount} {clientCount === 1 ? "client" : "clients"}
          </Text>
          <Text style={styles.demoLabel}>Demo data</Text>
        </View>

        {clientCount === 0 ? (
          // Shown when there are no clients
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptyText}>
              Clients assigned to you will appear here.
            </Text>
          </View>
        ) : (
          demoClients.map((client) => {
            const hasPendingVideo = pendingVideos.some(
              (video) => video.clientId === client.id,
            );
            return (
              <Pressable
                key={client.id}
                accessibilityRole="button"
                accessibilityLabel={`${client.name}, ${client.goal}. Open client profile`}
                onPress={() =>
                  router.push({
                    pathname: "/coach-client/[clientId]",
                    params: { clientId: client.id },
                  })
                }
                style={({ pressed }) => [
                  styles.clientCard,
                  pressed && styles.clientCardPressed,
                ]}
              >
                <ClientAvatar name={client.name} />

                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientGoal}>{client.goal}</Text>
                </View>

                <View style={styles.clientActions}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {hasPendingVideo ? "Review video" : "On track"}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },


  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  count: {
    color: colors.textMuted,
    fontSize: typography.body,
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

  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: layout.minTouchTarget,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  // K2F-152: feedback when a card is pressed
  clientCardPressed: {
    opacity: 0.7,
    backgroundColor: colors.surfaceMuted,
  },

  // Lets long names wrap
  clientInfo: {
    flex: 1,
    gap: spacing.xs,
  },

  clientName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  clientGoal: {
    color: colors.textMuted,
    fontSize: typography.label,
  },

  chevron: {
    color: colors.primaryDark,
    fontSize: typography.heading,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: typography.label,
    textAlign: "center",
  },
  clientActions: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },

  statusBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  statusText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
});
