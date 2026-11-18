import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";
import {
  isUnreadFor,
  type MockMessage,
} from "@/messages/mockMessageCoachClient";

type NewCoachMessagesWidgetProps = {
  messages: MockMessage[];
  onPress: () => void;
};

export function NewCoachMessagesWidget({
  messages,
  onPress,
}: NewCoachMessagesWidgetProps) {
  const unreadCount = messages.filter(
    (message) =>
      message.senderType === "client" &&
      isUnreadFor(message, "coach"),
  ).length;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>•••</Text>

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>New Messages</Text>

        <Text style={styles.subtitle}>
          {unreadCount > 0
            ? `${unreadCount} unread message${
                unreadCount === 1 ? "" : "s"
              }`
            : "No new messages"}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    flex: 1,
    marginTop: 0,
    padding: spacing.md,
    position: "relative",
  },
  pressed: {
    opacity: 0.8,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 40,
    height: 64,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 64,
  },
  icon: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: -5,
    top: -5,
    width: 30,
  },
  badgeText: {
    color: colors.surface,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  arrow: {
  color: colors.primaryDark,
  fontSize: 28,
  position: "absolute",
  right: spacing.md,
  top: "50%",
  transform: [{ translateY: -14 }],
},
});