import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

type MessageStateProps = {
  state: "empty" | "loading" | "error";
  onRetry?: () => void;
};

export function MessageState({
  state,
  onRetry,
}: MessageStateProps) {
  if (state === "loading") {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading messages...</Text>
      </View>
    );
  }

  if (state === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Something went wrong while loading messages.
        </Text>

        {onRetry && (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No messages yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  text: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  retryText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});