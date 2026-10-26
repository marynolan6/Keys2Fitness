// defines the client list screen for the coach, allowing them to view and select clients.
import { router } from "expo-router";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

// K2F-240: Allow the coach to select a client
// and navigate to that client's profile screen
export default function Client_List() {
  return (
    // Main container for the client list screen
    <View style={styles.container}>

      {/* Title displayed at the top of the screen */}
      <Text style={styles.title}>My Clients</Text>

      {/* Sample client card used to test navigation */}
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => {
          // Shows a message in the terminal for testing
          console.log("Spencer clicked!");

          // Opens Spencer's individual client profile
          router.push({
            pathname: "/coach-client/[clientId]",
            params: { clientId: "1" },
          });
        }}
      >
        <Text style={styles.clientName}>Spencer</Text>
        <Text>Tap to view client profile →</Text>
      </TouchableOpacity>

          </View>
        );
      }

// Styles control the appearance of the client list
const styles = StyleSheet.create({

  // Main screen layout and background color
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F7F5",
  },

  // Styling for the "My Clients" heading
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },

  // White rounded card for each client
  clientCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
  },

  // Styling for the client's name
  clientName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
});