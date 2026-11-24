import { Tabs } from "expo-router";
import { AppTabBar } from "@/components/AppTabBar";

export default function ClientLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} role="client" />}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      {/* AppTabBar omits these routes from its four visible tabs. */}
      <Tabs.Screen name="workout" options={{ title: "Workouts" }} />
      <Tabs.Screen name="history" options={{ title: "Workout history" }} />
    </Tabs>
  );
}
