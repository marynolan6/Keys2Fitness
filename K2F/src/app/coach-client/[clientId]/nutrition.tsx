import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCoachClientsState } from "@/clients/clientStore";
import { BuilderButton } from "@/components/WorkoutBuilderControls";
import { K2FBrand } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { NutritionPlanEditor } from "@/components/nutrition/NutritionPlanEditor";
import { useClientNutrition } from "@/nutrition/nutritionStore";
import { nutrients, nutrientLabels } from "@/utils/nutrition";
import { workoutLibrary } from "@/workouts/workoutLibraryStore";
import { colors, layout, radii, spacing, typography } from "@/theme";

export default function ClientNutrition() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  return <ClientNutritionContent key={clientId} clientId={clientId} />;
}

function ClientNutritionContent({ clientId }: { clientId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clients, loadStatus } = useCoachClientsState();
  const client = clients.find((item) => item.id === clientId);
  const data = useClientNutrition(clientId);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [preview, setPreview] = useState<"ready" | "opening" | "error">("ready");
  const pending = useRef(false);
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  async function openClientPreview() {
    if (pending.current) return;
    pending.current = true; setPreview("opening");
    try {
      await workoutLibrary.setPreviewClient(clientId);
      if (active.current) { setPreview("ready"); router.push("/client/home/nutrition"); }
    } catch { if (active.current) setPreview("error"); }
    finally { pending.current = false; }
  }
  return <ThemedBackground>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg }]} keyboardShouldPersistTaps="handled">
      <BuilderButton label="Back to client profile" secondary onPress={() => router.replace({ pathname: "/coach-client/[clientId]", params: { clientId } })} />
      <K2FBrand coach />
      <Text accessibilityRole="header" style={styles.title}>{client ? `Nutrition for ${client.name}` : "Client unavailable"}</Text>
      <Text style={styles.muted}>Shared demo plan · changes stay in this app session.</Text>
      {loadStatus !== "ready" || !client || !data ? <Text style={styles.body}>Nutrition is unavailable for this demo client.</Text>
        : editing ? <NutritionPlanEditor clientId={clientId} plan={data.plan} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); setFeedback(`Nutrition plan saved for ${client.name}.`); }} /> : <>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.heading}>Currently assigned daily targets</Text>
            {nutrients.map((key) => <Text key={key} style={styles.body}>{nutrientLabels[key].label}: {data.plan.targets[key] === null
              ? "Not assigned" : `${data.plan.targets[key]} ${nutrientLabels[key].unit}`}</Text>)}
            <Text style={styles.heading}>Coach nutrition tips</Text>
            <Text style={styles.body}>{data.plan.tip || "No coach tips for this plan yet."}</Text>
            <BuilderButton label="Edit targets and tips" onPress={() => { setEditing(true); setFeedback(""); }} />
          </View>
          {!!feedback && <Text accessibilityLiveRegion="polite" style={styles.body}>{feedback}</Text>}
          <BuilderButton label={preview === "opening" ? "Opening client preview…" : `Preview nutrition as ${client.name}`}
            disabled={preview === "opening"} secondary onPress={() => { void openClientPreview(); }} />
          {preview === "error" && <Text accessibilityRole="alert" style={styles.body}>The client preview could not be opened. Try again.</Text>}
        </>}
    </ScrollView>
  </ThemedBackground>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  card: { backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md, borderRadius: radii.card },
  title: { color: colors.text, fontSize: typography.title, fontWeight: "400" },
  heading: { color: colors.text, fontSize: typography.body, fontWeight: "600" },
  body: { color: colors.text, fontSize: typography.body },
  muted: { color: colors.textMuted, fontSize: typography.label },
});
