import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { categories } from '@/data/products';
import { useShop } from '@/providers/ShopProvider';

export default function CategoriesScreen() {
  const { products } = useShop();

  return (
    <Screen>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.subtitle}>Browse by category and see how many products each section has.</Text>
      {categories.map((category) => {
        const count = products.filter((product) => product.category === category).length;
        return (
          <Pressable key={category} style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{category}</Text>
              <Text style={styles.cardMeta}>{count} products available</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { color: '#6B7280', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  cardMeta: { color: '#6B7280', marginTop: 4 },
  arrow: { fontSize: 22, color: '#6B7280' },
});
