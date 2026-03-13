import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 6 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted },
});
