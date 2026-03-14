import React from 'react';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { Product } from '@/types';
import { money } from '@/utils/format';

const FALLBACK_IMAGE =
  'https://via.placeholder.com/400x300.png?text=Product';

export function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  wished,
}: {
  product: Product;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  wished?: boolean;
}) {
  const image =
    product.hero_image ||
    product.image_urls?.[0] ||
    FALLBACK_IMAGE;

  const activeVariants =
    product.variants?.filter((v) => v.is_active) ?? [];

  const hasVariants = activeVariants.length > 0;

  return (
    <View style={styles.card}>
      <Link href={`/product/${product.slug}`} asChild>
        <Pressable>
          <Image source={{ uri: image }} style={styles.image} />

          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.category}>
            {product.category?.name || 'General'}
          </Text>

          <Text style={styles.price}>{money(product.base_price)}</Text>

          {activeVariants.length > 1 ? (
            <Text style={styles.variantHint}>
              {activeVariants.length} options available
            </Text>
          ) : null}

          <Text numberOfLines={2} style={styles.desc}>
            {product.description ||
              'Clean product detail powered by Django.'}
          </Text>
        </Pressable>
      </Link>

      <View style={styles.row}>
        <Pressable
          style={[
            styles.primaryButton,
            !hasVariants && styles.disabledButton,
          ]}
          onPress={onAddToCart}
          disabled={!hasVariants}
        >
          <Text style={styles.primaryText}>
            {hasVariants ? 'Add to cart' : 'Unavailable'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={onToggleWishlist}
        >
          <Text style={styles.secondaryText}>
            {wished ? 'Saved' : 'Wishlist'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },

  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  category: {
    color: colors.muted,
    fontSize: 13,
  },

  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },

  variantHint: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  desc: {
    color: colors.muted,
    fontSize: 13,
  },

  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: colors.border,
  },

  primaryText: {
    color: 'white',
    fontWeight: '700',
  },

  secondaryButton: {
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },

  secondaryText: {
    color: colors.text,
    fontWeight: '600',
  },
});