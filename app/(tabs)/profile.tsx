import React from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { fullName } from '@/utils/format';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text style={styles.name}>{fullName(user?.first_name, user?.last_name, user?.username)}</Text>
        <Text style={styles.email}>{user?.email || 'Guest user'}</Text>
      </View>

      {!isAuthenticated ? (
        <>
          <Link href="/auth/login" asChild>
            <Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Login</Text></Pressable>
          </Link>
          <Link href="/auth/register" asChild>
            <Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Create account</Text></Pressable>
          </Link>
        </>
      ) : (
        <>
          <Link href="/notifications" asChild>
            <Pressable style={styles.secondaryButton}><Text style={styles.secondaryText}>Notifications</Text></Pressable>
          </Link>
          <Pressable style={styles.primaryButton} onPress={() => logout()} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Please wait...' : 'Logout'}</Text>
          </Pressable>
        </>
      )}

      <View style={styles.featureCard}>
        <Text style={styles.featureTitle}>Production-grade upgrades included</Text>
        <Text style={styles.featureText}>JWT token refresh, protected checkout, synced wishlist/cart/orders, reusable API layer, and env-based backend switching.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 6 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { color: colors.muted },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '800' },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontWeight: '700' },
  featureCard: { marginTop: 4, backgroundColor: colors.primarySoft, borderRadius: 18, padding: spacing.lg, gap: 6 },
  featureTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  featureText: { color: colors.muted },
});
