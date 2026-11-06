import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useReadState } from "@/messages/MessageReadState";
import { KeyboardAvoidingView, Platform, ScrollView,StyleSheet, View,} from "react-native";
import { ConversationHeader, NewMessagesDivider,TypingIndicator,} from "@/messages/MessageFeatures";
import { mockCoachTyping, mockMessages,type MockMessage,} from "@/messages/mockMessageCoachClient";
import { MessageBubble } from "@/messages/MessageBubble";
import { MessageComposer } from "@/messages/MessageComposer";
import { MessageState } from "@/messages/MessageState";
import { MessageTimestamp } from "@/messages/MessageTimestamp";
import { ThemedBackground } from "@/components/ThemedBackground";
import { spacing } from "@/theme";

type MessageStatus = "loading" | "ready" | "error";

export default function Messages() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

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
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({
              animated: false,
            })
          }
        >
          <ConversationHeader
            name="COACH KEYS"
            onBack={() => router.back()}
          />

          {messageStatus === "loading" ? (
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
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  composerContainer: {
    padding: spacing.sm,
  },
});