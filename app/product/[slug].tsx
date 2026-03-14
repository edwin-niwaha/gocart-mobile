import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi } from '@/api/services';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { useShop } from '@/providers/ShopProvider';
import { Product, ProductVariant } from '@/types';
import { money } from '@/utils/format';

const FALLBACK_PRODUCT = 'https://via.placeholder.com/800x600.png?text=Product';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { addToCart, toggleWishlist, wishlistItems } = useShop();
  const protectedAction = useProtectedAction();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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

  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedVariant(null);
      return;
    }

    const firstAvailable =
      product.variants.find((variant) => variant.is_active && variant.is_in_stock) ||
      product.variants.find((variant) => variant.is_active) ||
      product.variants[0];

    setSelectedVariant(firstAvailable);
  }, [product]);

  const wished = useMemo(
    () => wishlistItems.some((item) => item.product.id === product?.id),
    [wishlistItems, product]
  );

  const activeVariants = useMemo(
    () => product?.variants?.filter((variant) => variant.is_active) || [],
    [product]
  );

  const imageUri =
    product?.hero_image ||
    product?.image_urls?.[0] ||
    FALLBACK_PRODUCT;

  const displayPrice = selectedVariant?.price || product?.base_price || '0';
  const isOutOfStock = selectedVariant ? !selectedVariant.is_in_stock : !product?.is_in_stock;
  const stockText = isOutOfStock ? 'Out of stock' : 'In stock';

  const handleAddToCart = () => {
    if (!selectedVariant) {
      Alert.alert('Select an option', 'Please choose a size or volume first.');
      return;
    }

    if (!selectedVariant.is_in_stock) {
      Alert.alert('Out of stock', 'This option is currently unavailable.');
      return;
    }

    protectedAction(() => addToCart(selectedVariant.id, 1));
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.notFound}>Product not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} />

          <Pressable
            style={styles.wishlistBtn}
            onPress={() => protectedAction(() => toggleWishlist(product.id))}
          >
            <Ionicons
              name={wished ? 'heart' : 'heart-outline'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.category}>{product.category?.name || 'General'}</Text>
              <Text style={styles.title}>{product.title}</Text>
            </View>

            <View
              style={[
                styles.stockBadge,
                isOutOfStock ? styles.stockOut : styles.stockIn,
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  isOutOfStock ? styles.stockTextOut : styles.stockTextIn,
                ]}
              >
                {stockText}
              </Text>
            </View>
          </View>

          <Text style={styles.price}>{money(displayPrice)}</Text>

          {activeVariants.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose option</Text>

              <View style={styles.variantWrap}>
                {activeVariants.map((variant) => {
                  const active = selectedVariant?.id === variant.id;
                  const disabled = !variant.is_in_stock;

                  return (
                    <Pressable
                      key={variant.id}
                      onPress={() => setSelectedVariant(variant)}
                      style={[
                        styles.variantChip,
                        active && styles.variantChipActive,
                        disabled && styles.variantChipDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          active && styles.variantChipTextActive,
                        ]}
                      >
                        {variant.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>{product.category?.name || 'General'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Selected option</Text>
              <Text style={styles.metaValue}>
                {selectedVariant?.name || 'Default'}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Availability</Text>
              <Text style={styles.metaValue}>
                {isOutOfStock ? 'Unavailable' : 'Available'}
              </Text>
            </View>

            {typeof selectedVariant?.stock_quantity === 'number' ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Stock</Text>
                <Text style={styles.metaValue}>{selectedVariant.stock_quantity}</Text>
              </View>
            ) : null}

            {selectedVariant?.max_quantity_per_order ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Max per order</Text>
                <Text style={styles.metaValue}>
                  {selectedVariant.max_quantity_per_order}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.desc}>
              {product.description || 'No description provided.'}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, isOutOfStock && styles.buttonDisabled]}
              disabled={isOutOfStock}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>
                {isOutOfStock ? 'Out of stock' : 'Add to cart'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => protectedAction(() => toggleWishlist(product.id))}
            >
              <Ionicons
                name={wished ? 'heart' : 'heart-outline'}
                size={18}
                color={colors.text}
              />
              <Text style={styles.secondaryText}>
                {wished ? 'Saved to wishlist' : 'Save to wishlist'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  notFound: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  imageWrap: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  image: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },

  wishlistBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  category: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
    fontWeight: '600',
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 32,
  },

  price: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
  },

  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },

  stockIn: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },

  stockOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },

  stockText: {
    fontSize: 12,
    fontWeight: '700',
  },

  stockTextIn: {
    color: colors.success,
  },

  stockTextOut: {
    color: '#dc2626',
  },

  section: {
    gap: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  desc: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },

  variantWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  variantChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  variantChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  variantChipDisabled: {
    opacity: 0.55,
  },

  variantChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  variantChipTextActive: {
    color: colors.primary,
  },

  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 12,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  metaLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },

  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },

  actions: {
    gap: 12,
    marginTop: spacing.sm,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
  },

  secondaryText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
});