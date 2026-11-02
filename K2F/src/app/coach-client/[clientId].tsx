// K2F-238: Coach can view an individual client profile
import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import the team's existing theme settings
import { colors, radii, spacing, typography, layout } from "@/theme";

// Import the same gradient background used in Keys2Fitness
import { ThemedBackground } from "@/components/ThemedBackground";

// K2F-153: Get the selected client's information
import { getClientById } from "@/clients/mockClients";
import { ClientAvatar } from "@/components/ClientAvatar";

// K2F-238: Create an individual client profile screen for the coach
export default function ClientProfile() {

  // Get the selected client ID from the URL
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  // K2F-153: Find the selected client
  const client = getClientById(clientId);

  // K2F-153 / K2F-237: Go back to the screen that opened this profile
  // (client list or dashboard), or the client list if there is no history
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/coach/client_list");
    }
  };

  // K2F-153: Shown if the client ID doesn't match a client
  if (!client) {
    return (
      <ThemedBackground>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.card, styles.profileCard]}>
            <Text style={styles.sectionTitle}>Client not found</Text>
            <Text style={styles.description}>
              No client matches ID {clientId ?? "(none)"}.
            </Text>
          </View>
        </ScrollView>
      </ThemedBackground>
    );
  }

  // K2F-239: Sample workout progress information
  // These values will eventually come from the selected client's data
  const completedWorkouts = 8;
  const totalWorkouts = 10;
  const progressPercent = (completedWorkouts / totalWorkouts) * 100;

  return (
    // Use the same blue gradient as the workout screen
    <ThemedBackground>

      {/* ScrollView allows the screen to scroll on smaller phones */}
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
      >

      {/* Back button returns to the previous screen (client list or dashboard) */}
      <TouchableOpacity
         style={styles.backButton}
         onPress={goBack}
         accessibilityRole="button"
         accessibilityLabel="Go back"
      >
       <Text style={styles.back}>← Back</Text>
       </TouchableOpacity>

        {/* Keys2Fitness branding */}
        <Text style={styles.brand}>KEYS2FITNESS</Text>

        {/* Page title */}
        <Text style={styles.heading}>Client Profile</Text>

        {/* K2F-238: Client information card */}
        <View style={[styles.card, styles.profileCard]}>

          {/* Circular avatar with the client's initial */}
          <ClientAvatar name={client.name} size={64} />

          {/* K2F-153: Selected client's name */}
          <Text style={styles.name}>{client.name}</Text>

          {/* Displays the ID of the selected client */}
          <Text style={styles.detail}>Client ID: {clientId}</Text>
        </View>

        {/* K2F-239: Current fitness plan */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Fitness Plan</Text>

          <Text style={styles.description}>
            {client.plan}
          </Text>
        </View>

        {/* K2F-239: Client fitness goals */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fitness Goals</Text>

          <Text style={styles.description}>
            {client.goal}
          </Text>
        </View>

        {/* K2F-239: Recent workout progress */}
        <View style={styles.card}>

          {/* Title and completion percentage */}
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Recent Progress</Text>
            <Text style={styles.progressPercent}>
              {progressPercent}%
            </Text>
          </View>

          {/* Progress bar background */}
          <View style={styles.progressTrack}>

            {/* Blue fill represents completed workouts */}
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>

          {/* Workout completion summary */}
          <Text style={styles.description}>
            Completed {completedWorkouts} out of {totalWorkouts} scheduled workouts
          </Text>
        </View>

        {/* K2F-240: Navigation to related client information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Client Details</Text>

          {/* Button for viewing the selected client's workouts */}
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => {
              // Pass the selected client's ID to the workouts screen
              router.push({
                pathname: "/coach-client/[clientId]/workouts",
                params: { clientId: String(clientId) },
              });
            }}
          >
            <Text style={styles.navigationButtonText}>
              View Workouts →
            </Text>
          </TouchableOpacity>

          {/* Button for viewing the selected client's progress */}
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={() => {
              // Pass the same client ID to the progress screen
              router.push({
                pathname: "/coach-client/[clientId]/progress",
                params: { clientId: String(clientId) },
              });
            }}
          >
            <Text style={styles.navigationButtonText}>
              View Progress →
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ThemedBackground>
  );
}

// Styles control the appearance of the profile screen
const styles = StyleSheet.create({
  // Transparent screen allows the gradient to show
  screen: {
    flex: 1,
  },

  // Limit the content width for mobile and web
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Make the Back button easy to tap
  backButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
  },

  back: {
    color: colors.primaryDark,
    fontSize: typography.body,
  },

  // Small Keys2Fitness branding above the title
  brand: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.sm,
  },

  // Large, lightweight heading matching the workout screen
  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
    marginBottom: spacing.sm,
  },

  // Rounded white cards used throughout the app
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Center only the client's identity information
  profileCard: {
    alignItems: "center",
  },

  // Client's name
  name: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  // Client ID below the name
  detail: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  // Headings inside the white cards
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  // Fitness plan, goals, and progress descriptions
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },

  // Place the progress title and percentage side by side
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  progressPercent: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },

  // Light-blue background of the progress bar
  progressTrack: {
    height: 12,
    backgroundColor: colors.progressTrack,
    borderRadius: radii.control,
    overflow: "hidden",
  },

  // Filled blue portion of the progress bar
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.control,
  },

  // Light-blue navigation buttons matching the workout screen
  navigationButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    padding: spacing.md,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

  navigationButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});