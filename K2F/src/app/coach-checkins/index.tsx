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
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { coachCheckIns } from "@/checkins/coachCheckIns";
import { useSafeAreaInsets } from "react-native-safe-area-context";


// K2F-262: Coach-facing recent check-in list
export default function RecentCheckIns() {
  const insets = useSafeAreaInsets();
  return (
    <ThemedBackground>
      <FlatList
        // Show the newest check-ins first
        data={coachCheckIns}
        keyExtractor={(item) => item.id}

        // Keep the list centered on larger screens
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}

        // Header displayed above the list
        ListHeaderComponent={
          <View style={styles.header}>
            <K2FBrand coach />
            {/* Return to the coach dashboard */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/coach")}
            >
              <Text style={styles.backText}>← Back to Coach Home</Text>
            </TouchableOpacity>

            <PageTitle>Recent Check-ins</PageTitle>
            <Text style={styles.subtitle}>
             Review your clients&apos; latest updates
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
