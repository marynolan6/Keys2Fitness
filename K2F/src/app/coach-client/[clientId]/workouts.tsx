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

// K2F-240: Coach can view workout information for a selected client
export default function ClientWorkouts() {

  // Read the client ID passed from the individual client profile
  // Example: /coach-client/1/workouts means clientId is "1"
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  return (
    <ThemedBackground>
    {/* Allows the page to scroll on smaller phone screens */}
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >

      {/* Back button returns to the previous screen (client profile) */}
      <TouchableOpacity onPress={() =>
            router.replace({
            pathname: "/coach-client/[clientId]",
            params: { clientId: String(clientId) },
            })
        }
    >
      <Text style={styles.back}>← Back to Client Profile</Text>
      </TouchableOpacity>

      {/* Keys2Fitness matching the Client Profile */}
      <Text style={styles.brand}>KEYS2FITNESS</Text>

      {/* Title of the workout details screen */}
      <Text style={styles.heading}>Client Workouts</Text>

      {/* Shows which client's workouts are being viewed */}
      <Text style={styles.subtitle}>Client ID: {clientId}</Text>

      {/* Card displaying the client's current workout plan */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Current Workout Plan</Text>

        {/* Sample workout information until real data is connected */}
        <Text style={styles.description}>
          Strength Training — 4 days per week
        </Text>
      </View>

      {/* Card displaying a summary of completed workouts */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Workout Summary</Text>

        {/* Sample completion information */}
        <Text style={styles.description}>
          8 of 10 scheduled workouts completed
        </Text>
      </View>
      
    </ScrollView>
    </ThemedBackground>
  );
}

// Styles control the appearance of the workout screen
const styles = StyleSheet.create({

  // Transparent background allows the blue gradient to show
  screen: {
    flex: 1,
  },

  // Centers content and keeps cards mobile-friendly
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Styling for the Back button text
  back: {
    color: colors.primaryDark,
    fontSize: typography.body,
  },

  // Small Keys2Fitness branding
  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.sm,
  },

  // Lightweight heading matching the Client Profile
  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
  },

  // Styling for the selected client's ID
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  // White rounded cards containing workout information
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },

  // Headings inside the workout cards
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  // Smaller text describing the workout plan and summary
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
});