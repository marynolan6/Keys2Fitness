
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

// Coach messages widget
import { NewCoachMessagesWidget } from "@/components/RecentMessageWidgetCoach";
import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";

// Shared Keys2Fitness theme
import { colors, radii, spacing, typography } from "@/theme";

// Coach Dashboard screen
export default function CoachHome() {
  const router = useRouter();

  return (
    // Keep the gradient background from main
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Dashboard heading */}
        <Text style={styles.title}>Coach Dashboard</Text>

        {/* Display recent coach messages */}
        <NewCoachMessagesWidget
          messages={coachMessages}
          onPress={() => router.push("/coach/messages")}
        />

        {/* K2F-264: View recent client check-ins */}
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => {
            // Open the recent client check-ins screen
            router.push("/coach-checkins");
          }}
        >
          <Text style={styles.checkInButtonText}>
            View Recent Check-ins →
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </ThemedBackground>
  );
}

// Styles for the Coach Dashboard
const styles = StyleSheet.create({
  // Dashboard spacing
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Dashboard title from main
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },

  // K2F-264: Check-in navigation button
  checkInButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },

  // Text inside the check-in button
  checkInButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});