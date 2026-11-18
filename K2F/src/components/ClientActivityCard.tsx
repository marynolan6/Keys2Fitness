import { Pressable, StyleSheet, Text, View } from "react-native";

import { ClientAvatar } from "@/components/ClientAvatar";
import { colors, radii, spacing, typography } from "@/theme";
import type { WorkoutActivity } from "@/hooks/useRecentClientActivity";

type ClientActivityCardProps = {
  activities: WorkoutActivity[];
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
  status,
  onOpenClient,
}: ClientActivityCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Activity</Text>
        <Text style={styles.today}>Today</Text>
      </View>

      {status === "loading" ? (
        <Text style={styles.muted}>Loading client activity…</Text>
      ) : status === "error" ? (
        <Text style={styles.muted}>
          Client activity could not be loaded.
        </Text>
      ) : activities.length === 0 ? (
        <Text style={styles.muted}>No completed workouts yet.</Text>
      ) : (
        activities.map((activity) => (
          <Pressable
            key={activity.id}
            onPress={() => onOpenClient(activity.clientId)}
            style={({ pressed }) => [
              styles.row,
              pressed && styles.pressed,
            ]}
          >
            <ClientAvatar name={activity.clientName} size={40} />

            <View style={styles.info}>
              <Text style={styles.clientName}>
                {activity.clientName}
              </Text>
              <Text style={styles.workoutName}>
                {activity.workoutName} complete
              </Text>
            </View>

            <Text style={styles.time}>
              {formatTime(activity.completedAt)}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  today: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
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
  muted: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
});