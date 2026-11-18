import { Modal, Pressable, ScrollView, StyleSheet, Text, View, } from "react-native";
import { useState } from "react";
import { ClientAvatar } from "@/components/ClientAvatar";
import { colors, radii, spacing, typography } from "@/theme";
import type { WorkoutActivity } from "@/hooks/useRecentClientActivity";

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
                <>
                    {activities.map((activity) => (
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
                    ))}
                    {allActivities.length > activities.length && (
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setShowAll(true)}
                            style={styles.viewAllButton}
                        >
                            <Text style={styles.viewAllText}>View all activity</Text>
                        </Pressable>
                    )}
                </>
            )}

            <Modal
                visible={showAll}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAll(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>All Client Activity</Text>

                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setShowAll(false)}
                            >
                                <Text style={styles.closeText}>Close</Text>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalList}>
                            {allActivities.map((activity) => (
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
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    viewAllButton: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderRadius: radii.button,
        minHeight: 44,
        justifyContent: "center",
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
    },

    viewAllText: {
        color: colors.primaryDark,
        fontSize: typography.label,
        fontWeight: "700",
    },
    modalOverlay: {
        alignItems: "center",
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
        width: "100%",
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

    modalList: {
        gap: spacing.sm,
        paddingBottom: spacing.sm,
    },
});