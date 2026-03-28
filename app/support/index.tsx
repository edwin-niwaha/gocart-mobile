import { Stack } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';

export default function SupportScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Help & Support' }} />

      <Screen contentContainerStyle={styles.container}>
        <Text style={styles.title}>Help & Support</Text>

        <Text style={styles.text}>
          Need help? Contact us at support@gocart.com or check FAQs.
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
    lineHeight: 20,
  },
});