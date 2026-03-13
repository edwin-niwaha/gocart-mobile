import { api } from '@/api/client';
import { normalizeList } from '@/utils/format';
import type {
  AuthResponse,
  Cart,
  CartItem,
  Category,
  Notification,
  Order,
  OrderItem,
  Product,
  User,
  Wishlist,
  WishlistItem,
} from '@/types';

export const authApi = {
  async register(payload: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
  }) {
    const { data } = await api.post<AuthResponse>('/auth/register/', payload);
    return data;
  },

  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<AuthResponse>('/auth/login/', payload);
    return data;
  },

  async me() {
    const { data } = await api.get<User>('/auth/me/');
    return data;
  },

  async logout(refresh?: string | null) {
    if (!refresh) return;
    await api.post('/auth/logout/', { refresh });
  },
};

export const catalogApi = {
  async products() {
    const { data } = await api.get<Product[] | { results: Product[] }>('/products/');
    return normalizeList(data);
  },

  async product(slug: string) {
    const { data } = await api.get<Product>(`/products/${slug}/`);
    return data;
  },

  async categories() {
    const { data } = await api.get<Category[] | { results: Category[] }>('/categories/');
    return normalizeList(data);
  },
};

export const cartApi = {
  async ensure() {
    try {
      const { data } = await api.post<Cart>('/cart/', {});
      return data;
    } catch {
      const { data } = await api.get<Cart[] | { results: Cart[] }>('/cart/');
      const list = normalizeList(data);
      return list[0];
    }
  },

  async listItems() {
    const { data } = await api.get<CartItem[] | { results: CartItem[] }>('/cart-items/');
    return normalizeList(data);
  },

  async addItem(payload: { product_id: number; quantity: number }) {
    const { data } = await api.post<CartItem>('/cart-items/', payload);
    return data;
  },

  async updateItem(id: number, payload: { quantity: number }) {
    const { data } = await api.patch<CartItem>(`/cart-items/${id}/`, payload);
    return data;
  },

  async removeItem(id: number) {
    await api.delete(`/cart-items/${id}/`);
  },
};

export const wishlistApi = {
  async ensure() {
    try {
      const { data } = await api.post<Wishlist>('/wishlist/', {});
      return data;
    } catch {
      const { data } = await api.get<Wishlist[] | { results: Wishlist[] }>('/wishlist/');
      const list = normalizeList(data);
      return list[0];
    }
  },

  async listItems() {
    const { data } = await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/');
    return normalizeList(data);
  },

  async addItem(payload: { product_id: number }) {
    const { data } = await api.post<WishlistItem>('/wishlist-items/', payload);
    return data;
  },

  async removeItem(id: number) {
    await api.delete(`/wishlist-items/${id}/`);
  },
};

export const orderApi = {
  async list() {
    const { data } = await api.get<Order[] | { results: Order[] }>('/orders/');
    return normalizeList(data);
  },

  async create(payload: { slug: string; description: string }) {
    const { data } = await api.post<Order>('/orders/', payload);
    return data;
  },

  async addItem(payload: { order: number; product: number; quantity: number }) {
    const { data } = await api.post<OrderItem>('/order-items/', payload);
    return data;
  },
};

export const notificationApi = {
  async list() {
    const { data } = await api.get<Notification[] | { results: Notification[] }>('/notifications/');
    return normalizeList(data);
  },
};
