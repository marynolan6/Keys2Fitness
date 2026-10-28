import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type CoachMessage = {
  id: string;
  clientName: string;
  message: string;
  unread: boolean;
};

type NewCoachMessagesWidgetProps = {
  messages: CoachMessage[];
  onPress: () => void;
};

export function NewCoachMessagesWidget({
  messages,
  onPress,
}: NewCoachMessagesWidgetProps) {
  const unreadCount = messages.filter((message) => message.unread).length;

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
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>New Messages</Text>


        <Text style={styles.subtitle}>Tap to view conversations</Text>
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
    flexDirection: "row",
    marginTop: spacing.lg,
    padding: spacing.lg,
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
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
 
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.xs,
  },
  arrow: {
    color: colors.primaryDark,
    fontSize: 40,
    marginLeft: spacing.sm,
  },
});