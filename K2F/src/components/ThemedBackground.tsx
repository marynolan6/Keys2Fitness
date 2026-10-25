import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";

import { colors, gradients } from "@/theme";

// Wrap scrolling content so the gradient stays fixed to the screen viewport.
export function ThemedBackground({ children }: PropsWithChildren) {
  return (
    <LinearGradient {...gradients.screen} style={styles.screen}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
