import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { ProductCard } from '@/components/ProductCard';
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
        {!wishlistItems.length ? (
          <EmptyState
            title="Wishlist is empty"
            subtitle="Save products here for later."
          />
        ) : null}

        {wishlistItems.map((item) => (
          <ProductCard
            key={item.id}
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
        ))}
      </AuthGate>
    </Screen>
  );
}