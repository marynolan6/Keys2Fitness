import { Text, View, StyleSheet } from "react-native";

export default function CoachHome() {
  return (
    <View style={styles.container}>
      <Text>coach</Text>
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
