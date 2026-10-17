import { Text, View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404 Screen' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Link href="/" style={styles.button}>
          The page you requested was not found. Click here to go back to home screen.
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 96,
    color: '#fff',
  },

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});
