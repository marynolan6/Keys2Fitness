import { usePathname, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActionButton } from "@/components/ActionButton";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";
import { getClientAssignedWorkout, workoutBelongsToClient } from "@/workouts/workoutSource";
import { useWorkoutLibraryState } from "@/workouts/workoutLibraryStore";
import { loadActiveWorkoutSession } from "@/workouts/workoutSession";

export type NavigationRole = "client" | "coach";

const clientItems = [
  { label: "Home", path: "/client/home", icon: { ios: "house", android: "home", web: "home" } },
  { label: "Workout", path: "/client/home/workout", icon: { ios: "dumbbell", android: "fitness_center", web: "fitness_center" } },
  { label: "Workout history", path: "/client/history", icon: { ios: "clock.arrow.circlepath", android: "history", web: "history" } },
  { label: "Nutrition", path: "/client/home/nutrition", icon: { ios: "fork.knife", android: "restaurant", web: "restaurant" } },
  { label: "Messages", path: "/client/messages", icon: { ios: "message", android: "chat", web: "chat" } },
  { label: "Progress", path: "/client/progress", icon: { ios: "chart.bar", android: "bar_chart", web: "bar_chart" } },
  { label: "Profile", path: "/client/profile", icon: { ios: "person", android: "person", web: "person" } },
] as const;

const coachItems = [
  { label: "Home", path: "/coach", icon: { ios: "house", android: "home", web: "home" } },
  { label: "Workout Library", path: "/coach/workouts", icon: { ios: "dumbbell", android: "fitness_center", web: "fitness_center" } },
  { label: "Check-ins", path: "/coach-checkins", icon: { ios: "checkmark.circle", android: "task_alt", web: "task_alt" } },
  // K2F-265: client videos waiting for the coach's feedback
  { label: "Video reviews", path: "/coach-videos", icon: { ios: "video", android: "videocam", web: "videocam" } },
  { label: "Messages", path: "/coach/messages", icon: { ios: "message", android: "chat", web: "chat" } },
  { label: "Profile", path: "/coach/profile", icon: { ios: "person", android: "person", web: "person" } },
  { label: "Preferences", path: "/coach/subscreens/preferences", icon: { ios: "slider.horizontal.3", android: "tune", web: "tune" } },
  { label: "Account settings", path: "/coach/subscreens/settings", icon: { ios: "gearshape", android: "settings", web: "settings" } },
] as const;

export function AppQuickAccessMenu({ role, visible, onClose }: {
  role: NavigationRole;
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const items = role === "client" ? clientItems : coachItems;
  const library = useWorkoutLibraryState();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.md, paddingLeft: insets.left + spacing.md,
        paddingRight: insets.right + spacing.md }]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button"
          accessibilityLabel="Dismiss quick access menu" onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.panel, compact && styles.compactPanel]}>
          <ScrollView contentContainerStyle={styles.content}>
            {items.map((item) => {
              const selected = item.label === "Home" ? pathname === item.path : pathname.startsWith(item.path);
              return (
                <Pressable key={item.label} accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={async () => {
                    if (item.label === "Workout") {
                      try {
                        const clientId = library.data.previewClientId;
                        const active = await loadActiveWorkoutSession((id) => workoutBelongsToClient(id, clientId));
                        const workoutId = active?.workoutId ?? getClientAssignedWorkout(clientId)?.id;
                        onClose();
                        if (workoutId) router.navigate({ pathname: "/client/home/workout/[workoutId]",
                          params: { workoutId, ...(active ? { resume: String(Date.now()) } : {}) } });
                        else router.navigate("/client/home");
                      } catch { Alert.alert("Workout unavailable", "Your saved workout could not be loaded. Please try again."); }
                    } else { onClose(); router.navigate(item.path); }
                  }}
                  style={({ pressed }) => [styles.row, (selected || pressed) && styles.highlight]}>
                  <SymbolView name={item.icon} size={spacing.lg} tintColor={colors.primaryDark} />
                  <Text style={[styles.rowLabel, selected && styles.selectedLabel]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ActionButton label="Close" accessibilityLabel="Close quick access menu" danger onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center" },
  panel: { width: "100%", maxWidth: layout.maxContentWidth, maxHeight: "100%",
    backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  compactPanel: { padding: spacing.md },
  content: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    minHeight: layout.minTouchTarget, padding: spacing.sm, borderRadius: radii.button },
  rowLabel: { flexShrink: 1, textAlign: "center", fontSize: typography.body, fontWeight: "600", color: colors.text },
  selectedLabel: { color: colors.primaryDark },
  highlight: { backgroundColor: colors.surfaceMuted },
});
