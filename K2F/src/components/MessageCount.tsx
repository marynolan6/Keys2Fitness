import { StyleSheet, Text, View } from "react-native";

import {
  isUnreadFor,
  mockMessages,
  type MessageViewer,
} from "@/messages/mockMessageCoachClient";
import { colors, typography } from "@/theme";

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
  backgroundColor: colors.primary,
  borderColor: colors.surface,
  borderRadius: 14,
  borderWidth: 2,
  height: 28,
  justifyContent: "center",
  minWidth: 28,
  paddingHorizontal: 5,
  position: "absolute",
  right: -10,
  top: -10,
},

badgeText: {
  color: colors.surface,
  fontSize: typography.caption,
  fontWeight: "700",
  textAlign: "center",
},
});