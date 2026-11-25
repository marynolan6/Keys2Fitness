import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCoachClientsState } from "@/clients/clientStore";
import { DemoWorkoutClientPicker } from "@/components/DemoWorkoutClientPicker";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { BuilderButton } from "@/components/WorkoutBuilderControls";
import DailyNutritionSummary from "@/components/nutrition/DailyNutritionSummary";
import { nutritionRepository, useClientNutrition } from "@/nutrition/nutritionStore";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { colors, layout, spacing, typography } from "@/theme";

export default function NutritionScreen() {
  const library = useWorkoutLibraryState();
  const { clients, loadStatus } = useCoachClientsState();
  const clientId = library.data.previewClientId;
  const client = clients.find((item) => item.id === clientId);
  const nutrition = useClientNutrition(clientId);
  return <ThemedBackground>
    <Stack.Screen options={{ title: "Nutrition" }} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <K2FBrand />
      <PageTitle style={styles.title}>Nutrition</PageTitle>
      {library.status === "loading" ? <Text style={styles.body}>Loading demo client…</Text>
        : library.status === "error" ? <>
          <Text accessibilityRole="alert" style={styles.body}>{library.error}</Text>
          <BuilderButton label="Retry demo client" onPress={() => { void workoutLibrary.load(); }} />
        </> : <>
          {loadStatus !== "ready" || !client || !nutrition ? <Text style={styles.body}>Nutrition is unavailable for this demo client.</Text>
            : <View key={clientId}>
              <Text style={styles.context}>Demo plan for {client.name}</Text>
              <DailyNutritionSummary entries={nutrition.entries} goals={nutrition.plan.targets} tip={nutrition.plan.tip} clientName={client.name}
                updateFood={(update) => nutritionRepository.updateFood(clientId, update)} />
            </View>}
          <DemoWorkoutClientPicker context="nutrition" />
        </>}
    </ScrollView>
  </ThemedBackground>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  title: { color: colors.text, fontSize: typography.title, fontWeight: "400" },
  context: { color: colors.textMuted, fontSize: typography.label },
  body: { color: colors.text, fontSize: typography.body },
});
