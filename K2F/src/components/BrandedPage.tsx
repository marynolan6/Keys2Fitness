import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { layout, spacing } from "@/theme";

export function BrandedPage({ title, coach = false, underNativeHeader = false, children }: PropsWithChildren<{
  title: string; coach?: boolean; underNativeHeader?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  return <ThemedBackground>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: (underNativeHeader ? 0 : insets.top) + spacing.md }]}>
      <K2FBrand coach={coach} />
      <PageTitle>{title}</PageTitle>
      {children}
    </ScrollView>
  </ThemedBackground>;
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.lg, gap: spacing.md },
});
