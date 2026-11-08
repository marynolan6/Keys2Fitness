import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MessageSearchResult } from "@/messages/messageSearch";
import { colors, layout, radii, spacing, typography } from "@/theme";

type MessageSearchResultsProps = {
  query: string;
  results: MessageSearchResult[];
  // Clears the query so the full conversation shows again.
  onClearQuery: () => void;
};

// e.g. "Tue, Nov 3 · 12:10 PM": a full date so results from different days are easy to tell apart.
function formatResultTime(createdAt: string): string {
  const date = new Date(createdAt);
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

export function MessageSearchResults({ query, results, onClearQuery }: MessageSearchResultsProps) {
  const trimmed = query.trim();

  if (results.length === 0) {
    return (
      <View style={styles.empty} accessibilityLiveRegion="polite">
        <Text style={styles.emptyTitle} accessibilityRole="header">No matching messages</Text>
        <Text style={styles.emptyBody}>
          Nothing in your conversation with your coach mentions “{trimmed}”. Check the spelling or try a shorter word.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onClearQuery}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
        >
          <Text style={styles.clearButtonText}>Clear search</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Text accessibilityLiveRegion="polite" style={styles.count}>
        {results.length} {results.length === 1 ? "message" : "messages"} matching “{trimmed}”
      </Text>

      {results.map(({ message, segments }) => {
        const sender = message.senderType === "client" ? "You" : message.sender;
        const time = formatResultTime(message.createdAt);
        return (
          <View
            key={message.id}
            style={[styles.result, message.senderType === "client" && styles.ownResult]}
            accessible
            accessibilityLabel={`${sender}, ${time}: ${message.message}`}
          >
            <View style={styles.meta}>
              <Text style={styles.sender}>{sender}</Text>
              <Text style={styles.time}>{time}</Text>
            </View>
            <Text style={styles.text}>
              {segments.map((segment, index) =>
                segment.isMatch ? (
                  <Text key={index} style={styles.highlight}>
                    {segment.text}
                  </Text>
                ) : (
                  segment.text
                ),
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  count: {
    color: colors.textMuted,
    fontSize: typography.label,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  result: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftColor: colors.primaryDark,
    borderLeftWidth: 4,
    borderRadius: radii.button,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  ownResult: {
    borderLeftColor: colors.primary,
  },
  meta: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  sender: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "700",
  },
  time: {
    color: colors.textMuted,
    fontSize: 13,
  },
  text: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  highlight: {
    backgroundColor: colors.surfaceMuted,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  clearButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.lg,
  },
  clearButtonPressed: {
    opacity: 0.8,
  },
  clearButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
});
