import { Text, View, StyleSheet } from "react-native";

export default function Messages() {
  return (
    <View style={styles.container}>
      <Text>client messages</Text>
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