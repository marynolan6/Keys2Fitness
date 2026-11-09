import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { ClientsLoadStatus } from "@/clients/clientStore";
import { colors, layout, radii, spacing, typography } from "@/theme";

type ActiveClientsCardProps = {
  loadStatus: ClientsLoadStatus;
  // Only meaningful when `loadStatus` is "ready".
  count: number;
  onRetry: () => void;
  onOpenClientList: () => void;
};

// K2F-53: Coach dashboard card showing how many active clients the coach has.
// A number is only shown once the client data has loaded, so it is never a guess.
export function ActiveClientsCard({ loadStatus, count, onRetry, onOpenClientList }: ActiveClientsCardProps) {
  return (
    <View style={styles.card}>
      {loadStatus === "loading" ? (
        <View
          style={styles.statusRow}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Loading active client count"
        >
          <ActivityIndicator color={colors.primaryDark} />
          <View style={styles.statusText}>
            <Text style={styles.label}>Active clients</Text>
            <Text style={styles.helperText}>Loading active clients…</Text>
          </View>
        </View>
      ) : loadStatus === "error" ? (
        <View accessible accessibilityRole="alert" accessibilityLabel="Active client count unavailable. Try again.">
          {/* A dash, not 0, so a failed load never looks like "no clients". */}
          <Text style={[styles.count, styles.countUnavailable]}>—</Text>
          <Text style={styles.label}>Active clients</Text>
          <Text style={styles.helperText}>
            We couldn&apos;t load your client count. Check your connection and try again.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ReadyCount count={count} />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onOpenClientList}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Open Client List</Text>
      </Pressable>
    </View>
  );
}

function ReadyCount({ count }: { count: number }) {
  const hasClients = count > 0;
  const label = count === 1 ? "Active client" : "Active clients";

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={hasClients ? `${count} ${label.toLowerCase()}` : "No active clients yet"}
    >
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
      {!hasClients && (
        <Text style={styles.helperText}>
          No active clients yet. Clients assigned to you will be counted here.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.md,
    padding: spacing.lg,
  },
  count: {
    color: colors.text,
    fontSize: typography.title,
    fontVariant: ["tabular-nums"],
    fontWeight: "300",
  },
  countUnavailable: {
    color: colors.textMuted,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "600",
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
  },
  statusText: {
    flex: 1,
  },
  retryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: layout.minTouchTarget + spacing.sm,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
