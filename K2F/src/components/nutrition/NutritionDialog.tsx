import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { spacing } from "@/theme";

export function NutritionDialog({ title, children, onClose, closeLabel, primary, message }: PropsWithChildren<{
  title: string; onClose: () => void; closeLabel: string; message?: string; primary?: { label: string; onPress: () => void; danger?: boolean };
}>) {
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.overlay, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
      <View accessibilityViewIsModal style={styles.modal}>
        <Text accessibilityRole="header" style={[styles.heading, { flexShrink: 0 }]}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.field}>{children}</ScrollView>
        {message && <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text>}
        <View style={styles.actions}>
          {primary && <BuilderButton {...primary} style={{ flexGrow: 2 }} />}
          <BuilderButton label={closeLabel} secondary onPress={onClose} style={{ flexGrow: 1 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
