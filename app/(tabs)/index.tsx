import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ProductCard } from '@/components/ProductCard';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useProtectedAction } from '@/hooks/useProtectedAction';

export default function HomeScreen() {
  const { products, categories, wishlistItems, loadCatalog, addToCart, toggleWishlist, loading } = useShop();
  const protectedAction = useProtectedAction();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = activeCategory === 'all' || product.category?.slug === activeCategory;
      const queryMatch = `${product.title} ${product.description ?? ''}`.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, products, query]);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.heroTitle}>GoCart Mobile</Text>
          <Text style={styles.heroText}>Production-ready Expo Router app connected to your Django API.</Text>
        </View>
        <Link href="/notifications" asChild>
          <Pressable style={styles.heroButton}><Text style={styles.heroButtonText}>Alerts</Text></Pressable>
        </Link>
      </View>

      <TextInput value={query} onChangeText={setQuery} placeholder="Search products" style={styles.input} />

      <View style={styles.chips}>
        <Pressable style={[styles.chip, activeCategory === 'all' && styles.chipActive]} onPress={() => setActiveCategory('all')}><Text style={styles.chipText}>All</Text></Pressable>
        {categories.map((category) => (
          <Pressable key={category.id} style={[styles.chip, activeCategory === category.slug && styles.chipActive]} onPress={() => setActiveCategory(category.slug)}>
            <Text style={styles.chipText}>{category.name}</Text>
          </Pressable>
        ))}
      </View>

      {loading && !products.length ? <ActivityIndicator /> : null}

      <View style={{ gap: spacing.md }}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wished={wishlistItems.some((item) => item.product.id === product.id)}
            onAddToCart={() => protectedAction(() => addToCart(product.id, 1))}
            onToggleWishlist={() => protectedAction(() => toggleWishlist(product.id))}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primarySoft, borderRadius: 20, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  heroText: { color: colors.muted, fontSize: 14 },
  heroButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  heroButtonText: { color: 'white', fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontWeight: '600', color: colors.text },
});
