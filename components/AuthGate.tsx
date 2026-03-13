import React from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/providers/AuthProvider';

export function AuthGate({ children, message }: { children: React.ReactNode; message: string }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <EmptyState title="Login required" subtitle={message} />
      <Link href="/auth/login" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go to login</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  button: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  buttonText: { color: 'white', fontWeight: '700' },
});
