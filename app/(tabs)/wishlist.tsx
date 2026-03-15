import React, { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useProtectedAction } from '@/hooks/useProtectedAction';

export default function WishlistScreen() {
  const { wishlistItems, loadAuthedData, addToCart, toggleWishlist } = useShop();
  const protectedAction = useProtectedAction();

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  const getActiveVariants = (product: any) =>
    product.variants?.filter((variant: any) => variant.is_active) || [];

  const handleAddToCart = async (product: any) => {
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

  return (
    <Screen scroll>
      <AuthGate message="Log in to save products and sync them across devices.">
        <View style={styles.container}>
          {wishlistItems.length ? (
            <View style={styles.topRow}>
              <Text style={styles.countPill}>
                {wishlistItems.length} saved item
                {wishlistItems.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}

          {!wishlistItems.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="Wishlist is empty"
                subtitle="Save products here for later."
              />
            </View>
          ) : (
            <View style={styles.list}>
              {wishlistItems.map((item) => (
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