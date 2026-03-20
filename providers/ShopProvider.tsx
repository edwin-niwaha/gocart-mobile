import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  addressApi,
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
  CustomerAddress,
  CustomerAddressPayload,
  Notification,
  Order,
  Product,
  Review,
  WishlistItem,
} from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { showError, showInfo, showSuccess } from '@/utils/toast';

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous?: string | null;
  results: T[];
};

type ShopContextType = {
  loading: boolean;
  products: Product[];
  categories: Category[];
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  orders: Order[];
  totalOrders: number;
  hasMoreOrders: boolean;
  loadingOrders: boolean;
  loadingMoreOrders: boolean;
  refreshingOrders: boolean;
  reviews: Review[];
  addresses: CustomerAddress[];
  notifications: Notification[];
  totalNotifications: number;
  hasMoreNotifications: boolean;
  loadingNotifications: boolean;
  loadingMoreNotifications: boolean;
  refreshingNotifications: boolean;
  loadCatalog: () => Promise<void>;
  loadAuthedData: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addAddress: (payload: CustomerAddressPayload) => Promise<CustomerAddress | null>;
  updateAddress: (id: number, payload: CustomerAddressPayload) => Promise<boolean>;
  removeAddress: (id: number) => Promise<boolean>;
  addReview: (payload: {
    product: number;
    rating: number;
    comment: string;
  }) => Promise<boolean>;
  updateReview: (
    id: number,
    payload: Partial<{
      rating: number;
      comment: string;
    }>
  ) => Promise<boolean>;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateCartQty: (itemId: number, quantity: number) => Promise<boolean>;
  removeCartItem: (itemId: number) => Promise<boolean>;
  toggleWishlist: (productId: number) => Promise<boolean>;
  checkout: (payload: { address_id: number }) => Promise<Order>;
  markNotificationRead: (id: number) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  markingNotificationIds: number[];
  markingAllNotifications: boolean;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function getApiErrorMessage(error: any, fallback = 'Something went wrong.') {
  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data.length) return String(data[0]);
  if (data?.detail) return String(data.detail);
  if (data?.non_field_errors?.[0]) return String(data.non_field_errors[0]);

  if (data?.quantity?.[0]) return String(data.quantity[0]);
  if (data?.variant_id?.[0]) return String(data.variant_id[0]);
  if (data?.rating?.[0]) return String(data.rating[0]);

  if (data?.street_name?.[0]) return String(data.street_name[0]);
  if (data?.city?.[0]) return String(data.city[0]);
  if (data?.phone_number?.[0]) return String(data.phone_number[0]);
  if (data?.additional_telephone?.[0]) return String(data.additional_telephone[0]);
  if (data?.additional_information?.[0]) return String(data.additional_information[0]);
  if (data?.region?.[0]) return String(data.region[0]);
  if (data?.is_default?.[0]) return String(data.is_default[0]);
  if (data?.address_id?.[0]) return String(data.address_id[0]);

  if (typeof error?.message === 'string') return error.message;

  return fallback;
}

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as PaginatedResponse<T>;
  return (
    Array.isArray(candidate.results) &&
    typeof candidate.count === 'number' &&
    'next' in candidate
  );
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [nextOrdersUrl, setNextOrdersUrl] = useState<string | null>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [nextNotificationsUrl, setNextNotificationsUrl] = useState<string | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [refreshingNotifications, setRefreshingNotifications] = useState(false);
  const [markingNotificationIds, setMarkingNotificationIds] = useState<number[]>([]);
  const [markingAllNotifications, setMarkingAllNotifications] = useState(false);

  const resetAuthedState = useCallback(() => {
    setCartItems([]);
    setWishlistItems([]);
    setOrders([]);
    setTotalOrders(0);
    setNextOrdersUrl(null);
    setHasMoreOrders(false);
    setLoadingOrders(false);
    setLoadingMoreOrders(false);
    setRefreshingOrders(false);
    setReviews([]);
    setAddresses([]);
    setNotifications([]);
    setTotalNotifications(0);
    setNextNotificationsUrl(null);
    setHasMoreNotifications(false);
    setLoadingNotifications(false);
    setLoadingMoreNotifications(false);
    setRefreshingNotifications(false);
    setMarkingNotificationIds([]);
    setMarkingAllNotifications(false);
  }, []);

  const applyOrdersPage = useCallback(
    (
      payload: PaginatedResponse<Order>,
      mode: 'replace' | 'append' = 'replace'
    ) => {
      const safeResults = Array.isArray(payload.results) ? payload.results : [];

      setOrders((current) => {
        if (mode === 'replace') {
          return safeResults;
        }

        const existingIds = new Set(current.map((item) => item.id));
        const dedupedIncoming = safeResults.filter((item) => !existingIds.has(item.id));
        return [...current, ...dedupedIncoming];
      });

      setTotalOrders(typeof payload.count === 'number' ? payload.count : safeResults.length);
      setNextOrdersUrl(payload.next ?? null);
      setHasMoreOrders(Boolean(payload.next));
    },
    []
  );

  const applyNotificationsPage = useCallback(
    (
      payload: PaginatedResponse<Notification>,
      mode: 'replace' | 'append' = 'replace'
    ) => {
      const safeResults = Array.isArray(payload.results) ? payload.results : [];

      setNotifications((current) => {
        if (mode === 'replace') {
          return safeResults;
        }

        const existingIds = new Set(current.map((item) => item.id));
        const dedupedIncoming = safeResults.filter((item) => !existingIds.has(item.id));
        return [...current, ...dedupedIncoming];
      });

      setTotalNotifications(typeof payload.count === 'number' ? payload.count : safeResults.length);
      setNextNotificationsUrl(payload.next ?? null);
      setHasMoreNotifications(Boolean(payload.next));
    },
    []
  );

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
      showError('Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setTotalOrders(0);
      setNextOrdersUrl(null);
      setHasMoreOrders(false);
      return;
    }

    setLoadingOrders(true);

    try {
      const response = await orderApi.list();

      if (isPaginatedResponse<Order>(response)) {
        applyOrdersPage(response, 'replace');
      } else if (Array.isArray(response)) {
        setOrders(response);
        setTotalOrders(response.length);
        setNextOrdersUrl(null);
        setHasMoreOrders(false);
      } else {
        setOrders([]);
        setTotalOrders(0);
        setNextOrdersUrl(null);
        setHasMoreOrders(false);
      }
    } catch (error) {
      console.log('loadOrders error:', error);
      setOrders([]);
      setTotalOrders(0);
      setNextOrdersUrl(null);
      setHasMoreOrders(false);
      showError('Failed to load orders.');
    } finally {
      setLoadingOrders(false);
    }
  }, [applyOrdersPage, isAuthenticated]);

  const refreshOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setTotalOrders(0);
      setNextOrdersUrl(null);
      setHasMoreOrders(false);
      return;
    }

    setRefreshingOrders(true);

    try {
      const response = await orderApi.list();

      if (isPaginatedResponse<Order>(response)) {
        applyOrdersPage(response, 'replace');
      } else if (Array.isArray(response)) {
        setOrders(response);
        setTotalOrders(response.length);
        setNextOrdersUrl(null);
        setHasMoreOrders(false);
      }
    } catch (error) {
      console.log('refreshOrders error:', error);
      showError('Failed to refresh orders.');
    } finally {
      setRefreshingOrders(false);
    }
  }, [applyOrdersPage, isAuthenticated]);

  const loadMoreOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    if (!nextOrdersUrl) return;
    if (loadingMoreOrders) return;

    setLoadingMoreOrders(true);

    try {
      const response = await orderApi.list(nextOrdersUrl);

      if (isPaginatedResponse<Order>(response)) {
        applyOrdersPage(response, 'append');
      }
    } catch (error) {
      console.log('loadMoreOrders error:', error);
      showError('Failed to load more orders.');
    } finally {
      setLoadingMoreOrders(false);
    }
  }, [applyOrdersPage, isAuthenticated, loadingMoreOrders, nextOrdersUrl]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setTotalNotifications(0);
      setNextNotificationsUrl(null);
      setHasMoreNotifications(false);
      return;
    }

    setLoadingNotifications(true);

    try {
      const response = await notificationApi.list();

      if (isPaginatedResponse<Notification>(response)) {
        applyNotificationsPage(response, 'replace');
      } else if (Array.isArray(response)) {
        setNotifications(response);
        setTotalNotifications(response.length);
        setNextNotificationsUrl(null);
        setHasMoreNotifications(false);
      } else {
        setNotifications([]);
        setTotalNotifications(0);
        setNextNotificationsUrl(null);
        setHasMoreNotifications(false);
      }
    } catch (error) {
      console.log('loadNotifications error:', error);
      setNotifications([]);
      setTotalNotifications(0);
      setNextNotificationsUrl(null);
      setHasMoreNotifications(false);
      showError('Failed to load notifications.');
    } finally {
      setLoadingNotifications(false);
    }
  }, [applyNotificationsPage, isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setTotalNotifications(0);
      setNextNotificationsUrl(null);
      setHasMoreNotifications(false);
      return;
    }

    setRefreshingNotifications(true);

    try {
      const response = await notificationApi.list();

      if (isPaginatedResponse<Notification>(response)) {
        applyNotificationsPage(response, 'replace');
      } else if (Array.isArray(response)) {
        setNotifications(response);
        setTotalNotifications(response.length);
        setNextNotificationsUrl(null);
        setHasMoreNotifications(false);
      }
    } catch (error) {
      console.log('refreshNotifications error:', error);
      showError('Failed to refresh notifications.');
    } finally {
      setRefreshingNotifications(false);
    }
  }, [applyNotificationsPage, isAuthenticated]);

  const loadMoreNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    if (!nextNotificationsUrl) return;
    if (loadingMoreNotifications) return;

    setLoadingMoreNotifications(true);

    try {
      const response = await notificationApi.list(nextNotificationsUrl);

      if (isPaginatedResponse<Notification>(response)) {
        applyNotificationsPage(response, 'append');
      }
    } catch (error) {
      console.log('loadMoreNotifications error:', error);
      showError('Failed to load more notifications.');
    } finally {
      setLoadingMoreNotifications(false);
    }
  }, [
    applyNotificationsPage,
    isAuthenticated,
    loadingMoreNotifications,
    nextNotificationsUrl,
  ]);

  const loadAuthedData = useCallback(async () => {
    if (!isAuthenticated) {
      resetAuthedState();
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
        nextAddresses,
        nextNotifications,
      ] = await Promise.all([
        cartApi.listItems(),
        wishlistApi.listItems(),
        orderApi.list(),
        reviewApi.listMine().catch(() => []),
        addressApi.list().catch(() => []),
        notificationApi.list().catch(() => []),
      ]);

      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
      setWishlistItems(Array.isArray(nextWishlistItems) ? nextWishlistItems : []);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
      setAddresses(Array.isArray(nextAddresses) ? nextAddresses : []);

      if (isPaginatedResponse<Order>(nextOrders)) {
        applyOrdersPage(nextOrders, 'replace');
      } else if (Array.isArray(nextOrders)) {
        setOrders(nextOrders);
        setTotalOrders(nextOrders.length);
        setNextOrdersUrl(null);
        setHasMoreOrders(false);
      } else {
        setOrders([]);
        setTotalOrders(0);
        setNextOrdersUrl(null);
        setHasMoreOrders(false);
      }

      if (isPaginatedResponse<Notification>(nextNotifications)) {
        applyNotificationsPage(nextNotifications, 'replace');
      } else if (Array.isArray(nextNotifications)) {
        setNotifications(nextNotifications);
        setTotalNotifications(nextNotifications.length);
        setNextNotificationsUrl(null);
        setHasMoreNotifications(false);
      } else {
        setNotifications([]);
        setTotalNotifications(0);
        setNextNotificationsUrl(null);
        setHasMoreNotifications(false);
      }
    } catch (error) {
      console.log('loadAuthedData error:', error);
      setCartItems([]);
      setWishlistItems([]);
      setOrders([]);
      setTotalOrders(0);
      setNextOrdersUrl(null);
      setHasMoreOrders(false);
      setReviews([]);
      setAddresses([]);
      setNotifications([]);
      setTotalNotifications(0);
      setNextNotificationsUrl(null);
      setHasMoreNotifications(false);
      showError('Failed to load your account data.');
    } finally {
      setLoading(false);
    }
  }, [applyNotificationsPage, applyOrdersPage, isAuthenticated, resetAuthedState]);

  const addAddress = useCallback(async (payload: CustomerAddressPayload) => {
    try {
      const created = await addressApi.create(payload);
      const nextAddresses = await addressApi.list();
      setAddresses(Array.isArray(nextAddresses) ? nextAddresses : []);
      showSuccess('Address added successfully.');
      return created ?? null;
    } catch (error: any) {
      console.log('addAddress error:', error?.response?.data || error?.message);
      showError(getApiErrorMessage(error, 'Failed to add address.'));
      return null;
    }
  }, []);

  const updateAddress = useCallback(
    async (id: number, payload: CustomerAddressPayload) => {
      try {
        await addressApi.update(id, payload);
        const nextAddresses = await addressApi.list();
        setAddresses(Array.isArray(nextAddresses) ? nextAddresses : []);
        showSuccess('Address updated successfully.');
        return true;
      } catch (error: any) {
        console.log('updateAddress error:', error?.response?.data || error?.message);
        showError(getApiErrorMessage(error, 'Failed to update address.'));
        return false;
      }
    },
    []
  );

  const removeAddress = useCallback(async (id: number) => {
    try {
      await addressApi.remove(id);
      const nextAddresses = await addressApi.list();
      setAddresses(Array.isArray(nextAddresses) ? nextAddresses : []);
      showSuccess('Address removed successfully.');
      return true;
    } catch (error: any) {
      console.log('removeAddress error:', error?.response?.data || error?.message);
      showError(getApiErrorMessage(error, 'Failed to remove address.'));
      return false;
    }
  }, []);

  const addReview = useCallback(
    async (payload: { product: number; rating: number; comment: string }) => {
      try {
        await reviewApi.create(payload);
        const nextReviews = await reviewApi.listMine();
        setReviews(Array.isArray(nextReviews) ? nextReviews : []);
        showSuccess('Review added successfully.');
        return true;
      } catch (error: any) {
        console.log('addReview error:', error?.response?.data || error?.message);
        showError(getApiErrorMessage(error, 'Failed to add review.'));
        return false;
      }
    },
    []
  );

  const updateReview = useCallback(
    async (
      id: number,
      payload: Partial<{
        rating: number;
        comment: string;
      }>
    ) => {
      try {
        await reviewApi.update(id, payload);
        const nextReviews = await reviewApi.listMine();
        setReviews(Array.isArray(nextReviews) ? nextReviews : []);
        showSuccess('Review updated successfully.');
        return true;
      } catch (error: any) {
        console.log('updateReview error:', error?.response?.data || error?.message);
        showError(getApiErrorMessage(error, 'Failed to update review.'));
        return false;
      }
    },
    []
  );

  const addToCart = useCallback(async (variantId: number, quantity = 1) => {
    try {
      await cartApi.addItem({
        variant_id: variantId,
        quantity,
      });

      const nextCartItems = await cartApi.listItems();
      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);

      showSuccess('Product added to cart.');
      return true;
    } catch (error: any) {
      console.log('addToCart error:', error?.response?.data || error?.message);
      showError(getApiErrorMessage(error, 'Failed to add item to cart.'));
      return false;
    }
  }, []);

  const updateCartQty = useCallback(async (itemId: number, quantity: number) => {
    try {
      if (quantity < 1) {
        await cartApi.removeItem(itemId);
        showInfo('Item removed from cart.');
      } else {
        await cartApi.updateItem(itemId, { quantity });
        showSuccess('Cart updated.');
      }

      const nextCartItems = await cartApi.listItems();
      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
      return true;
    } catch (error: any) {
      console.log('updateCartQty error:', error?.response?.data || error?.message);
      showError(getApiErrorMessage(error, 'Failed to update cart item.'));
      return false;
    }
  }, []);

  const removeCartItem = useCallback(async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);

      const nextCartItems = await cartApi.listItems();
      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);

      showSuccess('Item removed from cart.');
      return true;
    } catch (error: any) {
      console.log('removeCartItem error:', error?.response?.data || error?.message);
      showError(getApiErrorMessage(error, 'Failed to remove item from cart.'));
      return false;
    }
  }, []);

  const toggleWishlist = useCallback(async (productId: number) => {
    try {
      const currentWishlist = await wishlistApi.listItems();
      const existing = currentWishlist.find((item) => item.product.id === productId);

      if (existing) {
        await wishlistApi.removeItem(existing.id);
        showInfo('Removed from wishlist.');
      } else {
        await wishlistApi.addItem({ product_id: productId });
        showSuccess('Added to wishlist.');
      }

      const nextWishlistItems = await wishlistApi.listItems();
      setWishlistItems(Array.isArray(nextWishlistItems) ? nextWishlistItems : []);
      return true;
    } catch (error: any) {
      console.log('toggleWishlist error:', error?.response?.data || error?.message);
      showError(getApiErrorMessage(error, 'Failed to update wishlist.'));
      return false;
    }
  }, []);

  const checkout = useCallback(
    async ({ address_id }: { address_id: number }) => {
      if (!cartItems.length) {
        throw new Error('Your cart is empty.');
      }

      if (!address_id) {
        throw new Error('Please select a delivery address.');
      }

      const selectedAddress = addresses.find((item) => item.id === address_id);
      if (!selectedAddress) {
        throw new Error('Selected address was not found.');
      }

      const order = await orderApi.checkout({
        address_id,
        description: 'Placed from mobile app',
      });

      const [nextOrders, nextCartItems] = await Promise.all([
        orderApi.list(),
        cartApi.listItems(),
      ]);

      if (isPaginatedResponse<Order>(nextOrders)) {
        applyOrdersPage(nextOrders, 'replace');
      } else {
        setOrders(Array.isArray(nextOrders) ? nextOrders : []);
        setTotalOrders(Array.isArray(nextOrders) ? nextOrders.length : 0);
        setNextOrdersUrl(null);
        setHasMoreOrders(false);
      }

      setCartItems(Array.isArray(nextCartItems) ? nextCartItems : []);
      showSuccess('Checkout completed successfully.');

      return order;
    },
    [addresses, cartItems, applyOrdersPage]
  );

  const markNotificationRead = useCallback(async (id: number) => {
    try {
      setMarkingNotificationIds((current) => {
        const safeCurrent = Array.isArray(current) ? current : [];
        return safeCurrent.includes(id) ? safeCurrent : [...safeCurrent, id];
      });

      const updated = await notificationApi.markRead(id);

      setNotifications((current) => {
        const safeCurrent = Array.isArray(current) ? current : [];
        return safeCurrent.map((item) =>
          item.id === id
            ? {
                ...item,
                ...(updated ?? {}),
                is_read: true,
                read_at:
                  updated?.read_at ??
                  item.read_at ??
                  new Date().toISOString(),
              }
            : item
        );
      });

      return true;
    } catch (error: any) {
      console.log(
        'markNotificationRead error:',
        error?.response?.data || error?.message
      );
      showError('Failed to mark notification as read.');
      return false;
    } finally {
      setMarkingNotificationIds((current) => {
        const safeCurrent = Array.isArray(current) ? current : [];
        return safeCurrent.filter((item) => item !== id);
      });
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      setMarkingAllNotifications(true);

      await notificationApi.markAllRead();

      const now = new Date().toISOString();

      setNotifications((current) => {
        const safeCurrent = Array.isArray(current) ? current : [];
        return safeCurrent.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at ?? now,
        }));
      });

      showSuccess('All notifications marked as read.');
      return true;
    } catch (error: any) {
      console.log(
        'markAllNotificationsRead error:',
        error?.response?.data || error?.message
      );
      showError('Failed to mark all notifications as read.');
      return false;
    } finally {
      setMarkingAllNotifications(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      products,
      categories,
      cartItems,
      wishlistItems,
      orders,
      totalOrders,
      hasMoreOrders,
      loadingOrders,
      loadingMoreOrders,
      refreshingOrders,
      reviews,
      addresses,
      notifications,
      totalNotifications,
      hasMoreNotifications,
      loadingNotifications,
      loadingMoreNotifications,
      refreshingNotifications,
      loadCatalog,
      loadAuthedData,
      loadOrders,
      loadMoreOrders,
      refreshOrders,
      loadNotifications,
      loadMoreNotifications,
      refreshNotifications,
      addAddress,
      updateAddress,
      removeAddress,
      addReview,
      updateReview,
      addToCart,
      updateCartQty,
      removeCartItem,
      toggleWishlist,
      checkout,
      markNotificationRead,
      markAllNotificationsRead,
      markingNotificationIds,
      markingAllNotifications,
    }),
    [
      loading,
      products,
      categories,
      cartItems,
      wishlistItems,
      orders,
      totalOrders,
      hasMoreOrders,
      loadingOrders,
      loadingMoreOrders,
      refreshingOrders,
      reviews,
      addresses,
      notifications,
      totalNotifications,
      hasMoreNotifications,
      loadingNotifications,
      loadingMoreNotifications,
      refreshingNotifications,
      loadCatalog,
      loadAuthedData,
      loadOrders,
      loadMoreOrders,
      refreshOrders,
      loadNotifications,
      loadMoreNotifications,
      refreshNotifications,
      addAddress,
      updateAddress,
      removeAddress,
      addReview,
      updateReview,
      addToCart,
      updateCartQty,
      removeCartItem,
      toggleWishlist,
      checkout,
      markNotificationRead,
      markAllNotificationsRead,
      markingNotificationIds,
      markingAllNotifications,
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