import { Text, View, StyleSheet } from "react-native";

export default function Client_List() {
  return (
    <View style={styles.container}>
      <Text>client list</Text>
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