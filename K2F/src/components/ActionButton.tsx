import { useState } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { actionColors, colors, layout, radii, spacing, textStyles } from "@/theme";

type Props = {
  label: string; onPress: () => void; accessibilityLabel?: string; disabled?: boolean;
  secondary?: boolean; danger?: boolean; selected?: boolean; expanded?: boolean; style?: StyleProp<ViewStyle>;
};

export function ActionButton({ label, onPress, accessibilityLabel = label, disabled = false, secondary, danger, selected, expanded, style }: Props) {
  const [focused, setFocused] = useState(false);
  const tone = disabled ? actionColors.disabled : danger ? actionColors.danger
    : secondary || selected !== undefined ? actionColors.secondary : actionColors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled, selected, expanded }} disabled={disabled} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, { backgroundColor: pressed ? tone.pressed : tone.fill },
      selected && styles.selected, focused && !disabled && styles.focus, style]}>
    <Text style={[styles.label, { color: tone.ink }]}>{selected ? `✓ ${label}` : label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", borderRadius: radii.button },
  selected: { borderColor: colors.primaryDeep, borderWidth: 1 },
  focus: { outlineColor: colors.text, outlineWidth: 2, outlineOffset: 2, outlineStyle: "solid" },
  label: { ...textStyles.label, textAlign: "center", flexShrink: 1 },
});
