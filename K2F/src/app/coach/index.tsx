// K2F-264: Coach can view recent client check-ins from the dashboard
import { router } from "expo-router";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// Use the team's existing Keys2Fitness theme
import { colors, radii, spacing, typography } from "@/theme";

// Coach Dashboard screen
export default function CoachHome() {
  return (
    <View style={styles.container}>

      {/* Dashboard heading */}
      <Text style={styles.title}>Coach Dashboard</Text>

      {/* K2F-264: Button to view recent client check-ins */}
      <TouchableOpacity
        style={styles.checkInButton}
        onPress={() => {
          // Navigate to the recent check-ins list
          router.push("/coach-checkins");
        }}
      >
        <Text style={styles.checkInButtonText}>
          View Recent Check-ins →
        </Text>
      </TouchableOpacity>

    </View>
  );
}

// Styles for the Coach Dashboard
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },

  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
    marginBottom: spacing.lg,
  },

  // Light-blue button matching the Keys2Fitness theme
  checkInButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },

  checkInButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
});