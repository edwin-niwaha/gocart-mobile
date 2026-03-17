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
  ProductRating,
  Review,
  User,
  Wishlist,
  WishlistItem,
} from '@/types';

export function getErrorMessage(error: any, fallback = 'Something went wrong.') {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (Array.isArray(data) && data.length) {
    return String(data[0]);
  }

  if (data?.detail) {
    return String(data.detail);
  }

  if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0]);
  }

  if (Array.isArray(data?.quantity) && data.quantity.length) {
    return String(data.quantity[0]);
  }

  if (Array.isArray(data?.variant_id) && data.variant_id.length) {
    return String(data.variant_id[0]);
  }

  if (Array.isArray(data?.product_id) && data.product_id.length) {
    return String(data.product_id[0]);
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

/// API service functions
export const authApi = {
  async register(payload: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
  }) {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /auth/register/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async login(payload: { email: string; password: string }) {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /auth/login/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async me() {
    try {
      const { data } = await api.get<User>('/auth/me/');
      return data;
    } catch (error: any) {
      console.log('GET /auth/me/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async logout(refresh?: string | null) {
    if (!refresh) return;

    try {
      await api.post('/auth/logout/', { refresh });
    } catch (error: any) {
      console.log('POST /auth/logout/ error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

/// Add more API services as needed, following the same pattern
export const catalogApi = {
  async products() {
    try {
      const { data } = await api.get<Product[] | { results: Product[] }>('/products/');
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /products/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async product(slug: string) {
    try {
      const { data } = await api.get<Product>(`/products/${slug}/`);
      return data;
    } catch (error: any) {
      console.log(`GET /products/${slug}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async categories() {
    try {
      const { data } = await api.get<Category[] | { results: Category[] }>('/categories/');
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /categories/ error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

/// Cart Api with error handling and fallback logic
export const cartApi = {
  async ensure() {
    try {
      const { data } = await api.post<Cart>('/cart/', {});
      return data;
    } catch (postError: any) {
      console.log('POST /cart/ error:', postError?.response?.data || postError.message);

      try {
        const { data } = await api.get<Cart[] | { results: Cart[] }>('/cart/');
        const list = normalizeList(data);
        return list[0];
      } catch (getError: any) {
        console.log('GET /cart/ error:', getError?.response?.data || getError.message);
        throw getError;
      }
    }
  },

  async listItems() {
    try {
      const { data } = await api.get<CartItem[] | { results: CartItem[] }>('/cart-items/');
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /cart-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async addItem(payload: { variant_id: number; quantity: number }) {
    try {
      const { data } = await api.post<CartItem>('/cart-items/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /cart-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async updateItem(id: number, payload: { quantity: number }) {
    try {
      const { data } = await api.patch<CartItem>(`/cart-items/${id}/`, payload);
      return data;
    } catch (error: any) {
      console.log(`PATCH /cart-items/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async removeItem(id: number) {
    try {
      await api.delete(`/cart-items/${id}/`);
    } catch (error: any) {
      console.log(`DELETE /cart-items/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },
};

// Wishlist Api with error handling and fallback logic
export const wishlistApi = {
  async ensure() {
    try {
      const { data } = await api.post<Wishlist>('/wishlist/', {});
      return data;
    } catch (postError: any) {
      console.log('POST /wishlist/ error:', postError?.response?.data || postError.message);

      try {
        const { data } = await api.get<Wishlist[] | { results: Wishlist[] }>('/wishlist/');
        const list = normalizeList(data);
        return list[0];
      } catch (getError: any) {
        console.log('GET /wishlist/ error:', getError?.response?.data || getError.message);
        throw getError;
      }
    }
  },

  async listItems() {
    try {
      const { data } = await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/');
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /wishlist-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async addItem(payload: { product_id: number }) {
    try {
      const { data } = await api.post<WishlistItem>('/wishlist-items/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /wishlist-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async removeItem(id: number) {
    try {
      await api.delete(`/wishlist-items/${id}/`);
    } catch (error: any) {
      console.log(`DELETE /wishlist-items/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },
};

// Order Api with error handling and fallback logic
export const orderApi = {
  async list() {
    try {
      const { data } = await api.get<Order[] | { results: Order[] }>('/orders/');
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /orders/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async create(payload: { slug: string; description: string }) {
    try {
      const { data } = await api.post<Order>('/orders/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /orders/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async addItem(payload: {
    order: number;
    product: number;
    variant: number;
    quantity: number;
  }) {
    try {
      const { data } = await api.post<OrderItem>('/order-items/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /order-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// Notification Api with error handling and fallback logic
export const notificationApi = {
  async list() {
    try {
      const { data } = await api.get<Notification[] | { results: Notification[] }>('/notifications/');
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /notifications/ error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// Review Api with error handling and fallback logic
// export const reviewApi = {
//   listMine: async () => {
//     const { data } = await api.get('/reviews/?mine=true');

//     if (Array.isArray(data)) return data;
//     if (Array.isArray(data?.results)) return data.results;

//     return [];
//   },

//   create: async (payload: {
//     product: number;
//     rating: number;
//     comment: string;
//   }) => {
//     const { data } = await api.post('/reviews/', payload);
//     return data;
//   },

//   update: async (
//     id: number,
//     payload: Partial<{
//       rating: number;
//       comment: string;
//     }>
//   ) => {
//     const { data } = await api.patch(`/reviews/${id}/`, payload);
//     return data;
//   },
// };


export const reviewApi = {
  async listMine(params?: { product?: number; product_slug?: string }) {
    try {
      const { data } = await api.get<Review[] | { results: Review[] }>('/reviews/', {
        params,
      });
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /reviews/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async listByProduct(params: { product?: number; product_slug?: string }) {
    try {
      const { data } = await api.get<Review[] | { results: Review[] }>('/product-reviews/', {
        params,
      });
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /product-reviews/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async create(payload: {
    product: number;
    rating: number;
    comment: string;
  }) {
    try {
      const { data } = await api.post<Review>('/reviews/', payload);
      return data;
    } catch (error: any) {
      console.log('POST /reviews/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async update(
    id: number,
    payload: Partial<{
      rating: number;
      comment: string;
    }>
  ) {
    try {
      const { data } = await api.patch<Review>(`/reviews/${id}/`, payload);
      return data;
    } catch (error: any) {
      console.log(`PATCH /reviews/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/reviews/${id}/`);
    } catch (error: any) {
      console.log(`DELETE /reviews/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },
};

export const ratingApi = {
  async list(params?: { product?: number; product_slug?: string }) {
    try {
      const { data } = await api.get<ProductRating[] | { results: ProductRating[] }>('/ratings/', {
        params,
      });
      return normalizeList(data);
    } catch (error: any) {
      console.log('GET /ratings/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async byProduct(params: { product?: number; product_slug?: string }) {
    const list = await this.list(params);
    return list[0] || null;
  },
};

const toList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

// Address Api with error handling and fallback logic
export const addressApi = {
  list: async () => {
    const { data } = await api.get('/addresses/');
    return toList(data);
  },

  create: async (payload: {
    label: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    phone_number?: string;
    is_default?: boolean;
  }) => {
    const { data } = await api.post('/addresses/', payload);
    return data;
  },

  update: async (
    id: number,
    payload: Partial<{
      label: string;
      address_line1: string;
      address_line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      phone_number: string;
      is_default: boolean;
    }>
  ) => {
    const { data } = await api.patch(`/addresses/${id}/`, payload);
    return data;
  },

  remove: async (id: number) => {
    const { data } = await api.delete(`/addresses/${id}/`);
    return data;
  },
};