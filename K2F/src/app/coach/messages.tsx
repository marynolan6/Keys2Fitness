import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { conversationMessages } from "@/messages/mockMessagesClient";
import { colors, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";

export default function Messages() {
  return (
    <View style={styles.container}>
      <Text>coach messages</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});