import { router } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Reuse the team's existing design system
import {
  colors,
  layout,
  radii,
  spacing,
  typography,
} from "@/theme";

// Reuse the existing Keys2Fitness gradient
import { ThemedBackground } from "@/components/ThemedBackground";


// K2F-262 / K2F-263: Sample check-in data
// Each record identifies the client and includes progress information
// Optional fields may be missing if the client did not submit them
const recentCheckIns = [
  {
    id: "1",
    clientId: "1",
    clientName: "Spencer",
    date: "October 27, 2026",
    weight: 175,
    workoutsCompleted: 4,
    workoutsScheduled: 4,
    notes: "Feeling stronger and completing all my workouts.",
  },
  {
    id: "2",
    clientId: "2",
    clientName: "Alex",
    date: "October 25, 2026",
    weight: 160,
    workoutsCompleted: 3,
    workoutsScheduled: 4,
    notes: null,
  },
  {
    id: "3",
    clientId: "1",
    clientName: "Spencer",
    date: "October 20, 2026",
    weight: 177,
    workoutsCompleted: 3,
    workoutsScheduled: 4,
    notes: "Working on staying consistent.",
  },
];


// K2F-262: Coach-facing recent check-in list
// This list displays sample check-in records with the client's name, date, weight, workout completion, and notes.
export default function RecentCheckIns() {
  return (
    <ThemedBackground>
    
      // displays the sample check-in data in a scrollable list
      <FlatList
        // Show the newest check-ins first
        data={recentCheckIns}
        keyExtractor={(item) => item.id}

        // Keep the list centered on larger screens
        contentContainerStyle={styles.content}

        // Header displayed above the list
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Return to the coach dashboard */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/coach")}
            >
              <Text style={styles.backText}>← Back to Coach Home</Text>
            </TouchableOpacity>

            <Text style={styles.brand}>KEYS2FITNESS</Text>
            <Text style={styles.heading}>Recent Check-ins</Text>
            <Text style={styles.subtitle}>
              Review your clients' latest updates
            </Text>
          </View>
        }

        renderItem={({ item, index }) => (
            <TouchableOpacity
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.clientName}'s progress`}
                onPress={() => {
                // K2F-264: Open the selected client's progress
                // Pass their ID so the correct client context is used
                router.push({
                    pathname: "/coach-client/[clientId]/progress",
                    params: {
                    clientId: item.clientId,
                    from: "checkins",
                    },
                });
                }}
            >

            {/* K2F-262: Identify which client submitted the check-in */}
            <Text style={styles.clientName}>
            {item.clientName}
            </Text>

            {/* K2F-263: Show the date and distinguish newer records */}
            <Text style={styles.detail}>
            Check-in date: {item.date}
            </Text>

            <Text style={styles.checkInLabel}>
            {index === 0 ? "Most Recent Check-in" : "Previous Check-in"}
            </Text>

            {/* K2F-263: Display the recorded weight */}
            <Text style={styles.detail}>
            Weight: {item.weight != null ? `${item.weight} lb` : "Not provided"}
            </Text>

            {/* Display completed workouts when both values are available */}
            <Text style={styles.detail}>
            Workouts:{" "}
            {item.workoutsCompleted != null &&
            item.workoutsScheduled != null
                ? `${item.workoutsCompleted} of ${item.workoutsScheduled} completed`
                : "Not provided"}
            </Text>

            {/* Display optional client notes without causing errors */}
            <Text style={styles.detail}>
            Notes: {item.notes ?? "No notes submitted"}
            </Text>

            </TouchableOpacity>
        )}

        // Show this message when no check-ins exist
        ListEmptyComponent={
          <Text style={styles.subtitle}>
            No recent client check-ins.
          </Text>
        }
      />
    </ThemedBackground>
  );
}

// Styles match the existing Keys2Fitness app
const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },

  backButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
  },

  backText: {
    color: colors.primaryDark,
    fontSize: typography.body,
  },

  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },

  clientName: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  detail: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  
    // K2F-263: Label distinguishing recent and previous check-ins
    checkInLabel: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radii.control,
    alignSelf: "flex-start",
    },

});
