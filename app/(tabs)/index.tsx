import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/ui/ProductCard';
import { Screen } from '@/components/ui/Screen';
import { categories } from '@/data/products';
import { useShop } from '@/providers/ShopProvider';

export default function HomeScreen() {
  const { featuredProducts, products } = useShop();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, selectedCategory]);

  return (
    <Screen>
      <View style={styles.hero}>
        <View>
          <Text style={styles.kicker}>Latest features</Text>
          <Text style={styles.title}>Simple ecommerce app with tabs</Text>
          <Text style={styles.subtitle}>Search, wishlist, cart persistence, checkout, and orders with less code.</Text>
        </View>
        <Pressable onPress={() => router.push('/orders')} style={styles.heroButton}>
          <Text style={styles.heroButtonText}>My orders</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products"
        style={styles.search}
      />

      <FlatList
        data={['All', ...categories]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedCategory(item)}
            style={[styles.chip, selectedCategory === item && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <Text style={styles.sectionMeta}>{featuredProducts.length} trending items</Text>
      </View>

      <View style={styles.grid}>
        {filtered.map((product) => (
          <View key={product.id} style={styles.gridItem}>
            <ProductCard product={product} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  kicker: { color: '#C7D2FE', fontWeight: '700', marginBottom: 4 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#D1D5DB', lineHeight: 20, marginTop: 8 },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  heroButtonText: { color: '#111827', fontWeight: '700' },
  search: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  categoryList: { gap: 10 },
  chip: { backgroundColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipActive: { backgroundColor: '#111827' },
  chipText: { color: '#111827', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  sectionMeta: { color: '#6B7280' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
});
