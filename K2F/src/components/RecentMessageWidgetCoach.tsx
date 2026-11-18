import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { MockMessage } from "@/messages/mockMessageCoachClient";
import { colors, layout, radii, spacing, typography } from "@/theme";

type WidgetProps = {
  messages: MockMessage[];
  onPress: () => void;
};

type ModalProps = {
  visible: boolean;
  messages: MockMessage[];
  onClose: () => void;
};

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} · ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

/* Coach dashboard card */
export function NewCoachMessagesWidget({
  messages,
  onPress,
}: WidgetProps) {
  const unreadCount = messages.filter(
    (message) =>
      message.senderType === "client" &&
      message.unreadFor === "coach"
  ).length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="View recent messages"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>💬</Text>

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle}>Recent Messages</Text>

      <Text style={styles.cardSubtitle}>
        {unreadCount} unread{" "}
        {unreadCount === 1 ? "message" : "messages"}
      </Text>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

/* Recent messages pop-up */
export function RecentMessagesModal({
  visible,
  messages,
  onClose,
}: ModalProps) {
  const recentMessages = [...messages]
    .filter(
  (message) =>
    message.senderType === "client" &&
    message.unreadFor === "coach"
)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 20);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard} accessibilityViewIsModal>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Recent Messages</Text>
              <Text style={styles.modalSubtitle}>
                Latest messages from your clients
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close recent messages"
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.messageList}>
            {recentMessages.length === 0 ? (
              <Text style={styles.emptyText}>
                No recent messages.
              </Text>
            ) : (
              recentMessages.map((message, index) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    index === 0 && styles.latestRow,
                  ]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {message.clientName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.messageContent}>
                    <View style={styles.nameRow}>
                      <Text style={styles.clientName}>
                        {message.clientName}
                      </Text>

                      {message.unreadFor === "coach" && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>

                    <Text
                      style={styles.messageText}
                      numberOfLines={2}
                    >
                      {message.message}
                    </Text>

                    <Text style={styles.messageTime}>
                      {formatMessageTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={styles.closeFullButton}
          >
            <Text style={styles.closeFullButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },

  cardPressed: {
    opacity: 0.75,
  },

iconContainer: {
  width: 52,
  height: 52,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.xs,
  borderRadius: 26,
  backgroundColor: colors.surfaceMuted,
},
  icon: {
    fontSize: 26,
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor:colors.primary,
    
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: typography.label,
    fontWeight: "700",
  },

  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },

  cardSubtitle: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.label,
  },

  chevron: {
    position: "absolute",
    right: spacing.lg,
    top: 48,
    color: "#1976B5",
    fontSize: 28,
  },

  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modalCard: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    maxHeight: "80%",
    alignSelf: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  modalTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  modalSubtitle: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: typography.label,
  },

  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: colors.text,
    fontSize: 30,
  },

  messageList: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
  },

  latestRow: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },

  avatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#DCECF8",
  },

  avatarText: {
    color: "#1976B5",
    fontSize: typography.body,
    fontWeight: "700",
  },

  messageContent: {
    flex: 1,
    gap: spacing.xs,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  clientName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#5AA5E5",
  },

  messageText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  messageTime: {
    color: colors.textMuted,
    fontSize: typography.label,
  },

  emptyText: {
    padding: spacing.lg,
    color: colors.textMuted,
    textAlign: "center",
  },

  closeFullButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    borderRadius: radii.button,
    backgroundColor: colors.primaryDark,
  },

  closeFullButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
});