import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type QuickAccessCardProps = {
  label: string;
  description: string;
  onPress: () => void;
};

function QuickAccessCard({ label, description, onPress }: QuickAccessCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAccessCard, pressed && styles.quickAccessCardPressed,
      ]}
      >
        <Text style={styles.quickAccessLabel}>{label}</Text>
        <Text style={styles.quickAccessDescription}>{description}</Text>
      </Pressable>
  );
}

// export default function Messages() {
//   return (
//     <View style={styles.container}>
//       <Text>client messages</Text>
//     </View>
//   );
// }

export default function ClientHome() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>KEYS2FITNESS</Text>
      <Text style={styles.title}>Good morning, Spencer</Text>
      <Text style={styles.subtitle}>Let&apos;s build strength!</Text>

      <View style={styles.quickAccessSection}>
        <Text style={styles.sectionTitle}>Quick access</Text>

        <View style={styles.quickAccessGrid}>
          <QuickAccessCard
            label="Workout"
            description="Continue training"
            onPress={() =>
              router.push({
                pathname: "/client/home/workout/[workoutId]",
                params: { workoutId: "today" },
              })
            } />
          <QuickAccessCard
            label="Messages"
            description="Talk to your coach"
            onPress={() =>
              router.push("/client/messages")}
          />
          <QuickAccessCard
            label="Progress"
            description="Review your progress"
            onPress={() => router.push("/client/progress")}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
    marginTop: spacing.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  quickAccessSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  quickAccessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickAccessCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    flexBasis: "31%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 120,
    padding: spacing.md,
  },
  quickAccessCardPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  quickAccessLabel: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  quickAccessDescription: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: spacing.sm,
    textAlign: "center",
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});