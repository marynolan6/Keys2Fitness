import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function HomeLayout() {
    return (<Stack screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primaryDark,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
    }}>
        <Stack.Screen
            name="index"
            options={{ headerShown: false }}
        />
        <Stack.Screen name="workout/[workoutId]" options={{ title: "Workout" }} />
        <Stack.Screen name="workout/[workoutId]/exercise/[exerciseId]" options={{ title: "Exercise" }} />
    </Stack>
    );
}
