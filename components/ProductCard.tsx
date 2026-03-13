import React from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { Product } from '@/types';
import { money } from '@/utils/format';

export function ProductCard({ product, onAddToCart, onToggleWishlist, wished }: {
  product: Product;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  wished?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Link href={`/product/${product.slug}`} asChild>
        <Pressable>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.category}>{product.category?.name || 'General'}</Text>
          <Text style={styles.price}>{money(product.price)}</Text>
          <Text numberOfLines={2} style={styles.desc}>{product.description || 'Clean product detail powered by Django.'}</Text>
        </Pressable>
      </Link>
      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={onAddToCart}>
          <Text style={styles.primaryText}>Add to cart</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onToggleWishlist}>
          <Text style={styles.secondaryText}>{wished ? 'Saved' : 'Wishlist'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 18, borderWidth: 1, borderColor: colors.border, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  category: { color: colors.muted, fontSize: 13 },
  price: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  desc: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  primaryButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '700' },
  secondaryButton: { paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '600' },
});
