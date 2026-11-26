import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFirstUnreadIndex } from "@/messages/MessageReadState";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { ConversationHeader, NewMessagesDivider, TypingIndicator } from "@/messages/MessageFeatures";
import { mockCoachTyping, mockMessages, type MockMessage } from "@/messages/mockMessageCoachClient";
import { MessageBubble } from "@/messages/MessageBubble";
import { ConversationSearchBar } from "@/messages/ConversationSearchBar";
import { searchMessages } from "@/messages/messageSearch";
import { MessageSearchResults } from "@/messages/MessageSearchResults";
import { MessageComposer } from "@/messages/MessageComposer";
import { MessageTimestamp } from "@/messages/MessageTimestamp";
import { ThemedBackground } from "@/components/ThemedBackground";
import { colors, layout, navigation, spacing, typography } from "@/theme";

export default function Messages() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  const [messages, setMessages] = useState<MockMessage[]>(() =>
    mockMessages
      .filter((item) => item.clientId === "1")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      ),
  );

  const [message, setMessage] = useState("");

  // Search lives in local state and only reads this conversation's messages; it never changes them.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isShowingResults = isSearchOpen && searchQuery.trim().length > 0;
  const searchResults = isShowingResults ? searchMessages(messages, searchQuery) : [];

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  const firstUnreadIndex = useFirstUnreadIndex(messages, "client", "client-1-read-messages-test-2");

  function sendMessage() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    const newMessage: MockMessage = {
      id: `client-${Date.now()}`,
      clientId: "1",
      clientName: "Spencer",
      sender: "Spencer",
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      senderType: "client",
      unreadFor: "coach",
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      newMessage,
    ]);

    setMessage("");
  }

  return (
    <ThemedBackground>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Pinned above the conversation so search stays reachable however far the client has scrolled. */}
        <View style={[styles.headerArea, { paddingTop: insets.top + spacing.md }]}>
          <ConversationHeader
            name="Coach Keys"
            onSearchPress={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
            isSearchActive={isSearchOpen}
          />
          {isSearchOpen && (
            <ConversationSearchBar
              query={searchQuery}
              onChangeQuery={setSearchQuery}
              onCancel={closeSearch}
            />
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.thread}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            // Results are newest first, so start them at the top; the conversation starts at the latest message.
            isShowingResults
              ? scrollViewRef.current?.scrollTo({ y: 0, animated: false })
              : scrollViewRef.current?.scrollToEnd({
                animated: false,
              })
          }
        >
          {isShowingResults ? (
            <MessageSearchResults query={searchQuery} results={searchResults} onClearQuery={() => setSearchQuery("")} />
          ) : messages.length === 0 ? (
            <Text style={styles.empty}>No messages yet.</Text>
          ) : (
            <>
              {messages.map((item, index) => {
                const previousMessage = messages[index - 1];

                const showTimestamp = !previousMessage || Date.parse(item.createdAt) - Date.parse(previousMessage.createdAt) > 30 * 60 * 1000;

                return (
                  <View key={item.id}>
                    {index === firstUnreadIndex && (
                      <NewMessagesDivider />
                    )}

                    {showTimestamp && (
                      <MessageTimestamp
                        createdAt={item.createdAt}
                      />
                    )}

                    <MessageBubble
                      sender={
                        item.senderType === "client"
                          ? "You"
                          : item.sender
                      }
                      message={item.message}
                      time={new Date(
                        item.createdAt,
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      isOwnMessage={
                        item.senderType === "client"
                      }
                    />
                  </View>
                );
              })}

              {mockCoachTyping && (
                <TypingIndicator
                  sender="Coach Keys"
                  isOwnMessage={false}
                />
              )}

            </>
          )}
        </ScrollView>

        <View style={styles.composerContainer}>
          <MessageComposer
            message={message}
            onChangeMessage={setMessage}
            onSend={sendMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  empty: { padding: spacing.xl, textAlign: "center", color: colors.textMuted, fontSize: typography.body },
  screen: { flex: 1, width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },
  thread: { flex: 1 },
  headerArea: {
    paddingHorizontal: spacing.lg,
  },
  messageList: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  composerContainer: {
    flexShrink: 0, padding: spacing.sm, paddingBottom: navigation.overlap + spacing.xs,
  },
});
