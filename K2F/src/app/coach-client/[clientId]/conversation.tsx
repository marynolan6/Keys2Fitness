import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";
import { colors, radii, spacing, typography } from "@/theme";

import { ClientAvatar } from "@/components/ClientAvatar";

export default function CoachConversation() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  const oneHour = 30 * 60 * 1000;

  const orderedMessages = coachMessages
    .filter((message) => message.clientId === clientId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    );

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back to Messages</Text>
        </Pressable>

        <View style={styles.profileHeader}>
          <ClientAvatar
            name={orderedMessages[0]?.clientName ?? "Client"}
          />

          <Text style={styles.title}>
            {orderedMessages[0]?.clientName ?? "Conversation"}
          </Text>
        </View>

        {orderedMessages.map((item, index) => {
          const previousMessage = orderedMessages[index - 1];

          const showTimestamp =
            !previousMessage ||
            new Date(item.createdAt).getTime() -
            new Date(previousMessage.createdAt).getTime() >
            oneHour;

          const showNewMessages =
            item.unread && !previousMessage?.unread;

          return (
            <View key={item.id}>
              {showNewMessages && (
                <View style={styles.newMessagesRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.newMessagesText}>
                    New messages
                  </Text>
                  <View style={styles.dividerLine} />
                </View>
              )}

              {showTimestamp && (
                <Text style={styles.timestamp}>{item.time}</Text>
              )}

              <View
                style={[
                  styles.messageBubble,
                  item.fromCoach && styles.coachBubble,
                ]}
              >
                <Text
                  style={[
                    styles.message,
                    item.fromCoach && styles.coachMessage,
                  ]}
                >
                  {item.message}
                </Text>
              </View>
            </View>
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

  timestamp: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textAlign: "center",
  },
  messageBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    marginBottom: spacing.md,
    maxWidth: "85%",
    padding: spacing.md,
  },
  coachBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  message: {
    color: colors.text,
    fontSize: typography.body,
  },
  coachMessage: {
    color: colors.surface,
  },
  newMessagesRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  dividerLine: {
    backgroundColor: colors.textMuted,
    flex: 1,
    height: 1,
  },
  newMessagesText: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: typography.title,
    fontWeight: "700",
  },
});