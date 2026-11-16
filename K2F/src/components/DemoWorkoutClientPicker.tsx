import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachClientsState } from "@/clients/clientStore";
import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { spacing } from "@/theme";
import { useWorkoutLibraryState } from "@/workouts/workoutLibraryStore";
import { useWorkoutPreview } from "@/hooks/useWorkoutPreview";

export function DemoWorkoutClientPicker() {
  const state = useWorkoutLibraryState();
  const { clients, loadStatus } = useCoachClientsState();
  const insets = useSafeAreaInsets();
  const preview = useWorkoutPreview();
  const { busy } = preview;
  if (state.status !== "ready" || !state.data.assignments.length) return null;
  const selected = clients.find((client) => client.id === state.data.previewClientId);
  return <View style={styles.card}>
    <Text style={styles.muted}>Demo workout client: {selected?.name ?? state.data.previewClientId}</Text>
    <BuilderButton label="Change demo workout client" secondary onPress={() => preview.dispatch({ type: "open" })} />
    <Modal visible={preview.visible} transparent animationType="fade" onRequestClose={() => preview.dispatch({ type: "close" })}>
      <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View accessibilityViewIsModal style={styles.modal}>
          <Text style={styles.heading}>Demo workout preview</Text>
          <Text style={styles.muted}>This previews the client&apos;s greeting and workout assignments. It does not switch your signed-in account.</Text>
          <ScrollView contentContainerStyle={styles.field}>
            {loadStatus !== "ready" && <Text style={styles.error}>Demo clients are not available right now.</Text>}
            {loadStatus === "ready" && clients.map((client) => <Pressable key={client.id} accessibilityRole="radio"
              accessibilityLabel={`Preview workouts for ${client.name}`} accessibilityState={{ selected: client.id === state.data.previewClientId, disabled: busy }}
              disabled={busy} onPress={() => { void preview.choose(client.id); }} style={({ pressed }) => [styles.catalogRow, pressed && styles.pressed]}>
              <Text style={styles.label}>{client.name}</Text>
            </Pressable>)}
          </ScrollView>
          {preview.state.status === "error" && <Text accessibilityRole="alert" style={styles.error}>{preview.state.message}</Text>}
          <BuilderButton label="Close demo client picker" secondary disabled={busy} onPress={() => preview.dispatch({ type: "close" })} />
        </View>
      </View>
    </Modal>
  </View>;
}
