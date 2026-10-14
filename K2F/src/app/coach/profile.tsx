import { Text, View, StyleSheet } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text>coach profile</Text>
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