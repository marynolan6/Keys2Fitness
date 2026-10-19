import { colors, radii, spacing, typography } from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// Create an exercise object
type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: string;
    completed: boolean;
};

// Just a static set of exercises for our initial layout of the workout screen
const initialExercises: Exercise[] = [
    {
        id: "bench-press",
        name: "Bench Press",
        sets: 3,
        reps: 8,
        weight: "135 lb",
        completed: true,
    },
    {
        id: "incline-bench-press",
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: 10,
        weight: "40 lb",
        completed: true,
    },
    {
        id: "seated-cable-row",
        name: "Seated Cable Row",
        sets: 3,
        reps: 10,
        weight: "100 lb",
        completed: false,
    },
    {
        id: "hammer-curl",
        name: "Hammer Curl",
        sets: 3,
        reps: 10,
        weight: "25 lb",
        completed: false,
    },
];

const workoutNotes =
    "Focus on controlled movement and rest for 90 seconds between sets.";

export default function WorkoutDetails() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const [exercises, setExercises] = useState(initialExercises);
    const [showNotes, setShowNotes] = useState(false);

    const completedCount = exercises.filter((exercise) => exercise.completed).length;
    const progress = Math.round((completedCount / exercises.length) * 100);

    const router = useRouter();

    function toggleExercise(id: string) {
        setExercises((current) =>
            current.map((exercise) =>
                exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise,
            ),
        );
    }

return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>KEYS2FITNESS</Text>
        <Text style={styles.screenNumber}>03</Text>
        <Text style={styles.title}>Today&apos;s Workout</Text>
        <View style={styles.subtitleRow}>
          <Text style={[styles.subtitle, styles.subtitleText]}>
            Upper Body Strength · Week 5, Day 3
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showNotes }}
            onPress={() => setShowNotes((visible) => !visible)}
            style={styles.notesToggle}
          >
            <Text style={styles.notesToggleText}>
              {showNotes ? "Hide notes" : "Notes"}
            </Text>
          </Pressable>
        </View>

        {showNotes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Workout notes</Text>
            <Text style={styles.notesText}>{workoutNotes}</Text>
          </View>
        )}

        <View style={styles.progressCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Workout progress</Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.rowBetween}>
              <View style={styles.exerciseText}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.prescription}>
                  {exercise.sets} sets × {exercise.reps} reps · {exercise.weight}
                </Text>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: exercise.completed }}
                onPress={() => toggleExercise(exercise.id)}
                style={[
                  styles.checkbox,
                  exercise.completed && styles.checkboxCompleted,
                ]}
              >
                {exercise.completed && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            </View>

            <View style={styles.buttonRow}>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>+ Add Set</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>− Remove Set</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.push({
                  pathname:
                    "/client/home/workout/[workoutId]/exercise/[exerciseId]",
                  params: {
                    workoutId: String(workoutId),
                    exerciseId: exercise.id,
                    name: exercise.name,
                    sets: String(exercise.sets),
                    reps: String(exercise.reps),
                    weight: exercise.weight,
                  },
                })
              }
            >
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </Pressable>
          </View>
        ))}


        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>+ Add Exercise</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>− Remove Exercise</Text>
          </Pressable>
        </View>

        <Pressable style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </Pressable>

        <Text style={styles.debugText}>Workout: {workoutId}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
  },
  brand: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  screenNumber: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
    position: "absolute",
    right: 24,
    top: 24,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
    marginTop: 26,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  subtitleText: {
    flex: 1,
    marginTop: 0,
  },
  notesToggle: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesToggleText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  notesTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  notesText: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  progressText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  progressTrack: {
    backgroundColor: colors.progressTrack,
    borderRadius: radii.control,
    height: 14,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    height: "100%",
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  exerciseText: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseName: {
    color: colors.text, 
    fontSize: typography.heading,
    fontWeight: "300",
  },
  prescription: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 3,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    flex: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    textAlign: "center",
  },
  finishButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 62,
  },
  finishButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
  debugText: {
    color: colors.primaryDark,
    fontSize: 12,
    marginTop: 18,
    textAlign: "center",
  },
});
