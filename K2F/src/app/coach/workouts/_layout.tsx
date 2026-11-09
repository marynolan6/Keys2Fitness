import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function CoachWorkoutsLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.primaryDark, headerShadowVisible: false }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="editor" options={{ title: "Workout builder" }} />
  </Stack>;
}
