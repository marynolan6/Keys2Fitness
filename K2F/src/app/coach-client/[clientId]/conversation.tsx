import { useLocalSearchParams, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useRef, useState, } from "react";

import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";
// K2F-282: Find the selected client's profile using their ID.
// This allows clients without messages to display their correct name.
import { getClientById } from "@/clients/mockClients";
import { colors, radii, spacing, typography } from "@/theme";

import { ClientAvatar } from "@/components/ClientAvatar";
import { PageTitle } from "@/components/K2FBrand";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CoachConversation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const [messages, setMessages] = useState([...coachMessages]);
  const [draft, setDraft] = useState("");
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  // K2F-282: Retrieve the client selected from the Messages list.
  // Each client has a unique ID, so profiles won't get mixed up.
  const selectedClient = getClientById(clientId);

  const oneHour = 30 * 60 * 1000;

  const orderedMessages = coachMessages
    .filter((message) => message.clientId === clientId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    );
    
  useEffect(() => {
    // Keep the newest message visible when a new message is sent or the
    // conversation content changes size.
    const timeout = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timeout);
  }, [orderedMessages.length]);

  const sendMessage = () => {
    const messageText = draft.trim();
    if (!messageText || !clientId || !selectedClient) return;

    const createdAt = new Date().toISOString();
    const time = new Date(createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const newMessage = {
      id: `coach-${Date.now()}`,
      clientId,
      clientName: selectedClient.name,
      message: messageText,
      createdAt,
      time,
      fromCoach: true,
      unread: false,
    };

    // Update the shared mock list so the Messages overview can show the latest message.
    coachMessages.push(newMessage);
    setMessages([...coachMessages]);
    setDraft("");
  };

  return (
    <ThemedBackground>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.md }]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back to Messages</Text>
        </Pressable>


        {/* K2F-282: Show the selected client's name and profile.
            Use mockClients instead of relying on existing messages.
            This also supports clients without message history.
        */}
        <View style={styles.profileHeader}>
          <ClientAvatar name={selectedClient?.name ?? "Client"} />

          <View style={styles.profileText}>
            {/* Display the selected client's name. */}
            <PageTitle style={styles.title}>{selectedClient?.name ?? "Client unavailable"}</PageTitle>

            {/* Display their fitness goal when available. */}
            {selectedClient?.goal ? (
              <Text style={styles.clientGoal}>
                {selectedClient.goal}
              </Text>
            ) : null}
          </View>
        </View>

        {/* K2F-282: Display a message when the client has no
            conversation history yet.
        */}
        {selectedClient && orderedMessages.length === 0 && (
          <View style={styles.emptyConversation}>
            <Text style={styles.emptyConversationText}>
              No messages with {selectedClient.name} yet.
            </Text>
          </View>
        )}

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
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          accessibilityLabel="Message to client"
          placeholder={`Message ${selectedClient?.name ?? "client"}…`}
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          style={styles.messageInput}
          multiline
          maxLength={1000}
          returnKeyType="default"
          textAlignVertical="top"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!draft.trim() || !selectedClient}
          onPress={sendMessage}
          style={({ pressed }) => [
            styles.sendButton,
            (!draft.trim() || !selectedClient) && styles.sendButtonDisabled,
            pressed && styles.sendButtonPressed,
          ]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderTopColor: colors.textMuted,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  messageInput: {
    backgroundColor: colors.surface,
    borderColor: colors.textMuted,
    borderRadius: radii.button,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    opacity: 0.8,
  },
  sendButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
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
  
  // K2F-97: Allows the client name and goal to fit on mobile.
  profileText: {
    flex: 1,
  },

  // Shows the selected client's fitness goal.
  clientGoal: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },

  // Container displayed when there are no messages.
  emptyConversation: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: "center",
  },

  // Explains that this client has no messages yet.
  emptyConversationText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center",
  },


});
