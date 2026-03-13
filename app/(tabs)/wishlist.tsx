import React, { useEffect } from 'react';
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
  }, []);

  return (
    <Screen scroll>
      <AuthGate message="Log in to save products and sync them across devices.">
        {!wishlistItems.length ? <EmptyState title="Wishlist is empty" subtitle="Save products here for later." /> : null}
        {wishlistItems.map((item) => (
          <ProductCard
            key={item.id}
            product={item.product}
            wished
            onAddToCart={() => protectedAction(() => addToCart(item.product.id, 1))}
            onToggleWishlist={() => protectedAction(() => toggleWishlist(item.product.id))}
          />
        ))}
      </AuthGate>
    </Screen>
  );
}
