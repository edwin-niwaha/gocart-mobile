import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import type { Product, ProductVariant } from '@/types';

export default function WishlistScreen() {
  const { wishlistItems, loadAuthedData, addToCart, toggleWishlist } = useShop();
  const protectedAction = useProtectedAction();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  const getActiveVariants = (product: Product): ProductVariant[] =>
    product.variants?.filter((variant) => variant.is_active) || [];

  const handleAddToCart = async (product: Product) => {
    const activeVariants = getActiveVariants(product);

    if (!activeVariants.length) {
      Alert.alert('Unavailable', 'This product is currently unavailable.');
      return;
    }

    if (activeVariants.length === 1) {
      await addToCart(activeVariants[0].id, 1);
      return;
    }

    router.push(`/product/${product.slug}`);
  };

  const filteredWishlistItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return wishlistItems;

    return wishlistItems.filter((item) => {
      const product = item.product;
      const name = product?.title?.toLowerCase?.() || '';
      const slug = product?.slug?.toLowerCase?.() || '';
      const description = product?.description?.toLowerCase?.() || '';

      return (
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query)
      );
    });
  }, [wishlistItems, search]);

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
      <AuthGate message="Log in to save products and sync them across devices.">
        <View style={styles.container}>
          <View style={styles.searchWrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search wishlist..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>

          {!wishlistItems.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="Wishlist is empty"
                subtitle="Save products here for later."
              />
            </View>
          ) : !filteredWishlistItems.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No matching products"
                subtitle="Try a different search term."
              />
            </View>
          ) : (
            <View style={styles.list}>
              {filteredWishlistItems.map((item) => (
                <View key={item.id} style={styles.cardWrap}>
                  <ProductCard
                    product={item.product}
                    wished
                    onAddToCart={() =>
                      protectedAction(async () => {
                        await handleAddToCart(item.product);
                      })
                    }
                    onToggleWishlist={() =>
                      protectedAction(async () => {
                        await toggleWishlist(item.product.id);
                      })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  searchWrap: {
    marginBottom: spacing.xs,
  },

  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  countPill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },

  emptyWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },

  list: {
    gap: spacing.md,
  },

  cardWrap: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
