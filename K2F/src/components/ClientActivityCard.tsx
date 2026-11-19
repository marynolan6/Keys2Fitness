import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";

import { ClientAvatar } from "@/components/ClientAvatar";
import type { WorkoutActivity } from "@/hooks/useRecentClientActivity";
import { colors, radii, spacing, typography } from "@/theme";

type ClientActivityCardProps = {
  activities: WorkoutActivity[];
  allActivities: WorkoutActivity[];
  status: "loading" | "ready" | "error";
  onOpenClient: (clientId: string) => void;
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ClientActivityCard({
  activities,
  allActivities,
  status,
  onOpenClient,
}: ClientActivityCardProps) {
  const [showAll, setShowAll] = useState(false);

  const summaryText =
    status === "loading"
      ? "Loading client activity…"
      : status === "error"
        ? "Client activity could not be loaded."
        : activities.length === 0
          ? "No completed workouts yet."
          : `${activities.length} recent ${
              activities.length === 1 ? "activity" : "activities"
            }`;

  return (
    <View style={styles.card}>
      <View style={styles.activityIcon}>
        <Text style={styles.activityIconText}>📊</Text>
      </View>

      <Text style={styles.title}>Client Activity</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View recent activity"
        onPress={() => setShowAll(true)}
        style={styles.arrowButton}
      >
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Text style={styles.muted}>{summaryText}</Text>

      <Modal
        visible={showAll}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAll(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Client Activity
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowAll(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {status === "loading" ? (
                <Text style={styles.modalEmptyText}>
                  Loading activity...
                </Text>
              ) : status === "error" ? (
                <Text style={styles.modalEmptyText}>
                  Client activity could not be loaded.
                </Text>
              ) : allActivities.length === 0 ? (
                <Text style={styles.modalEmptyText}>
                  No recent activity yet.
                </Text>
              ) : (
                allActivities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    onPress={() => {
                      setShowAll(false);
                      onOpenClient(activity.clientId);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ClientAvatar
                      name={activity.clientName}
                      size={40}
                    />

                    <View style={styles.info}>
                      <Text style={styles.clientName}>
                        {activity.clientName}
                      </Text>

                      <Text style={styles.workoutName}>
                        {activity.workoutName}{" "}
                        {activity.workoutStatus === "ended-early"
                          ? "ended early"
                          : "completed"}
                      </Text>
                    </View>

                    <Text style={styles.time}>
                      {formatTime(activity.completedAt)}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 116,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },

  activityIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.surfaceMuted,
  },

  activityIconText: {
    fontSize: 26,
  },

  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },

  muted: {
    color: colors.textMuted,
    fontSize: typography.label,
    textAlign: "center",
  },

  arrowButton: {
    position: "absolute",
    right: spacing.md,
    top: "50%",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -22 }],
  },

  arrow: {
    color: colors.primaryDark,
    fontSize: 28,
  },

  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },

  modalCard: {
    width: "100%",
    maxHeight: "80%",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  modalTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  closeText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },

  modalList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },

  modalEmptyText: {
    padding: spacing.lg,
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center",
  },

  row: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  pressed: {
    opacity: 0.7,
  },

  info: {
    flex: 1,
  },

  clientName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  workoutName: {
    color: colors.textMuted,
    fontSize: typography.label,
  },

  time: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "600",
  },
});