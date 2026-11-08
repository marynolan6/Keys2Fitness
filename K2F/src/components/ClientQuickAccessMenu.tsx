import { usePathname, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClientAvatar } from "@/components/ClientAvatar";
import { defaultProfile } from "@/profile/profile";
import { loadProfile } from "@/profile/profileStorage";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { mockAssignedWorkout } from "@/workouts/mockWorkout";

const items = [
  { label: "Home", path: "/client/home", icon: { ios: "house", android: "home", web: "home" } },
  { label: "Workout", path: "/client/home/workout", icon: { ios: "dumbbell", android: "fitness_center", web: "fitness_center" } },
  { label: "Nutrition", path: null, icon: { ios: "fork.knife", android: "restaurant", web: "restaurant" } },
  { label: "Messages", path: "/client/messages", icon: { ios: "message", android: "chat", web: "chat" } },
  { label: "Progress", path: "/client/progress", icon: { ios: "chart.bar", android: "bar_chart", web: "bar_chart" } },
  { label: "Profile", path: "/client/profile", icon: { ios: "person", android: "person", web: "person" } },
] as const;

export function ClientQuickAccessMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const [name, setName] = useState(defaultProfile.fullName);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    loadProfile().then((profile) => {
      if (active) setName(profile.fullName.trim() || "Client");
    }).catch(() => { if (active) setName(defaultProfile.fullName); });
    return () => { active = false; };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.md, paddingLeft: insets.left + spacing.md,
        paddingRight: insets.right + spacing.md }]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button"
          accessibilityLabel="Dismiss quick access menu" onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.panel, compact && styles.compactPanel]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Menu</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close quick access menu"
              onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.highlight]}>
              <SymbolView name={{ ios: "xmark", android: "close", web: "close" }}
                size={spacing.lg} tintColor={colors.primaryDark} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.identity}>
              <ClientAvatar name={name} />
              <View style={styles.identityText}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.subtitle}>Client · Keys2Fitness</Text>
              </View>
            </View>
            <View style={styles.divider} />
            {items.map((item) => {
              const selected = item.path !== null && (item.label === "Home"
                ? pathname === item.path : pathname.startsWith(item.path));
              return (
                <Pressable key={item.label} accessibilityRole="button"
                  accessibilityLabel={item.path ? item.label : "Nutrition, coming soon"}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    if (!item.path) {
                      Alert.alert("Nutrition", "Nutrition tools are coming soon.");
                      return;
                    }
                    onClose();
                    if (item.label === "Workout") {
                      if (mockAssignedWorkout) router.navigate({ pathname: "/client/home/workout/[workoutId]",
                        params: { workoutId: mockAssignedWorkout.id } });
                      else router.navigate("/client/home");
                    } else router.navigate(item.path);
                  }}
                  style={({ pressed }) => [styles.row, (selected || pressed) && styles.highlight]}>
                  <SymbolView name={item.icon} size={spacing.lg} tintColor={colors.primaryDark} />
                  <Text style={[styles.rowLabel, selected && styles.selectedLabel]}>{item.label}</Text>
                  <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                    size={spacing.md} tintColor={colors.primaryDark} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center" },
  panel: { width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "100%",
    backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg },
  compactPanel: { padding: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { fontSize: typography.heading, color: colors.text, flexShrink: 1, fontFamily: "serif" },
  close: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget,
    alignItems: "center", justifyContent: "center", borderRadius: radii.button },
  content: { paddingBottom: spacing.sm, gap: spacing.xs },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  identityText: { flex: 1, gap: spacing.xs },
  name: { fontSize: typography.heading, color: colors.text, fontFamily: "serif" },
  subtitle: { fontSize: typography.caption, color: colors.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md,
    minHeight: layout.minTouchTarget, padding: spacing.sm, borderRadius: radii.button },
  rowLabel: { flex: 1, fontSize: typography.body, fontWeight: "600", color: colors.text },
  selectedLabel: { color: colors.primaryDark },
  highlight: { backgroundColor: colors.surfaceMuted },
});
