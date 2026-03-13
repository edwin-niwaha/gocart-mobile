import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { catalogApi } from '@/api/services';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { useShop } from '@/providers/ShopProvider';
import { Product } from '@/types';
import { money } from '@/utils/format';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { addToCart, toggleWishlist, wishlistItems } = useShop();
  const protectedAction = useProtectedAction();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const nextProduct = await catalogApi.product(String(slug));
        setProduct(nextProduct);
      } catch {
        Alert.alert('Error', 'Could not load this product.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <Screen><ActivityIndicator /></Screen>;
  if (!product) return <Screen><Text>Product not found.</Text></Screen>;

  const wished = wishlistItems.some((item) => item.product.id === product.id);

  return (
    <Screen scroll>
      <View style={styles.card}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.category}>{product.category?.name || 'General'}</Text>
        <Text style={styles.price}>{money(product.price)}</Text>
        <Text style={styles.desc}>{product.description || 'No description provided.'}</Text>
        <Text style={styles.stock}>{product.is_in_stock === false ? 'Out of stock' : 'In stock'}</Text>
      </View>
      <Pressable style={styles.button} onPress={() => protectedAction(() => addToCart(product.id, 1))}><Text style={styles.buttonText}>Add to cart</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => protectedAction(() => toggleWishlist(product.id))}><Text style={styles.secondaryText}>{wished ? 'Remove from wishlist' : 'Save to wishlist'}</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  category: { color: colors.muted },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary },
  desc: { color: colors.text, lineHeight: 22 },
  stock: { color: colors.success, fontWeight: '700' },
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '800' },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontWeight: '700' },
});
