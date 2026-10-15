import { Button, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Dashboard</Text>

      <View style={styles.button}>
        <Button
          title="Coach Dashboard"
          onPress={() => router.push("/coach")}
        />
      </View>

      <View style={styles.button}>
        <Button
          title="Client Dashboard"
          onPress={() => router.push("/client")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  button: {
    width: "80%",
    marginVertical: 8,
  },
});