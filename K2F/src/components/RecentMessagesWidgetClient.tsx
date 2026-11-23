import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BuilderButton } from "@/components/WorkoutBuilderControls";
import { isUnreadFor, mockMessages } from "@/messages/mockMessageCoachClient";
import { colors, radii, spacing, typography } from "@/theme";

export function RecentMessagesWidget() {
  const router = useRouter();
  const clientMessages = mockMessages
    .filter((message) => message.clientId === "1" && message.senderType === "coach")
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const visible = clientMessages.filter((message, index) => index < 2 || isUnreadFor(message, "client"));

  return <View style={styles.section}>
    <Text style={styles.title}>Recent Messages</Text>
    {visible.map((item) => {
      const unread = isUnreadFor(item, "client");
      return <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/client/messages", params: { messageId: item.id } })}
        style={({ pressed }) => [styles.card, unread && styles.unreadCard, pressed && styles.pressed]}>
        <View style={styles.header}>
          <Text style={styles.sender}>{item.sender}</Text>
          {unread && <Text style={styles.unread}>NEW</Text>}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</Text>
      </Pressable>;
    })}
    {visible.length < clientMessages.length && (
      <BuilderButton label="View more messages" onPress={() => router.push("/client/messages")} />
    )}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "700", marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, marginBottom: spacing.sm, padding: spacing.md },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  sender: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "700" },
  message: { color: colors.text, fontSize: typography.body, marginTop: spacing.xs },
  time: { color: colors.textMuted, fontSize: typography.label, marginTop: spacing.sm },
  unreadCard: { borderColor: colors.primary, borderWidth: 2 },
  unread: { color: colors.primaryDark, fontSize: typography.caption, fontWeight: "700" },
  pressed: { opacity: 0.75 },
});
