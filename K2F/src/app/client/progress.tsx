import { Text, View, StyleSheet } from "react-native";

export default function Progress() {
  return (
    <View style={styles.container}>
      <Text>client progress</Text>
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