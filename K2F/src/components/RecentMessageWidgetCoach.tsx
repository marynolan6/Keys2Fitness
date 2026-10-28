import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type CoachMessage = {
  id: string;
  clientName: string;
  message: string;
  unread: boolean;
};

type NewCoachMessagesWidgetProps = {
  messages: CoachMessage[];
};

export function NewCoachMessagesWidget({
  messages,
}: NewCoachMessagesWidgetProps) {
  const unreadMessages = messages.filter((message) => message.unread);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Messages</Text>

      {unreadMessages.length === 0 ? (
        <Text style={styles.emptyText}>No new messages</Text>
      ) : (
        <Text style={styles.countText}>
          {unreadMessages.length} new message
          {unreadMessages.length !== 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  countText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
});