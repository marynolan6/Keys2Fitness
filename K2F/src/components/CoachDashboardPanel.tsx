import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClientAvatar } from "@/components/ClientAvatar";
import { ActionButton } from "./ActionButton";
import type { CoachClient } from "@/clients/mockClients";
import type { MockMessage } from "@/messages/mockMessageCoachClient";
import type { WorkoutActivity } from "@/workouts/workoutSessionService";
import { colors, layout, radii, spacing, typography } from "@/theme";

export type CoachPanel = "messages" | "clients" | "activity";
const titles = { messages: "Recent Messages", clients: "Active Clients", activity: "Client Activity" };

export function CoachDashboardPanel({ panel, clients, messages, activities, activitySummary, onClose, onClient }: {
  panel: CoachPanel; clients: readonly CoachClient[]; messages: MockMessage[]; activities: WorkoutActivity[];
  activitySummary: string; onClose: () => void; onClient: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const rows = panel === "clients" ? clients.map((c) => ({ id: c.id, clientId: c.id, name: c.name, detail: c.goal, time: "" })) :
    panel === "activity" ? activities.map((a) => ({ id: a.id, clientId: a.clientId, name: a.clientName,
      detail: `${a.workoutName} ${a.workoutStatus === "ended-early" ? "ended early" : "completed"}`, time: formatTime(a.completedAt) })) :
      messages.slice(0, 20).map((m) => ({ id: m.id, clientId: null, name: m.clientName, detail: m.message, time: formatTime(m.createdAt) }));
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View accessibilityViewIsModal style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>{titles[panel]}</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {!rows.length && <Text style={styles.body}>{panel === "activity" ? activitySummary : panel === "clients" ? "No active clients yet." : "No unread client messages."}</Text>}
          {rows.map(({ id, clientId, name, detail, time }) => {
            const content = <><ClientAvatar name={name} size={layout.minTouchTarget} /><View style={styles.copy}>
              <Text style={styles.name}>{name}</Text><Text style={styles.body}>{detail}</Text>
              {time ? <Text style={styles.meta}>{time}</Text> : null}
            </View></>;
            return clientId === null ? <View key={id} style={styles.row}>{content}</View> :
              <Pressable key={id} accessibilityRole="button" onPress={() => { onClose(); onClient(clientId); }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>{content}</Pressable>;
          })}
        </ScrollView>
        <ActionButton label="Close" secondary onPress={onClose} />
      </View>
    </View>
  </Modal>;
}

function formatTime(value: string | number) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.overlay, paddingHorizontal: spacing.md },
  panel: { width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "100%", backgroundColor: colors.surface,
    borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: typography.heading, color: colors.text, fontWeight: "600" },
  list: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: layout.minTouchTarget,
    borderRadius: radii.control, padding: spacing.sm, backgroundColor: colors.surfaceMuted },
  copy: { flex: 1, gap: spacing.xs },
  name: { color: colors.text, fontSize: typography.body, fontWeight: "700" },
  body: { color: colors.textMuted, fontSize: typography.body },
  meta: { color: colors.textMuted, fontSize: typography.caption },
  pressed: { opacity: 0.75 },
});
