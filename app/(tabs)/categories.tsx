import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

export default function CategoriesScreen() {
  const { categories, loadCatalog } = useShop();

  useEffect(() => {
    if (!categories.length) loadCatalog().catch(() => undefined);
  }, []);

  return (
    <Screen scroll>
      <Text style={styles.title}>Browse categories</Text>
      {!categories.length ? <EmptyState title="No categories yet" subtitle="Create categories in Django and they will appear here." /> : null}
      {categories.map((category) => (
        <Pressable key={category.id} style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{category.name}</Text>
            <Text style={styles.cardText}>{category.slug}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardText: { color: colors.muted },
  arrow: { fontSize: 28, color: colors.primary },
});
