import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCoachClientsState } from "@/clients/clientStore";
import { DemoWorkoutClientPicker } from "@/components/DemoWorkoutClientPicker";
import { PageTitle, SectionMasthead } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { BuilderButton } from "@/components/WorkoutBuilderControls";
import DailyNutritionSummary from "@/components/nutrition/DailyNutritionSummary";
import { nutritionRepository, useClientNutrition } from "@/nutrition/nutritionStore";
import { useWorkoutLibraryState, workoutLibrary } from "@/workouts/workoutLibraryStore";
import { layout, spacing, textStyles } from "@/theme";

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const library = useWorkoutLibraryState();
  const { clients, loadStatus } = useCoachClientsState();
  const clientId = library.data.previewClientId;
  const client = clients.find((item) => item.id === clientId);
  const nutrition = useClientNutrition(clientId);
  return <ThemedBackground>
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]} keyboardShouldPersistTaps="handled">
      <SectionMasthead onBack={() => router.canGoBack() ? router.back() : router.replace("/client/home")} />
      <PageTitle>Nutrition</PageTitle>
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
  context: { ...textStyles.meta, marginBottom: spacing.sm },
  body: textStyles.body,
});
