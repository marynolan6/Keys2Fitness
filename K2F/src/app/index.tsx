// Dashboard selection screen for coach or client
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { View, StyleSheet,} from "react-native";

// door opening animation component
import DoorOpeningIntro from "../components/DoorOpeningIntro";

export default function Index() {
  // Show the door animation when this screen mounts
  const [showIntro, setShowIntro] = useState(true);

  return (
    <View style={styles.container}>
      {/* Door opening animation */}
      {showIntro && (
        <View style={StyleSheet.absoluteFill}>
          <DoorOpeningIntro onComplete={() => setShowIntro(false)}/>
        </View>
      )}
      <Redirect href="/auth/login" />
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
});