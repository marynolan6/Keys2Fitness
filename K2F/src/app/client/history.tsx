import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DemoWorkoutClientPicker } from "@/components/DemoWorkoutClientPicker";
import { ThemedBackground } from "@/components/ThemedBackground";
import { WorkoutHistorySection } from "@/components/WorkoutHistorySection";
import { colors, layout, radii, spacing, typography } from "@/theme";

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  return <ThemedBackground>
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back from workout history"
          onPress={() => router.canGoBack() ? router.back() : router.replace("/client/home")}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <DemoWorkoutClientPicker />
        <WorkoutHistorySection />
      </View>
    </ScrollView>
  </ThemedBackground>;
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md, paddingBottom: spacing.xl },
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", gap: spacing.md },
  back: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, padding: spacing.sm,
    borderRadius: radii.button, backgroundColor: colors.surface, alignSelf: "flex-start", justifyContent: "center" },
  pressed: { backgroundColor: colors.surfaceMuted },
  link: { color: colors.primaryDark, fontSize: typography.body, fontWeight: "600" },
});
