import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function ClientHome() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text>client</Text>

      <View style={styles.button}>
        <Button
          title="Today's Workout"
          onPress={() => 
            router.push({
              pathname: "/client/home/workout/[workoutId]",
              params: { workoutId: "today"},
            })
          }
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
  },
  button: {
    width: "50%",
    marginVertical: 10,
  }
});
