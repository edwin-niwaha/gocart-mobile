import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  catalogApi,
  cartApi,
  orderApi,
  wishlistApi,
  notificationApi,
} from '@/api/services';
import type {
  CartItem,
  Category,
  Notification,
  Order,
  Product,
  WishlistItem,
} from '@/types';
import { orderSlug } from '@/utils/format';
import { useAuth } from '@/providers/AuthProvider';

type ShopContextType = {
  loading: boolean;
  products: Product[];
  categories: Category[];
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  orders: Order[];
  notifications: Notification[];
  loadCatalog: () => Promise<void>;
  loadAuthedData: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateCartQty: (itemId: number, quantity: number) => Promise<void>;
  removeCartItem: (itemId: number) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
  checkout: () => Promise<Order>;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        catalogApi.products(),
        catalogApi.categories(),
      ]);

      setProducts(Array.isArray(nextProducts) ? nextProducts : []);
      setCategories(Array.isArray(nextCategories) ? nextCategories : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuthedData = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setWishlistItems([]);
      setOrders([]);
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      await Promise.allSettled([
        cartApi.ensure(),
        wishlistApi.ensure(),
      ]);

      const [nextCartItems, nextWishlistItems, nextOrders, nextNotifications] =
        await Promise.all([
          cartApi.listItems(),
          wishlistApi.listItems(),
          orderApi.list(),
          notificationApi.list().catch(() => []),
        ]);

      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
      setWishlistItems(Array.isArray(nextWishlistItems) ? nextWishlistItems : []);
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (productId: number, quantity = 1) => {
    await cartApi.addItem({ product_id: productId, quantity });
    const nextCartItems = await cartApi.listItems();
    setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
  }, []);

  const updateCartQty = useCallback(async (itemId: number, quantity: number) => {
    if (quantity < 1) {
      await cartApi.removeItem(itemId);
    } else {
      await cartApi.updateItem(itemId, { quantity });
    }

    const nextCartItems = await cartApi.listItems();
    setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
  }, []);

  const removeCartItem = useCallback(async (itemId: number) => {
    await cartApi.removeItem(itemId);
    const nextCartItems = await cartApi.listItems();
    setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
  }, []);

  const toggleWishlist = useCallback(async (productId: number) => {
    const currentWishlist = await wishlistApi.listItems();
    const existing = currentWishlist.find((item) => item.product.id === productId);

    if (existing) {
      await wishlistApi.removeItem(existing.id);
    } else {
      await wishlistApi.addItem({ product_id: productId });
    }

    const nextWishlistItems = await wishlistApi.listItems();
    setWishlistItems(Array.isArray(nextWishlistItems) ? nextWishlistItems : []);
  }, []);

  const checkout = useCallback(async () => {
    if (!cartItems.length) {
      throw new Error('Your cart is empty.');
    }

    const order = await orderApi.create({
      slug: orderSlug(),
      description: 'Placed from mobile app',
    });

    for (const item of cartItems) {
      await orderApi.addItem({
        order: order.id,
        product: item.product.id,
        quantity: item.quantity,
      });

      await cartApi.removeItem(item.id);
    }

    const [nextOrders, nextCartItems] = await Promise.all([
      orderApi.list(),
      cartApi.listItems(),
    ]);

    setOrders(Array.isArray(nextOrders) ? nextOrders : []);
    setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);

    return order;
  }, [cartItems]);

  const value = useMemo(
    () => ({
      loading,
      products,
      categories,
      cartItems,
      wishlistItems,
      orders,
      notifications,
      loadCatalog,
      loadAuthedData,
      addToCart,
      updateCartQty,
      removeCartItem,
      toggleWishlist,
      checkout,
    }),
    [
      loading,
      products,
      categories,
      cartItems,
      wishlistItems,
      orders,
      notifications,
      loadCatalog,
      loadAuthedData,
      addToCart,
      updateCartQty,
      removeCartItem,
      toggleWishlist,
      checkout,
    ]
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