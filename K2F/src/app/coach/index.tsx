import { ScrollView, StyleSheet, Text, View } from "react-native";

import { NewCoachMessagesWidget } from "@/components/RecentMessageWidgetCoach";
import { ThemedBackground } from "@/components/ThemedBackground";
import { coachMessages } from "@/messages/mockMessagesCoach";

export default function CoachHome() {
  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Coach Dashboard</Text>

        <NewCoachMessagesWidget messages={coachMessages} />
      </ScrollView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
});