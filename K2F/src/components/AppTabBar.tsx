import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ComponentProps, Fragment, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppQuickAccessMenu, type NavigationRole } from "@/components/AppQuickAccessMenu";
import { colors, isCompactLayout, layout, navigation, radii, spacing, typography } from "@/theme";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const clientTabIcons = {
  home: { ios: "house.fill", android: "home", web: "home" },
  progress: { ios: "chart.bar.fill", android: "bar_chart", web: "bar_chart" },
  messages: { ios: "message.fill", android: "chat", web: "chat" },
  profile: { ios: "person.fill", android: "person", web: "person" },
} as const;

const coachTabIcons = {
  index: clientTabIcons.home,
  client_list: { ios: "person.2.fill", android: "group", web: "group" },
  messages: clientTabIcons.messages,
  profile: clientTabIcons.profile,
} as const;

export function AppTabBar({ role, state, descriptors, emitter, navigateToTab }: TabBarProps & { role: NavigationRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const showLabels = !(width < layout.compactWidth && fontScale >= layout.largeFontScale);
  const tabIcons: Record<string, ComponentProps<typeof SymbolView>["name"]> =
    role === "client" ? clientTabIcons : coachTabIcons;
  const routes = state.routes.filter((route) => Object.hasOwn(tabIcons, route.name));
  const currentRoute = state.routes[state.index].name;
  const activeTab = role === "coach" && currentRoute.startsWith("subscreens/") ? "profile" : currentRoute;

  return (
    <View pointerEvents="box-none" style={styles.base}>
      <View pointerEvents="none" style={styles.cornerBackdrop} />
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm),
        paddingLeft: Math.max(insets.left, spacing.xs), paddingRight: Math.max(insets.right, spacing.xs) }]}>
        {routes.map((route, index) => {
          const selected = route.name === activeTab;
          const label = descriptors[route.key].options.title ?? route.name;
          const tint = selected ? colors.primaryDark : colors.textMuted;
          return (
            <Fragment key={route.key}>
              {index === 2 && <View style={styles.centerSlot} />}
              <Pressable accessibilityRole="tab" accessibilityLabel={label}
                accessibilityState={{ selected }}
                onPress={() => {
                  const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (!event.defaultPrevented) navigateToTab(route.key);
                }}
                onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
                <View style={[styles.iconPill, selected && styles.selected]}>
                  <SymbolView name={tabIcons[route.name]}
                    size={spacing.lg} tintColor={tint} />
                </View>
                {showLabels && <Text style={[styles.label, compact && styles.compactLabel, { color: tint }]}>{label}</Text>}
              </Pressable>
            </Fragment>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open quick access menu"
        accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(true)}
        style={({ pressed }) => [styles.add, pressed && styles.addPressed]}>
        <SymbolView name={{ ios: "plus", android: "add", web: "add" }}
          size={typography.title} tintColor={colors.surface} />
      </Pressable>
      <AppQuickAccessMenu role={role} visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlap the scene instead of reserving a solid strip above the white bar.
  base: { paddingTop: navigation.overlap, marginTop: -navigation.overlap },
  // Only fill behind the rounded white corners, never above the bar.
  cornerBackdrop: { position: "absolute", top: navigation.overlap, bottom: 0, left: 0, right: 0,
    backgroundColor: colors.backgroundEnd },
  bar: { flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.surface,
    borderTopLeftRadius: navigation.cornerRadius, borderTopRightRadius: navigation.cornerRadius,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingTop: spacing.sm },
  tab: { flex: 1, minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget,
    alignItems: "center", paddingVertical: spacing.xs, gap: spacing.xs, borderRadius: radii.button },
  iconPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.card },
  selected: { backgroundColor: colors.surfaceMuted },
  label: { fontSize: typography.label, textAlign: "center", flexShrink: 1 },
  compactLabel: { fontSize: typography.caption },
  pressed: { backgroundColor: colors.surfaceMuted },
  centerSlot: { width: navigation.centerSlotWidth, alignItems: "center" },
  add: { width: navigation.actionSize, height: navigation.actionSize,
    borderRadius: navigation.actionRadius, backgroundColor: navigation.actionColor,
    position: "absolute", top: 0, alignSelf: "center",
    alignItems: "center", justifyContent: "center",
    elevation: navigation.actionElevation, shadowColor: colors.text,
    shadowOpacity: navigation.actionShadowOpacity, shadowRadius: spacing.xs,
    shadowOffset: { width: 0, height: spacing.xs } },
  addPressed: { backgroundColor: navigation.actionPressedColor },
});
