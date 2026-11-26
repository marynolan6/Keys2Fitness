import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";

import { spacing, textStyles } from "@/theme";
import { dashboardPeriod } from "@/utils/dashboardGreeting";
import { PageTitle } from "@/components/K2FBrand";

export function DashboardGreeting({ name }: { name: string }) {
  // Static web exports don't know the visitor's local time or date.
  const [clock, setClock] = useState({ greeting: "Welcome", date: "" });
  useFocusEffect(useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const now = new Date();
      const { greeting, next } = dashboardPeriod(now);
      setClock({ greeting, date: now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) });
      timer = setTimeout(refresh, next.getTime() - now.getTime());
    }
    refresh();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []));

  return <View style={styles.group}>
    <PageTitle style={textStyles.section}>{clock.greeting}, {name}</PageTitle>
    {clock.date ? <Text style={styles.date}>{clock.date}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  date: textStyles.meta,
});
