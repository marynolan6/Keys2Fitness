// K2F-240: Coach can view workout information for a selected client
import { router, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Use the existing Keys2Fitness theme for consistent styling
import { colors, radii, spacing, typography, layout } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";

// K2F-240: Coach can view progress information for a selected client
export default function ClientProgress() {

  // Read the client ID passed through the navigation route
    // Read the client ID and where the coach came from
    const { clientId, from } = useLocalSearchParams<{
    clientId: string;
    from?: string;
    }>();

  return (
    <ThemedBackground>
    {/* Allows the coach to scroll on smaller mobile screens */}
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >

      {/* Back button returns to the individual client profile or the previous screen */}
      <TouchableOpacity
        onPress={() => {
        // Return to check-ins if the coach opened progress from a check-in
        if (from === "checkins") {
            router.replace("/coach-checkins");
        } else {
            // Otherwise return to the selected client's profile
            router.replace({
            pathname: "/coach-client/[clientId]",
            params: { clientId: String(clientId) },
            });
        }
        }}
        >

        <Text style={styles.back}>
        {from === "checkins"
            ? "← Back to Check-ins"
            : "← Back to Client Profile"}
        </Text>
        
      </TouchableOpacity>

      {/* Main heading of the progress screen */}
      <Text style={styles.heading}>Client Progress</Text>

      {/* Displays the ID of the selected client */}
      <Text style={styles.subtitle}>Client ID: {clientId}</Text>

      {/* Card displaying the client's workout completion */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Workout Completion</Text>

        {/* Sample progress information */}
        <Text style={styles.description}>
          8 out of 10 scheduled workouts
        </Text>

        {/* Background of the progress bar */}
        <View style={styles.progressTrack}>

          {/* Filled portion represents 80% completion */}
          <View style={styles.progressFill} />

        </View>
      </View>

      {/* Card displaying the client's current fitness goal */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fitness Goal</Text>

        {/* Sample goal information until real client data is added */}
        <Text style={styles.description}>
          Build muscle, improve strength, and increase endurance
        </Text>
      </View>

    </ScrollView>
    </ThemedBackground>
 );
}

// Styles control the appearance of the progress screen
const styles = StyleSheet.create({

  // Transparent background allows the blue gradient to show
  screen: {
    flex: 1,
  },

  // Center the content and keep cards mobile-friendly
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Back button text styling
  back: {
    color: colors.primaryDark,
    fontSize: typography.body,
  },

  // Small Keys2Fitness branding above the page title
  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.sm,
  },

  // Main "Client Progress" heading
  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
  },

  // Selected client's ID text
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  // White rounded cards containing progress information
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Headings inside the progress cards
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  // Text describing progress and fitness goals
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  // Light-blue background of the workout progress bar
  progressTrack: {
    height: 12,
    backgroundColor: colors.progressTrack,
    borderRadius: radii.control,
    overflow: "hidden",
  },

  // Blue filled portion showing 80% completion
  progressFill: {
    width: "80%",
    height: "100%",
    backgroundColor: colors.primary,
  },

});