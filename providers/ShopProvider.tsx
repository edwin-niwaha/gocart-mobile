import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { Product, products } from '@/data/products';

const STORAGE_KEY = 'gocart-shop-v2';

type CartItem = {
  productId: string;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  items: CartItem[];
};

type ShopContextValue = {
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  hydrated: boolean;
  cartCount: number;
  cartTotal: number;
  featuredProducts: Product[];
  getProductById: (id: string) => Product | undefined;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  clearCart: () => void;
  checkout: () => Order | null;
};

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Pick<ShopContextValue, 'cart' | 'wishlist' | 'orders'>;
          setCart(parsed.cart ?? []);
          setWishlist(parsed.wishlist ?? []);
          setOrders(parsed.orders ?? []);
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, wishlist, orders })).catch(() => null);
  }, [cart, wishlist, orders, hydrated]);

  const getProductById = (id: string) => products.find((item) => item.id === id);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const value = useMemo<ShopContextValue>(
    () => ({
      products,
      cart,
      wishlist,
      orders,
      hydrated,
      cartCount,
      cartTotal,
      featuredProducts: products.filter((product) => product.featured),
      getProductById,
      addToCart: (productId: string) => {
        setCart((current) => {
          const item = current.find((entry) => entry.productId === productId);
          if (item) {
            return current.map((entry) =>
              entry.productId === productId ? { ...entry, quantity: entry.quantity + 1 } : entry,
            );
          }
          return [...current, { productId, quantity: 1 }];
        });
      },
      removeFromCart: (productId: string) => {
        setCart((current) => current.filter((item) => item.productId !== productId));
      },
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          setCart((current) => current.filter((item) => item.productId !== productId));
          return;
        }
        setCart((current) =>
          current.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
        );
      },
      toggleWishlist: (productId: string) => {
        setWishlist((current) =>
          current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [productId, ...current],
        );
      },
      clearCart: () => setCart([]),
      checkout: () => {
        if (!cart.length) return null;
        const nextOrder: Order = {
          id: `ORD-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          total: cartTotal,
          items: cart,
        };
        setOrders((current) => [nextOrder, ...current]);
        setCart([]);
        return nextOrder;
      },
    }),
    [cart, wishlist, orders, hydrated, cartCount, cartTotal],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return context;
}
