import { StyleSheet, Text, View } from "react-native";

import {
  isUnreadFor,
  mockMessages,
  type MessageViewer,
} from "@/messages/mockMessageCoachClient";
import { actionColors, colors, radii, spacing, typography } from "@/theme";

type MessageCountProps = {
  viewer: MessageViewer;
};


export function MessageCount({ viewer }: MessageCountProps) {
  const unreadCount = mockMessages.filter((message) =>
    isUnreadFor(message, viewer),
  ).length;

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{unreadCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
  alignItems: "center",
  backgroundColor: actionColors.primary.fill,
  borderColor: colors.surface,
  borderRadius: radii.button,
  borderWidth: 2,
  minHeight: spacing.lg,
  justifyContent: "center",
  minWidth: spacing.lg,
  paddingHorizontal: spacing.xs,
  position: "absolute",
  right: -10,
  top: -10,
},

badgeText: {
  color: actionColors.primary.ink,
  fontSize: typography.caption,
  fontWeight: "700",
  textAlign: "center",
},
});
