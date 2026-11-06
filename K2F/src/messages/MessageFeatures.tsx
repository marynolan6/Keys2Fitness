import { Pressable, StyleSheet, Text, View } from "react-native";

import { ClientAvatar } from "@/components/ClientAvatar";
import { colors, spacing, typography } from "@/theme";

type ConversationHeaderProps = {
  name: string;
  onBack: () => void;
  imageUrl?: string;
};

export function ConversationHeader({
  name,
  onBack,
  imageUrl,
}: ConversationHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <ClientAvatar
        name={name}
        imageUrl={imageUrl}
        size={44}
      />

      <View style={styles.profileInfo}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.brand}>KEYS2FITNESS</Text>
      </View>
    </View>
  );
}

export function NewMessagesDivider() {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />

      <Text style={styles.dividerText}>New messages</Text>

      <View style={styles.dividerLine} />
    </View>
  );
}
type TypingIndicatorProps = {
  sender: string;
  isOwnMessage: boolean;
};

export function TypingIndicator({
  sender,
  isOwnMessage,
}: TypingIndicatorProps) {
  return (
    <View
      style={[
        styles.typingBubble,
        isOwnMessage
          ? styles.ownTypingBubble
          : styles.otherTypingBubble,
      ]}
    >
      <Text
        style={[
          styles.typingSender,
          isOwnMessage
            ? styles.ownTypingText
            : styles.otherTypingText,
        ]}
      >
        {sender}
      </Text>

      <Text
        style={[
          styles.dots,
          isOwnMessage
            ? styles.ownTypingText
            : styles.otherTypingText,
        ]}
      >
        •••
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    justifyContent: "center",
    minHeight: 44,
    minWidth: 32,
  },
  backText: {
    color: colors.primaryDark,
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  brand: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  dividerContainer: {
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
  dividerText: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
  },
  typingBubble: {
  borderRadius: 20,
  marginBottom: spacing.md,
  maxWidth: "35%",
  padding: spacing.md,
},

ownTypingBubble: {
  alignSelf: "flex-end",
  backgroundColor: colors.primary,
},

otherTypingBubble: {
  alignSelf: "flex-start",
  backgroundColor: colors.surface,
},

typingSender: {
  fontSize: typography.label,
  fontWeight: "700",
  marginBottom: spacing.xs,
},

dots: {
  fontSize: typography.body,
  letterSpacing: 3,
},

ownTypingText: {
  color: colors.surface,
},

otherTypingText: {
  color: colors.text,
},
});