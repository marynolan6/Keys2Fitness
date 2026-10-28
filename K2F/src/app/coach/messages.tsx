import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ClientAvatar } from "@/components/ClientAvatar";
import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";
import { colors, radii, spacing, typography } from "@/theme";

export default function CoachMessages() {
  const router = useRouter();

  const conversations = Object.values(
    coachMessages.reduce<Record<string, typeof coachMessages>>(
      (groups, message) => {
        if (!groups[message.clientId]) {
          groups[message.clientId] = [];
        }

        groups[message.clientId].push(message);
        return groups;
      },
      {},
    ),
  ).map((messages) =>
    messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    ),
  );

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.replace("/coach")}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Messages</Text>

        {conversations.map((messages) => {
          const firstMessage = messages[0];
          const latestMessage = messages[messages.length - 1];

          const unreadCount = messages.filter(
            (message) => message.unread,
          ).length;

          return (
            <Pressable
              key={firstMessage.clientId}
              style={styles.messageCard}
              onPress={() =>
                router.push({
                  pathname: "/coach-client/[clientId]/conversation",
                  params: {
                    clientId: firstMessage.clientId,
                  },
                })
              }
            >
              <View style={styles.header}>
                <View style={styles.clientInfo}>
                  <ClientAvatar name={firstMessage.clientName} />

                  <Text style={styles.clientName}>
                    {firstMessage.clientName}
                  </Text>
                </View>

                <Text style={styles.time}>{latestMessage.time}</Text>
              </View>

              <Text style={styles.message}>
                {latestMessage.message}
              </Text>

              {unreadCount > 0 && (
                <Text style={styles.unread}>
                  {unreadCount} new{" "}
                  {unreadCount === 1 ? "message" : "messages"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  backButton: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clientInfo: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  clientName: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  time: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  message: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  unread: {
    color: colors.primary,
    fontSize: typography.label,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
});