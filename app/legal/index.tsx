import { Stack } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';

export default function LegalScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms & Privacy' }} />

      <Screen scroll contentContainerStyle={styles.container}>
        <Text style={styles.title}>Terms & Privacy</Text>

        <Text style={styles.text}>
          By using GoCart, you agree to our terms and privacy policy.
          Your data is handled securely and never shared without consent.
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },
});