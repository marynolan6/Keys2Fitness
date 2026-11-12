import { Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { spacing } from "@/theme";

export function WorkoutAssignmentConfirmation({ title, summary, clients, saving, error, onConfirm, onCancel }: {
  title: string; summary: string; clients: readonly { id: string; name: string }[];
  saving: boolean; error?: string; onConfirm: () => void; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType="fade" onRequestClose={() => { if (!saving) onCancel(); }}>
    <View style={[styles.overlay, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View accessibilityViewIsModal style={styles.modal}>
        <ScrollView contentContainerStyle={styles.field}>
          <Text accessibilityRole="header" style={styles.heading}>Confirm workout assignment?</Text>
          <Text style={styles.label}>Workout: {title}</Text>
          <Text style={styles.muted}>{summary}</Text>
          <Text style={styles.label}>Assign to {clients.length === 1 ? "this client" : "these clients"}:</Text>
          {clients.map((client) => <Text key={client.id} style={styles.label}>{client.name}</Text>)}
          <Text style={styles.muted}>Each client will receive a fresh workout copy. Existing assignments and recorded progress will stay available. Saved on this device only.</Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <BuilderButton label={saving ? "Assigning…" : "Confirm assignment"} disabled={saving} onPress={onConfirm} />
        <BuilderButton label="Cancel assignment" secondary disabled={saving} onPress={onCancel} />
      </View>
    </View>
  </Modal>;
}
