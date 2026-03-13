import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/ui/ProductCard';
import { Screen } from '@/components/ui/Screen';
import { useShop } from '@/providers/ShopProvider';

export default function WishlistScreen() {
  const { wishlist, products } = useShop();
  const items = products.filter((product) => wishlist.includes(product.id));

  return (
    <Screen>
      <Text style={styles.title}>Wishlist</Text>
      <Text style={styles.subtitle}>Save products and come back later.</Text>
      {items.length ? (
        <View style={styles.grid}>
          {items.map((product) => (
            <View key={product.id} style={styles.item}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No saved items yet</Text>
          <Text style={styles.emptyText}>Tap the heart icon on any product to add it here.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { color: '#6B7280' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { width: '48%' },
  empty: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontWeight: '800', fontSize: 18, color: '#111827' },
  emptyText: { color: '#6B7280', textAlign: 'center' },
});
