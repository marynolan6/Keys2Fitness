import { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from "react-native";

import { colors, layout, radii, spacing, typography } from "@/theme";

type ConversationSearchBarProps = {
  query: string;
  onChangeQuery: (query: string) => void;
  // Closes search and clears the query.
  onCancel: () => void;
};

export function ConversationSearchBar({ query, onChangeQuery, onCancel }: ConversationSearchBarProps) {
  const inputRef = useRef<TextInputInstance>(null);

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <SearchIcon size={16} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search this conversation"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
          accessibilityLabel="Search messages with your coach"
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={spacing.sm}
            onPress={() => {
              onChangeQuery("");
              inputRef.current?.focus();
            }}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close search"
        onPress={onCancel}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// Magnifying glass drawn with views so it needs no icon font.
export function SearchIcon({ size = 18, color = colors.primaryDark }: { size?: number; color?: string }) {
  const ring = size * 0.7;
  const stroke = Math.max(2, Math.round(size / 8));
  return (
    <View style={{ height: size, width: size }} accessible={false}>
      <View
        style={{
          borderColor: color,
          borderRadius: ring / 2,
          borderWidth: stroke,
          height: ring,
          width: ring,
        }}
      />
      <View
        style={{
          backgroundColor: color,
          borderRadius: stroke / 2,
          height: stroke,
          left: ring * 0.75,
          position: "absolute",
          top: ring * 0.9,
          transform: [{ rotate: "45deg" }],
          width: size * 0.4,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  field: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  cancelButton: {
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
});
