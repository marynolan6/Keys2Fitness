
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";

const workout = {
  name: "Upper Body Strength",
  instructions:
    "Focus on proper form. Rest 60–90 seconds between sets.",
  exercises: [
    { id: "1", name: "Bench Press", sets: 3, reps: 10, weight: "65 lb" },
    { id: "2", name: "Shoulder Press", sets: 3, reps: 12, weight: "25 lb" },
    { id: "3", name: "Dumbbell Rows", sets: 3, reps: 10, weight: "30 lb" },
    { id: "4", name: "Bicep Curls", sets: 3, reps: 12, weight: "15 lb" },
  ],
};

export default function WorkoutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.brand}>KEYS2FITNESS</Text>
      <Text style={styles.title}>Today&apos;s Workout</Text>

      <View style={styles.card}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.subtitle}>
          {workout.exercises.length} exercises
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Coach Instructions</Text>
        <Text style={styles.instructions}>
          {workout.instructions}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Assigned Exercises</Text>

      {workout.exercises.map((exercise) => (
        <View key={exercise.id} style={styles.card}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDetails}>
            {exercise.sets} sets × {exercise.reps} reps
          </Text>
          <Text style={styles.exerciseDetails}>
            Weight: {exercise.weight}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DCEAF0",
    padding: 20,
  },
  brand: {
    color: "#287BA7",
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    color: "#172936",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
  },
  workoutName: {
    fontSize: 24,
    color: "#172936",
    marginBottom: 8,
  },
  subtitle: {
    color: "#607987",
  },
  sectionTitle: {
    fontSize: 20,
    color: "#172936",
    fontWeight: "600",
    marginBottom: 12,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 23,
    color: "#405766",
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  exerciseDetails: {
    fontSize: 15,
    color: "#607987",
    marginBottom: 4,
  },
});
