import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { conversationMessages } from "@/messages/mockMessages";
import { colors, spacing, typography } from "@/theme";

export default function Messages() {
  const router = useRouter();
  const orderedMessages = [...conversationMessages].sort(
  (a, b) =>
    new Date(a.createdAt).getTime() -
    new Date(b.createdAt).getTime(),
);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Conversation</Text>

      {orderedMessages.map((item, index) => (
        <View key={item.id}>
          {item.unread && !conversationMessages[index - 1]?.unread && (
            <View style={styles.newMessagesRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.newMessagesText}>New messages</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              item.fromClient && styles.clientBubble,
            ]}
          >
            <Text
              style={[
                styles.sender,
                item.fromClient && styles.clientText,
              ]}
            >
              {item.sender}
            </Text>

            <Text
              style={[
                styles.message,
                item.fromClient && styles.clientText,
              ]}
            >
              {item.message}
            </Text>

            <Text
              style={[
                styles.time,
                item.fromClient && styles.clientText,
              ]}
            >
              {item.time}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
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

  messageBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    maxWidth: "85%",
    padding: spacing.md,
  },

  clientBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },

  sender: {
    color: colors.primaryDark,
    fontWeight: "700",
  },

  message: {
    color: colors.text,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },

  time: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.sm,
  },

  clientText: {
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
});