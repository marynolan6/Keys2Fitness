import { StyleSheet, TextInput, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { colors, layout, radii, spacing, typography } from "@/theme";

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
        accessibilityLabel="Message"
        submitBehavior="newline"
        showSoftInputOnFocus
        multiline
        style={styles.input}
      />

      <ActionButton label="Send" disabled={!canSend} onPress={onSend} />
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
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
