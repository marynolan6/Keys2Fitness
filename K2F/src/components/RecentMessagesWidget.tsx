import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { recentMessages } from "@/messages/mockMessages";
import { colors, radii, spacing, typography } from "@/theme";

export function RecentMessagesWidget() {
    const router = useRouter();
    const visibleMessages = [...recentMessages]
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
        .slice(0, 2);

    return (
        <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>

            {visibleMessages.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() =>
                        router.push({
                            pathname: "/client/messages",
                            params: { messageId: item.id },
                        })
                    }
                    style={[
                        styles.messageCard,
                        item.unread && styles.unreadMessageCard,
                    ]}
                >
                    <View style={styles.messageHeader}>
                        <Text style={styles.coachName}>{item.sender}</Text>

                        {item.unread && (
                            <Text style={styles.unreadLabel}>NEW</Text>
                        )}

                    </View>

                    <Text style={styles.messageText}>{item.message}</Text>
                    <Text style={styles.messageTime}>{item.time}</Text>
                </Pressable>
            ))}

            {recentMessages.length > 2 && (
                <Pressable
                    style={styles.viewMoreButton}
                    onPress={() => router.push("/client/messages")}
                >
                    <Text style={styles.viewMoreText}>View more messages</Text>
                </Pressable>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    messagesSection: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: typography.heading,
        fontWeight: "700",
        marginBottom: spacing.md,
    },
    messageCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.card,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    messageHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    coachName: {
        color: colors.primaryDark,
        fontSize: typography.body,
        fontWeight: "700",
    },
    messageText: {
        color: colors.text,
        fontSize: typography.body,
        marginTop: spacing.xs,
    },
    messageTime: {
        color: colors.textMuted,
        fontSize: typography.label,
        marginTop: spacing.sm,
    },
    unreadMessageCard: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    unreadLabel: {
        color: colors.primaryDark,
        fontSize: typography.label,
        fontWeight: "700",
    },
    viewMoreButton: {
        alignItems: "center",
        padding: spacing.sm,
    },
    viewMoreText: {
        color: colors.primaryDark,
        fontSize: typography.body,
        fontWeight: "700",
    },
});