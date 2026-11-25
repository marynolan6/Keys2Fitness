import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="login" options={{ headerShown: false }} />
    <Stack.Screen name="signup" options={{ title: "Create account", headerBackButtonDisplayMode: "minimal" }} />
  </Stack>;
}
