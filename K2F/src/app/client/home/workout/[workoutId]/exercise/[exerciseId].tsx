import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BrandedPage } from "@/components/BrandedPage";
import { BuilderButton } from "@/components/WorkoutBuilderControls";
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
    <BrandedPage underNativeHeader title={name || "Exercise Details"}>
      <BuilderButton label="Back" secondary onPress={() => router.canGoBack() ? router.back() : router.replace("/client/home")} />

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
    </BrandedPage>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
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
