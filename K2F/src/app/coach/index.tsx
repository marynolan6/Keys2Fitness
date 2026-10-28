import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";

import { NewCoachMessagesWidget } from "@/components/RecentMessageWidgetCoach";
import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";
import { colors, spacing, typography } from "@/theme";

export default function CoachHome() {
  const router = useRouter();

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Coach Dashboard</Text>

        <NewCoachMessagesWidget
          messages={coachMessages}
          onPress={() => router.push("/coach/messages")}
        />
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
});