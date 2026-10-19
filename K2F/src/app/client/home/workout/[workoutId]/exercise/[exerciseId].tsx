import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";


export default function ExerciseDetails() {
  const router = useRouter();

  const { name, sets, reps, weight } = useLocalSearchParams<{
    name?: string;
    sets?: string;
    reps?: string;
    weight?: string;
  }>();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backButton}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>{name ?? "Exercise Details"}</Text>

      <Text style={styles.label}>Sets</Text>
      <Text style={styles.value}>{sets ?? "N/A"}</Text>

      <Text style={styles.label}>Reps</Text>
      <Text style={styles.value}>{reps ?? "N/A"}</Text>

      <Text style={styles.label}>Weight</Text>
      <Text style={styles.value}>{weight ?? "N/A"}</Text>

      <Text style={styles.label}>Instructions</Text>
      <Text style={styles.instructions}>
        Follow the exercise instructions provided by your coach.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 14,
  },
  backButton: {
    color: "blue",
    fontSize: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  value: {
    fontSize: 18,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
  },
});