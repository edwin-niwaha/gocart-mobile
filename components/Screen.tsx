import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function Screen({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.scroll}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
});
