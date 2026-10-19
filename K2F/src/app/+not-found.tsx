import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';

import { colors, radii, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  // Replace (rather than push) so the invalid route is removed from history
  // and the user can't navigate "back" onto it.
  const goHome = () => router.replace('/');

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.message}>The page you requested was not found.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
          onPress={goHome}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  title: {
    fontSize: 96,
    fontWeight: '700',
    color: colors.surface,
  },

  message: {
    fontSize: typography.body,
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  button: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
