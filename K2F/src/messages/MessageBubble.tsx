import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type MessageBubbleProps = {
  message: string;
  sender: string;
  time?: string;
  isOwnMessage: boolean;
};

export function MessageBubble({
  message,
  sender,
  time,
  isOwnMessage,
}: MessageBubbleProps) {
  return (
    <View
      style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
      ]}
    >
      <Text
        style={[
          styles.sender,
          isOwnMessage ? styles.ownText : styles.otherText,
        ]}
      >
        {sender}
      </Text>

      <Text
        style={[
          styles.message,
          isOwnMessage ? styles.ownText : styles.otherText,
        ]}
      >
        {message}
      </Text>

      {time && (
        <Text
          style={[
            styles.time,
            isOwnMessage ? styles.ownText : styles.otherText,
          ]}
        >
          {time}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: radii.button,
    marginBottom: spacing.md,
    maxWidth: "85%",
    padding: spacing.md,
  },
  ownBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
  },
  sender: {
    fontSize: typography.label,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.body,
  },
  time: {
  alignSelf: "flex-end",
  color: colors.textMuted,
  fontSize: typography.label,
  marginTop: spacing.sm,
  textAlign: "right",
},
  ownText: {
    color: colors.surface,
  },
  otherText: {
    color: colors.text,
  },
});