import { Button, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

// for the door opening animation on the first visit to the login screen
import { useState } from "react";
import DoorOpeningIntro from "../components/DoorOpeningIntro";

export default function Index() {
  const router = useRouter();
  // Show the door opening animation on the first visit to the login screen
  const [showIntro, setShowIntro] = useState(true);

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
          onPress={() => router.push("/client/home")}
        />
      </View>
           
      {/* Door opening animation */}
      {showIntro && (
        <View style={StyleSheet.absoluteFill}>
          <DoorOpeningIntro
            onComplete={() => setShowIntro(false)}
          />
        </View>
      )}

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
