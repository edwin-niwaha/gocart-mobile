import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  catalogApi,
  cartApi,
  orderApi,
  wishlistApi,
  notificationApi,
  reviewApi,
} from '@/api/services';
import type {
  CartItem,
  Category,
  Notification,
  Order,
  Product,
  WishlistItem,
  Review,
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
  reviews: Review[];
  notifications: Notification[];
  loadCatalog: () => Promise<void>;
  loadAuthedData: () => Promise<void>;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateCartQty: (itemId: number, quantity: number) => Promise<boolean>;
  removeCartItem: (itemId: number) => Promise<boolean>;
  toggleWishlist: (productId: number) => Promise<boolean>;
  checkout: () => Promise<Order>;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function getApiErrorMessage(error: any, fallback = 'Something went wrong.') {
  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length) return String(data[0]);
  if (data?.detail) return String(data.detail);
  if (data?.quantity?.[0]) return String(data.quantity[0]);
  if (data?.variant_id?.[0]) return String(data.variant_id[0]);
  if (data?.non_field_errors?.[0]) return String(data.non_field_errors[0]);
  if (typeof error?.message === 'string') return error.message;

  return fallback;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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
    } catch (error) {
      console.log('loadCatalog error:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuthedData = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setWishlistItems([]);
      setOrders([]);
      setReviews([]);
      setNotifications([]);
      return;
    }

    setLoading(true);

    try {
      await Promise.allSettled([cartApi.ensure(), wishlistApi.ensure()]);

      const [
        nextCartItems,
        nextWishlistItems,
        nextOrders,
        nextReviews,
        nextNotifications,
      ] = await Promise.all([
        cartApi.listItems(),
        wishlistApi.listItems(),
        orderApi.list(),
        reviewApi.listMine().catch(() => []),
        notificationApi.list().catch(() => []),
      ]);

      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
      setWishlistItems(Array.isArray(nextWishlistItems) ? nextWishlistItems : []);
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
      setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
    } catch (error) {
      console.log('loadAuthedData error:', error);

      setCartItems([]);
      setWishlistItems([]);
      setOrders([]);
      setReviews([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (variantId: number, quantity = 1) => {
    try {
      await cartApi.addItem({
        variant_id: variantId,
        quantity,
      });

      const nextCartItems = await cartApi.listItems();
      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);

      Alert.alert('Success', 'Product added to cart.');
      return true;
    } catch (error: any) {
      console.log('addToCart error:', error?.response?.data || error.message);

      Alert.alert(
        'Unable to add to cart',
        getApiErrorMessage(error, 'Failed to add item to cart.')
      );

      return false;
    }
  }, []);

  const updateCartQty = useCallback(async (itemId: number, quantity: number) => {
    try {
      if (quantity < 1) {
        await cartApi.removeItem(itemId);
      } else {
        await cartApi.updateItem(itemId, { quantity });
      }

      const nextCartItems = await cartApi.listItems();
      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);

      return true;
    } catch (error: any) {
      console.log('updateCartQty error:', error?.response?.data || error.message);

      Alert.alert(
        'Unable to update cart',
        getApiErrorMessage(error, 'Failed to update cart item.')
      );

      return false;
    }
  }, []);

  const removeCartItem = useCallback(async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);

      const nextCartItems = await cartApi.listItems();
      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);

      return true;
    } catch (error: any) {
      console.log('removeCartItem error:', error?.response?.data || error.message);

      Alert.alert(
        'Unable to remove item',
        getApiErrorMessage(error, 'Failed to remove item from cart.')
      );

      return false;
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: number) => {
    try {
      const currentWishlist = await wishlistApi.listItems();
      const existing = currentWishlist.find((item) => item.product.id === productId);

      if (existing) {
        await wishlistApi.removeItem(existing.id);
      } else {
        await wishlistApi.addItem({ product_id: productId });
      }

      const nextWishlistItems = await wishlistApi.listItems();
      setWishlistItems(Array.isArray(nextWishlistItems) ? nextWishlistItems : []);

      return true;
    } catch (error: any) {
      console.log('toggleWishlist error:', error?.response?.data || error.message);

      Alert.alert(
        'Wishlist error',
        getApiErrorMessage(error, 'Failed to update wishlist.')
      );

      return false;
    }
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
        variant: item.variant.id,
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
      reviews,
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
      reviews,
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