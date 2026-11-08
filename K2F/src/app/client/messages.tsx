import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useReadState } from "@/messages/MessageReadState";
import { KeyboardAvoidingView, Platform, ScrollView,StyleSheet, View, type ScrollViewInstance,} from "react-native";
import { ConversationHeader, NewMessagesDivider,TypingIndicator,} from "@/messages/MessageFeatures";
import { mockCoachTyping, mockMessages,type MockMessage,} from "@/messages/mockMessageCoachClient";
import { MessageBubble } from "@/messages/MessageBubble";
import { ConversationSearchBar } from "@/messages/ConversationSearchBar";
import { searchMessages } from "@/messages/messageSearch";
import { MessageSearchResults } from "@/messages/MessageSearchResults";
import { MessageComposer } from "@/messages/MessageComposer";
import { MessageState } from "@/messages/MessageState";
import { MessageTimestamp } from "@/messages/MessageTimestamp";
import { ThemedBackground } from "@/components/ThemedBackground";
import { spacing } from "@/theme";

type MessageStatus = "loading" | "ready" | "error";

export default function Messages() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollViewInstance>(null);

  const [messageStatus, setMessageStatus] =
    useState<MessageStatus>("ready");

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
  const isTyping = message.trim().length > 0;

  const { isUnread } = useReadState({
    messages,
    viewer: "client",
    storageKey: "client-1-read-messages-test-2",
  });

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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Pinned above the conversation so search stays reachable however far the client has scrolled. */}
        <View style={styles.headerArea}>
          <ConversationHeader
            name="COACH KEYS"
            onBack={() => router.back()}
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
          ) : messageStatus === "loading" ? (
            <MessageState state="loading" />
          ) : messageStatus === "error" ? (
            <MessageState
              state="error"
              onRetry={() => setMessageStatus("ready")}
            />
          ) : messages.length === 0 ? (
            <MessageState state="empty" />
          ) : (
            <>
              {messages.map((item, index) => {
                const previousMessage = messages[index - 1];

                const currentTime = new Date(
                  item.createdAt,
                ).getTime();

                const previousTime = previousMessage
                  ? new Date(
                    previousMessage.createdAt,
                  ).getTime()
                  : 0;

                const showTimestamp =
                  !previousMessage ||
                  currentTime - previousTime >
                  30 * 60 * 1000;

                const currentUnread = isUnread(item);

                const firstUnreadIndex = messages.findIndex((message) =>
                  isUnread(message),
                );

                const showNewMessages =
                  currentUnread &&
                  index === firstUnreadIndex;

                return (
                  <View key={item.id}>
                    {showNewMessages && (
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

              {isTyping && (
                <TypingIndicator
                  sender="You"
                  isOwnMessage
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
  screen: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  messageList: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  composerContainer: {
    padding: spacing.sm,
  },
});