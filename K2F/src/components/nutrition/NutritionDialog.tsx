import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuilderButton, builderStyles as styles } from "@/components/WorkoutBuilderControls";
import { spacing } from "@/theme";

export function NutritionDialog({ title, children, onClose, closeLabel }: PropsWithChildren<{
  title: string; onClose: () => void; closeLabel: string;
}>) {
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.overlay, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
      <View accessibilityViewIsModal style={styles.modal}>
        <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.field}>{children}</ScrollView>
        <BuilderButton label={closeLabel} secondary onPress={onClose} />
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
