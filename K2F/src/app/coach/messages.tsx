// K2F-97: Coach-facing message list
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ClientAvatar } from "@/components/ClientAvatar";
import { PageTitle } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";

// K2F-97: Import all clients so the coach can see everyone,
// including clients who haven't sent messages yet.
import { demoClients } from "@/clients/mockClients";

// Existing mock messages used to display conversation previews.
import { coachMessages } from "@/messages/mockMessagesCoach";

import { colors, layout, radii, spacing, textStyles, typography } from "@/theme";

export default function CoachMessages() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // K2F-97: Build the conversation list from all clients,
  // instead of only clients who already have messages.
  const conversations = demoClients.map((client) => {

    // Find messages belonging to the current client.
    const messages = coachMessages
      .filter((message) => message.clientId === client.id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );

    // Get the most recent message for this client.
    const latestMessage = messages[messages.length - 1];

    // Count unread messages for this specific client.
    const unreadCount = messages.filter(
      (message) => message.unread && !message.fromCoach
    ).length;

    return {
      client,
      latestMessage,
      unreadCount,
    };
  });

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}>

        {/* Returns the coach to the dashboard. */}
        <Pressable accessibilityRole="button" accessibilityLabel="Back to coach home" style={({ pressed }) => [styles.back, pressed && styles.pressed]} onPress={() => router.replace("/coach")}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <PageTitle style={styles.title}>Messages</PageTitle>

        {/* K2F-98: Display every client in the list. */}
        {conversations.map(
          ({ client, latestMessage, unreadCount }) => (
            <Pressable
              key={client.id}
              accessibilityRole="button"
              accessibilityLabel={`Open conversation with ${client.name}`}
              style={({ pressed }) => [styles.messageCard, pressed && styles.pressed]}

              // K2F-282: Open the selected client's conversation.
              // Pass the client ID so the correct messages appear.
              onPress={() =>
                router.push({
                  pathname: "/coach-client/[clientId]/conversation",
                  params: {
                    clientId: client.id,
                  },
                })
              }
            >
              <View style={styles.header}>
                <View style={styles.clientInfo}>
                  <ClientAvatar name={client.name} />

                  <View style={styles.clientText}>
                    {/* Display the client's name. */}
                    <Text style={styles.clientName}>
                      {client.name}
                    </Text>

                    {/* Display profile information from mockClients. */}
                    <Text style={styles.clientGoal}>
                      {client.goal}
                    </Text>
                  </View>
                </View>

                {/* Only show a time if this client has messages. */}
                {latestMessage ? (
                  <Text style={styles.time}>
                    {latestMessage.time}
                  </Text>
                ) : null}
              </View>

              {/* Show a preview or a placeholder for new conversations. */}
              <Text style={styles.message}>
                {latestMessage
                  ? latestMessage.message
                  : "No messages yet"}
              </Text>

              {/* Only show unread count when there are unread messages. */}
              {unreadCount > 0 ? (
                <Text style={styles.unread}>
                  {unreadCount} new{" "}
                  {unreadCount === 1 ? "message" : "messages"}
                </Text>
              ) : null}
            </Pressable>
          )
        )}
      </ScrollView>
    </ThemedBackground>
  );
}

// Existing Keys2Fitness styling with additional profile text styles.
const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center",
  },
  back: { alignSelf: "flex-start", minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, justifyContent: "center" },
  pressed: { backgroundColor: colors.surfaceMuted },
  backButton: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  title: {
    marginTop: spacing.sm,
    ...textStyles.page,
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
    flexShrink: 1,
  },

  // Allows long client names or goals to wrap on mobile.
  clientText: {
    flexShrink: 1,
  },

  clientName: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },

  // K2F-98: Display client fitness goal in the conversation list.
  clientGoal: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },

  time: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginLeft: spacing.sm,
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
