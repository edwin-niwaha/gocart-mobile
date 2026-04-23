import { isAxiosError } from 'axios';
import { api } from '@/api/client';
import { normalizeList } from '@/utils/format';
import { logError } from '@/utils/logger';

import type {
  AuthResponse,
  Cart,
  CartItem,
  Category,
  CustomerAddress,
  CustomerAddressPayload,
  ListResponse,
  Notification,
  Order,
  OrderItem,
  PaginatedResponse,
  Product,
  ProductRating,
  Review,
  User,
  Wishlist,
  WishlistItem,
} from '@/types';

type ErrorPayload = Record<string, unknown> | string | unknown[] | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value) && value.length) return firstString(value[0]);
  return null;
}

export function getApiErrorData(error: unknown): ErrorPayload {
  if (isAxiosError(error)) {
    return error.response?.data as ErrorPayload;
  }

  if (isRecord(error)) {
    const response = error.response;
    if (isRecord(response) && 'data' in response) {
      return response.data as ErrorPayload;
    }
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  const data =
    getApiErrorData(error) ??
    (typeof error === 'string' || Array.isArray(error) || isRecord(error)
      ? (error as ErrorPayload)
      : null);

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (Array.isArray(data) && data.length) {
    return String(data[0]);
  }

  if (isRecord(data)) {
    const orderedFields = [
      'detail',
      'message',
      'non_field_errors',
      'email',
      'username',
      'password',
      'password_confirm',
      'code',
      'quantity',
      'variant_id',
      'product_id',
      'rating',
      'street_name',
      'city',
      'phone_number',
      'additional_telephone',
      'additional_information',
      'region',
      'is_default',
      'address_id',
    ];

    for (const field of orderedFields) {
      const message = firstString(data[field]);
      if (message) return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function logApiError(message: string, error: unknown) {
  logError(message, getApiErrorData(error) ?? error);
}

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as PaginatedResponse<T>;

  return (
    typeof candidate.count === 'number' &&
    Array.isArray(candidate.results) &&
    'next' in candidate &&
    'previous' in candidate
  );
}

function toList<T>(data: ListResponse<T> | { results?: T[] } | unknown): T[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.results)) return data.results as T[];
  return [];
}



// Auth API
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
      logApiError('POST /auth/register/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async login(payload: { email: string; password: string }) {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login/', payload);
      return data;
    } catch (error: any) {
      logApiError('POST /auth/login/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async me() {
    try {
      const { data } = await api.get<User>('/auth/me/');
      return data;
    } catch (error: any) {
      logApiError('GET /auth/me/ error:', error?.response?.data || error.message);
      throw error;
    }
  },


  async updateProfile(payload: FormData) {
    try {
      const { data } = await api.patch<User>('/auth/me/', payload, {
        headers: {
          Accept: 'application/json',
        },
      });
      return data;
    } catch (error: any) {
      logApiError('PATCH /auth/me/ multipart error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async updateProfileJson(payload: {
    username: string;
    first_name: string;
    last_name: string;
  }) {
    try {
      const { data } = await api.patch('/auth/me/', payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return data;
    } catch (error: any) {
      logApiError('PATCH /auth/me/ JSON error:', error);
      throw error;
    }
  },

  async logout(refresh?: string | null) {
    if (!refresh) return;

    try {
      await api.post('/auth/logout/', { refresh });
    } catch (error: any) {
      logApiError('POST /auth/logout/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async googleLogin(access_token: string) {
    try {
      const { data } = await api.post<AuthResponse>('/auth/social/google/', {
        access_token,
      });
      return data;
    } catch (error: any) {
      logApiError(
        'POST /auth/social/google/ error:',
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async forgotPassword(email: string) {
    const { data } = await api.post('/auth/forgot-password/', { email });
    return data;
  },

  async resetPassword(payload: {
    email: string;
    code: string;
    password: string;
    password_confirm: string;
  }) {
    const { data } = await api.post('/auth/reset-password/', payload);
    return data;
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }) {
    const { data } = await api.post('/auth/change-password/', payload);
    return data;
  },

  async sendEmailVerification() {
    const { data } = await api.post('/auth/send-email-verification/');
    return data;
  },

  async verifyEmail(code: string) {
    const { data } = await api.post('/auth/verify-email/', { code });
    return data;
  },
};


// Catalog API
export const catalogApi = {
  async products(params?: {
    search?: string;
    category?: number | string;
    is_featured?: boolean;
    is_active?: boolean;
    ordering?: string;
  }) {
    try {
      const { data } = await api.get<Product[] | { results: Product[] }>('/products/', {
        params: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.category !== undefined ? { category: params.category } : {}),
          ...(params?.is_featured !== undefined
            ? { is_featured: params.is_featured }
            : {}),
          ...(params?.is_active !== undefined ? { is_active: params.is_active } : {}),
          ...(params?.ordering ? { ordering: params.ordering } : {}),
        },
      });
      return normalizeList(data);
    } catch (error: any) {
      logApiError('GET /products/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async product(slug: string) {
    try {
      const { data } = await api.get<Product>(`/products/${slug}/`);
      return data;
    } catch (error: any) {
      logApiError(`GET /products/${slug}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async categories(params?: {
    search?: string;
    is_active?: boolean;
    ordering?: string;
  }) {
    try {
      const { data } = await api.get<Category[] | { results: Category[] }>('/categories/', {
        params: {
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.is_active !== undefined ? { is_active: params.is_active } : {}),
          ...(params?.ordering ? { ordering: params.ordering } : {}),
        },
      });
      return normalizeList(data);
    } catch (error: any) {
      logApiError('GET /categories/ error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// Cart API
export const cartApi = {
  async ensure() {
    try {
      const { data } = await api.post<Cart>('/cart/', {});
      return data;
    } catch (postError: any) {
      logApiError('POST /cart/ error:', postError?.response?.data || postError.message);

      try {
        const { data } = await api.get<Cart[] | { results: Cart[] }>('/cart/');
        const list = normalizeList(data);
        return list[0];
      } catch (getError: any) {
        logApiError('GET /cart/ error:', getError?.response?.data || getError.message);
        throw getError;
      }
    }
  },

  async listItems() {
    try {
      const { data } = await api.get<CartItem[] | { results: CartItem[] }>('/cart-items/');
      return normalizeList(data);
    } catch (error: any) {
      logApiError('GET /cart-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async addItem(payload: { variant_id: number; quantity: number }) {
    try {
      const { data } = await api.post<CartItem>('/cart-items/', payload);
      return data;
    } catch (error: any) {
      logApiError('POST /cart-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async updateItem(id: number, payload: { quantity: number }) {
    try {
      const { data } = await api.patch<CartItem>(`/cart-items/${id}/`, payload);
      return data;
    } catch (error: any) {
      logApiError(`PATCH /cart-items/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async removeItem(id: number) {
    try {
      await api.delete(`/cart-items/${id}/`);
    } catch (error: any) {
      logApiError(`DELETE /cart-items/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },
};

export const newsletterApi = {
  async subscribe(email: string) {
    try {
      const { data } = await api.post('/newsletter/', { email });
      return data;
    } catch (error: any) {
      logApiError(
        'POST /newsletter/ error:',
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async confirm(token: string) {
    try {
      const { data } = await api.get(
        `/newsletter/confirm/?token=${encodeURIComponent(token)}`
      );
      return data;
    } catch (error: any) {
      logApiError(
        'GET /newsletter/confirm/ error:',
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async unsubscribe(email: string) {
    try {
      const { data } = await api.post('/newsletter/unsubscribe/', { email });
      return data;
    } catch (error: any) {
      logApiError(
        'POST /newsletter/unsubscribe/ error:',
        error?.response?.data || error.message
      );
      throw error;
    }
  },
};

export const wishlistApi = {
  async ensure() {
    try {
      const { data } = await api.post<Wishlist>('/wishlist/', {});
      return data;
    } catch (postError: any) {
      logApiError('POST /wishlist/ error:', postError?.response?.data || postError.message);

      try {
        const { data } = await api.get<Wishlist[] | { results: Wishlist[] }>('/wishlist/');
        const list = normalizeList(data);
        return list[0];
      } catch (getError: any) {
        logApiError('GET /wishlist/ error:', getError?.response?.data || getError.message);
        throw getError;
      }
    }
  },

  async listItems() {
    try {
      const { data } = await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/');
      return normalizeList(data);
    } catch (error: any) {
      logApiError('GET /wishlist-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async addItem(payload: { product_id: number }) {
    try {
      const { data } = await api.post<WishlistItem>('/wishlist-items/', payload);
      return data;
    } catch (error: any) {
      logApiError('POST /wishlist-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async removeItem(id: number) {
    try {
      await api.delete(`/wishlist-items/${id}/`);
    } catch (error: any) {
      logApiError(`DELETE /wishlist-items/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },
};

// Orders API
export const orderApi = {
  async list(url?: string): Promise<ListResponse<Order>> {
    try {
      const endpoint = url ?? '/orders/';
      const { data } = await api.get<ListResponse<Order>>(endpoint);

      if (Array.isArray(data)) {
        return data;
      }

      if (isPaginatedResponse<Order>(data)) {
        return data;
      }

      return [];
    } catch (error: any) {
      logApiError(
        `GET ${url ?? '/orders/'} error:`,
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async checkout(payload: {
    address_id: number;
    description?: string;
    payment_method?: string;
    shipping_method_id?: number;
    coupon_code?: string;
  }): Promise<Order> {
    try {
      const { data } = await api.post<
        | Order
        | {
            order?: Order;
            payment_reference?: string | null;
            payment_status?: string | null;
            payment_provider?: string | null;
          }
      >('/orders/checkout/', payload);

      const wrapped = data as { order?: unknown };
      if (isRecord(data) && isRecord(wrapped.order)) {
        return wrapped.order as Order;
      }

      return data as Order;
    } catch (error: any) {
      logApiError('POST /orders/checkout/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async create(payload: {
    slug: string;
    description: string;
    address_id: number;
  }) {
    try {
      const { data } = await api.post<Order>('/orders/', payload);
      return data;
    } catch (error: any) {
      logApiError('POST /orders/ error:', error?.response?.data || error.message);
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
      logApiError('POST /order-items/ error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// Notifications API
export const notificationApi = {
  async list(url?: string): Promise<ListResponse<Notification>> {
    try {
      const endpoint = url ?? '/notifications/';
      const { data } = await api.get<ListResponse<Notification>>(endpoint);

      if (Array.isArray(data)) {
        return data;
      }

      if (isPaginatedResponse<Notification>(data)) {
        return data;
      }

      return [];
    } catch (error: any) {
      logApiError(
        `GET ${url ?? '/notifications/'} error:`,
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async markRead(id: number) {
    try {
      const { data } = await api.post<Notification>(`/notifications/${id}/mark_read/`);
      return data;
    } catch (error: any) {
      logApiError(
        `POST /notifications/${id}/mark_read/ error:`,
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async markAllRead() {
    try {
      const { data } = await api.post('/notifications/mark_all_read/');
      return data;
    } catch (error: any) {
      logApiError(
        'POST /notifications/mark_all_read/ error:',
        error?.response?.data || error.message
      );
      throw error;
    }
  },
};

export const reviewApi = {
  async listMine(params?: { product?: number; product_slug?: string }) {
    try {
      const { data } = await api.get<Review[] | { results: Review[] }>('/reviews/', {
        params,
      });
      return normalizeList(data);
    } catch (error: any) {
      logApiError('GET /reviews/ error:', error?.response?.data || error.message);
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
      logApiError('GET /product-reviews/ error:', error?.response?.data || error.message);
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
      logApiError('POST /reviews/ error:', error?.response?.data || error.message);
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
      logApiError(`PATCH /reviews/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/reviews/${id}/`);
    } catch (error: any) {
      logApiError(`DELETE /reviews/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async myReviewForProduct(product_slug: string) {
    try {
      const { data } = await api.get<Review[] | { results: Review[] }>('/reviews/', {
        params: { product_slug },
      });

      const reviews = normalizeList(data);
      return reviews[0] ?? null;
    } catch (error: any) {
      logApiError('GET /reviews/ myReviewForProduct error:', error?.response?.data || error.message);
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
      logApiError('GET /ratings/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async byProduct(params: { product?: number; product_slug?: string }) {
    const list = await this.list(params);
    return list[0] || null;
  },
};

export const addressApi = {
  async list() {
    try {
      const { data } = await api.get<CustomerAddress[] | { results: CustomerAddress[] }>('/addresses/');
      return toList<CustomerAddress>(data);
    } catch (error: any) {
      logApiError('GET /addresses/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async create(payload: CustomerAddressPayload) {
    try {
      const { data } = await api.post<CustomerAddress>('/addresses/', payload);
      return data;
    } catch (error: any) {
      logApiError('POST /addresses/ error:', error?.response?.data || error.message);
      throw error;
    }
  },

  async update(id: number, payload: CustomerAddressPayload) {
    try {
      const { data } = await api.patch<CustomerAddress>(`/addresses/${id}/`, payload);
      return data;
    } catch (error: any) {
      logApiError(`PATCH /addresses/${id}/ error:`, error?.response?.data || error.message);
      throw error;
    }
  },

  async remove(id: number) {
    try {
      const { data } = await api.delete(`/addresses/${id}/`);
      return data;
    } catch (error: any) {
      logApiError(`DELETE /addresses/${id}/ error:`, error?.response?.data || error.message);

      const message =
        error?.response?.data?.detail ||
        'Failed to delete address. Please try again.';

      throw new Error(message);
    }
  },

};

// paymentApi
export type PaymentProvider = 'CASH' | 'MTN' | 'AIRTEL';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface CreatePaymentPayload {
  order: number;
  provider: PaymentProvider;
  amount: number;
  currency?: string;
}

export interface InitiateMTNPayload {
  address_id: number;
  phone_number: string;
}

export interface InitiateMTNResponse {
  reference: string;
  external_id: string;
  status: PaymentStatus;
  amount: string | number;
  currency: string;
}

export interface PaymentStatusResponse {
  reference: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: string | number;
  currency: string;
  phone_number: string;
  external_id: string;
  transaction_id: string;
  provider_response: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinalizeOrderResponse {
  order: {
    id: number;
    slug: string;
    [key: string]: unknown;
  };
  payment_reference: string;
}

export const paymentApi = {
  async create(payload: CreatePaymentPayload) {
    const { data } = await api.post('/payments/', payload);
    return data;
  },

  async initiateMTN(payload: InitiateMTNPayload): Promise<InitiateMTNResponse> {
    const { data } = await api.post('/payments/mtn/initiate/', payload);
    return data;
  },

  async checkStatus(reference: string): Promise<PaymentStatusResponse> {
    const { data } = await api.get(`/payments/${reference}/status/`);
    return data;
  },

  async finalizeOrder(reference: string): Promise<FinalizeOrderResponse> {
    const { data } = await api.post(`/payments/${reference}/finalize-order/`);
    return data;
  },
};
