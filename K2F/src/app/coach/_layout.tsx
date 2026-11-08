import { Tabs } from "expo-router";
import { AppTabBar } from "@/components/AppTabBar";

export default function CoachLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} role="coach" />}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="client_list" options={{ title: "Client List" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      {/* AppTabBar filters these out visually; keep them navigable. */}
      <Tabs.Screen name="subscreens/preferences" options={{ title: "Preferences" }} />
      <Tabs.Screen name="subscreens/settings" options={{ title: "Account settings" }} />
    </Tabs>
  );
}
