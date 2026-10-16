import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

export default function WorkoutDetails() {
    const { workoutId } = useLocalSearchParams<{workoutId: string }>();

    return <Text>Workout: {workoutId}</Text>
}