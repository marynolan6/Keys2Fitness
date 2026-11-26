import { StyleSheet, Text, View } from "react-native";

import { actionColors, colors, radii, spacing, textStyles } from "@/theme";

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
    backgroundColor: actionColors.primary.fill,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
  },
  sender: {
    ...textStyles.label,
    marginBottom: spacing.xs,
  },
  message: textStyles.body,
  time: {
    ...textStyles.meta, alignSelf: "flex-end", marginTop: spacing.xs, textAlign: "right",
  },
  ownText: {
    color: actionColors.primary.ink,
  },
  otherText: {
    color: colors.text,
  },
});
