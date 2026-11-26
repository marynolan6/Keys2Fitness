import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { K2FBrand } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { colors, layout, radii, spacing, textStyles, typography } from "@/theme";

export function AuthFormScreen({ children }: PropsWithChildren) {
  return <ThemedBackground variant="welcome">
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <K2FBrand variant="welcome" />
            <View style={styles.card}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </ThemedBackground>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  column: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg },
});

export const authFormStyles = StyleSheet.create({
  title: { ...textStyles.page, marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: typography.body, marginBottom: spacing.lg },
  label: { color: colors.text, fontSize: typography.label, fontWeight: "600", marginBottom: spacing.sm },
  input: { color: colors.text, backgroundColor: colors.background, borderColor: colors.controlBorder, borderWidth: 1,
    borderRadius: radii.control, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, marginBottom: spacing.md, fontSize: typography.body },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.label, marginBottom: spacing.md },
  successText: { color: colors.achieved, fontSize: typography.label, marginBottom: spacing.md },
  formError: { backgroundColor: colors.dangerMuted, borderRadius: radii.control, padding: spacing.md, marginBottom: spacing.md },
  formErrorText: { color: colors.danger, fontSize: typography.label, fontWeight: "600" },
  link: { minHeight: layout.minTouchTarget, justifyContent: "center", marginTop: spacing.sm },
  linkText: { color: colors.primaryDeep, fontSize: typography.label, textAlign: "center", textDecorationLine: "underline" },
});
