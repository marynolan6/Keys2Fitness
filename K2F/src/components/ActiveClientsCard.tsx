import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ClientAvatar } from "@/components/ClientAvatar";
import type { ClientsLoadStatus } from "@/clients/clientStore";
import type { CoachClient } from "@/clients/mockClients";
import { colors, radii, spacing, typography } from "@/theme";

type ActiveClientsCardProps = {
  loadStatus: ClientsLoadStatus;
  count: number;
  clients: readonly CoachClient[];
  onRetry: () => void;
  onOpenClient: (clientId: string) => void;
};

export function ActiveClientsCard({
  loadStatus,
  count,
  clients,
  onRetry,
  onOpenClient,
}: ActiveClientsCardProps) {
  const [showClients, setShowClients] = useState(false);

  if (loadStatus === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primaryDark} />
        <Text style={styles.subtitle}>Loading active clients…</Text>
      </View>
    );
  }

  if (loadStatus === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Current Clients</Text>
        <Text style={styles.subtitle}>Could not load clients.</Text>

        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const clientLabel = count === 1 ? "active client" : "active clients";

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open active client list"
        onPress={() => setShowClients(true)}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>👥</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        </View>

        <Text style={styles.title}>Active Clients</Text>

        <Text style={styles.subtitle}>
          {count} {clientLabel}
        </Text>

        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Modal
        visible={showClients}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClients(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Clients</Text>

              <Pressable onPress={() => setShowClients(false)}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.clientList}>
              {clients.length === 0 ? (
                <Text style={styles.subtitle}>
                  No active clients yet.
                </Text>
              ) : (
                clients.map((client) => (
                  <Pressable
                    key={client.id}
                    style={styles.clientRow}
                    onPress={() => {
                      setShowClients(false);
                      onOpenClient(client.id);
                    }}
                  >
                    <ClientAvatar name={client.name} size={40} />

                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>
                        {client.name}
                      </Text>
                      <Text style={styles.clientGoal}>
                        {client.goal}
                      </Text>
                    </View>

                    <Text style={styles.clientArrow}>›</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    justifyContent: "center",
    minHeight: 116,
    padding: spacing.md,
    position: "relative",
  },
  pressed: {
    opacity: 0.8,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 28,
    height: 52,
    justifyContent: "center",
    position: "relative",
    width: 52,
  },
  icon: {
    fontSize: 23,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: -7,
    top: -7,
    width: 28,
  },
  badgeText: {
    color: colors.surface,
    fontSize: typography.label,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  arrow: {
    color: colors.primaryDark,
    fontSize: 28,
    position: "absolute",
    right: spacing.md,
    top: "50%",
    transform: [{ translateY: -14 }],
  },
  retryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  modalOverlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    maxHeight: "80%",
    padding: spacing.lg,
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  closeText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  clientList: {
    gap: spacing.sm,
  },
  clientRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  clientGoal: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  clientArrow: {
    color: colors.primaryDark,
    fontSize: 28,
  },
});