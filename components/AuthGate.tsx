import React from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/providers/AuthProvider';

type AuthGateProps = {
  children: React.ReactNode;
  message?: string;
  loginLabel?: string;
  redirectTo?: string;
};

export function AuthGate({
  children,
  message = 'Please log in to continue.',
  loginLabel = 'Go to login',
  redirectTo = '/auth/login',
}: AuthGateProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <EmptyState
        title="Login required"
        subtitle={message}
      />

      <Link href={redirectTo as any} asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{loginLabel}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});