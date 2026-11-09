import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type MessageComposerProps = {
  message: string;
  onChangeMessage: (message: string) => void;
  onSend: () => void;
};

export function MessageComposer({
  message,
  onChangeMessage,
  onSend,
}: MessageComposerProps) {
  const canSend = message.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        value={message}
        onChangeText={onChangeMessage}
        placeholder="Write a message..."
        placeholderTextColor={colors.textMuted}
        blurOnSubmit={false}
        showSoftInputOnFocus
        multiline
        style={styles.input}
      />

      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={[styles.sendButton, !canSend && styles.disabledButton]}
      >
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    maxHeight: 100,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.surface,
    fontSize: typography.label,
    fontWeight: "700",
  },
});