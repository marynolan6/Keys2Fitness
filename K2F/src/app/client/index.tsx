import { Text, View, StyleSheet } from "react-native";

export default function ClientHome() {
  return (
    <View style={styles.container}>
      <Text>client</Text>
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
