import { Stack } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';

export default function LegalScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms & Privacy' }} />

      <Screen scroll contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Terms & Privacy</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About GoCart</Text>
          <Text style={styles.text}>
            GoCart is an e-commerce app operated by Perpetual Tech. It allows users
            to browse products, manage accounts, place orders, and use delivery
            and shopping features available on the platform.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Using GoCart</Text>
          <Text style={styles.text}>
            By creating an account or using GoCart, you agree to these Terms and
            Privacy Policy. If you do not agree, please do not use the app.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <Text style={styles.text}>
            You are responsible for your account and login details. Please provide
            accurate information and keep your credentials secure.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Orders & Payments</Text>
          <Text style={styles.text}>
            Orders are subject to availability and confirmation. Prices, delivery
            fees, promotions, and stock may change at any time. We may cancel or
            limit orders in cases such as pricing errors, fraud concerns, or
            unavailable stock.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acceptable Use</Text>
          <Text style={styles.text}>
            You agree not to misuse the app, provide false information, attempt
            unauthorized access, or use GoCart for unlawful or fraudulent activity.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.text}>
            We may collect information such as your name, email, phone number,
            delivery addresses, account details, order history, device information,
            and app usage data.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How We Use Information</Text>
          <Text style={styles.text}>
            We use your information to manage accounts, process orders, provide
            support, improve the app, send important service updates, and protect
            against fraud or misuse.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sharing Information</Text>
          <Text style={styles.text}>
            We do not sell your personal information. We may share necessary data
            with service providers, delivery partners, payment processors, or
            legal authorities where required to operate the service or comply with
            the law.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Text style={styles.text}>
            We take reasonable steps to protect your information, but no system
            can guarantee complete security.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Choices</Text>
          <Text style={styles.text}>
            You may update your profile information in the app and request account
            support or deletion where applicable.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.text}>
            GoCart may use third-party services such as payment, authentication,
            analytics, and cloud providers. Their services may be governed by
            their own terms and privacy policies.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Liability</Text>
          <Text style={styles.text}>
            To the extent permitted by law, Perpetual Tech is not liable for
            indirect or consequential damages resulting from the use of GoCart.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Updates</Text>
          <Text style={styles.text}>
            We may update these Terms and Privacy information from time to time.
            Continued use of GoCart after updates means you accept the revised terms.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.text}>
            For questions about these Terms or Privacy Policy, please contact us
            through the support options in the app.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
});
