import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";
import { colors, radii, spacing, typography } from "@/theme";

export default function CoachConversation() {
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  const messages = coachMessages.filter(
    (message) => message.clientId === clientId,
  );

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>
          {messages[0]?.clientName ?? "Conversation"}
        </Text>

        {messages.map((message) => (
          <Text key={message.id} style={styles.messageBubble}>
            {message.message}
          </Text>
        ))}
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
  messageBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.md,
    maxWidth: "85%",
    padding: spacing.md,
  },
});