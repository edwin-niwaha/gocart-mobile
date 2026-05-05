import React from 'react';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { Product } from '@/types';
import { money } from '@/utils/format';
import { getPrimaryVariant } from '@/utils/product';

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
  const primaryVariant = getPrimaryVariant(product);
  const outOfStock = hasVariants
    ? !primaryVariant?.is_in_stock
    : !product.is_in_stock;
  const category = product.category?.name || 'General';

  return (
    <View style={styles.card}>
      <Link href={`/product/${product.slug}`} asChild>
        <Pressable style={styles.content}>
          <View style={styles.imageWrap}>
            <Image source={{ uri: image }} style={styles.image} />

            <View style={styles.imageScrim} />

            <View
              style={[
                styles.stockPill,
                outOfStock ? styles.stockPillOut : styles.stockPillIn,
              ]}
            >
              <Ionicons
                name={outOfStock ? 'close-circle' : 'checkmark-circle'}
                size={12}
                color={outOfStock ? colors.danger : colors.success}
              />
              <Text
                style={[
                  styles.stockPillText,
                  outOfStock ? styles.stockTextOut : styles.stockTextIn,
                ]}
              >
                {outOfStock ? 'Out' : 'In stock'}
              </Text>
            </View>
          </View>

          <View style={styles.meta}>
            <Text numberOfLines={1} style={styles.category}>
              {category}
            </Text>

            <Text numberOfLines={2} style={styles.title}>
              {product.title}
            </Text>

            <Text style={styles.price}>{money(primaryVariant?.price ?? product.base_price)}</Text>

            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={13} color={colors.muted} />
              <Text numberOfLines={1} style={styles.variantHint}>
                {activeVariants.length > 1
                  ? `${activeVariants.length} options`
                  : activeVariants[0]?.name || 'Standard'}
              </Text>
            </View>

            <Text numberOfLines={2} style={styles.desc}>
              {product.description || 'Ready for quick delivery.'}
            </Text>
          </View>
        </Pressable>
      </Link>

      <View style={styles.row}>
        <Pressable
          style={[
            styles.primaryButton,
            (!hasVariants || outOfStock) && styles.disabledButton,
          ]}
          onPress={onAddToCart}
          disabled={!hasVariants || outOfStock}
        >
          <Ionicons
            name={hasVariants && !outOfStock ? 'cart-outline' : 'ban-outline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.primaryText}>
            {hasVariants && !outOfStock ? 'Add' : 'Unavailable'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, wished && styles.secondaryButtonActive]}
          onPress={onToggleWishlist}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={18}
            color={wished ? colors.primary : colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },

  content: {
    gap: 0,
  },

  imageWrap: {
    position: 'relative',
    backgroundColor: colors.surfaceMuted,
  },

  image: {
    width: '100%',
    height: 150,
  },

  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },

  stockPill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },

  stockPillIn: {
    borderWidth: 1,
    borderColor: colors.successSoft,
  },

  stockPillOut: {
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },

  stockPillText: {
    fontSize: 10,
    fontWeight: '900',
  },

  stockTextIn: {
    color: colors.success,
  },

  stockTextOut: {
    color: colors.danger,
  },

  meta: {
    padding: spacing.md,
    gap: 7,
  },

  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: colors.text,
  },

  category: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  variantHint: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  desc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: colors.subtle,
  },

  primaryText: {
    color: 'white',
    fontWeight: '700',
  },

  secondaryButton: {
    width: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  secondaryButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
});
