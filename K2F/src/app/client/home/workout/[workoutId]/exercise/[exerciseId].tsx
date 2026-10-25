import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemedBackground } from "@/components/ThemedBackground";
import { colors, radii, spacing, typography } from "@/theme";


export default function ExerciseDetails() {
  const router = useRouter();

  const { name, sets, reps, weight } = useLocalSearchParams<{
    name?: string;
    sets?: string;
    reps?: string;
    weight?: string;
  }>();

  return (
    <ThemedBackground>
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>{name ?? "Exercise Details"}</Text>

      <View style={styles.card}>
      <Text style={styles.label}>Sets</Text>
      <Text style={styles.value}>{sets ?? "N/A"}</Text>

      <Text style={styles.label}>Reps</Text>
      <Text style={styles.value}>{reps ?? "N/A"}</Text>

      <Text style={styles.label}>Weight</Text>
      <Text style={styles.value}>{weight ?? "N/A"}</Text>

      <Text style={styles.label}>Instructions</Text>
      <Text style={styles.instructions}>
        Follow the exercise instructions provided by your coach.
      </Text>
      </View>
    </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    color: colors.primaryDark,
    fontSize: typography.body,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "bold",
    marginTop: spacing.sm,
  },
  value: {
    color: colors.primaryDark,
    fontSize: typography.heading,
  },
  instructions: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },
});
