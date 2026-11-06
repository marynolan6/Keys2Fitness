import { StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "@/theme";

type MessageTimestampProps = {
  createdAt: string;
};

export function formatMessageTimestamp(createdAt: string): string {
  const messageDate = new Date(createdAt);
  const now = new Date();

  const differenceInHours =
    (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  const time = messageDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (differenceInHours >= 24 && differenceInHours < 48) {
    return `Yesterday, ${time}`;
  }

  if (differenceInHours >= 48 && differenceInHours < 24 * 7) {
    return messageDate.toLocaleDateString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (differenceInHours >= 24 * 7) {
    return `${messageDate.toLocaleDateString("en-US")}, ${time}`;
  }

  return time;
}

export function MessageTimestamp({
  createdAt,
}: MessageTimestampProps) {
  return (
    <Text style={styles.timestamp}>
      {formatMessageTimestamp(createdAt)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timestamp: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textAlign: "center",
  },
});