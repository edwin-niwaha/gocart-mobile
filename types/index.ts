export type Tokens = {
  access: string;
  refresh: string;
};

export type UserType = 'USER' | 'ADMIN';

export type User = {
  id: number;
  email: string;
  username: string;
  is_email_verified: boolean;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  user_type?: UserType;
  is_active?: boolean;
  created_at?: string;
};

export type AuthResponse = {
  user: User;
  tokens: Tokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
};

export type ResetPasswordPayload = {
  email: string;
  code: string;
  password: string;
  password_confirm: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ListResponse<T> = T[] | PaginatedResponse<T>;

export type Category = {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductVariant = {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock_quantity: number;
  max_quantity_per_order?: number | null;
  is_active: boolean;
  sort_order: number;
  is_in_stock: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: number;
  title: string;
  slug: string;
  description: string;
  hero_image?: string | null;
  image_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  base_price: string;
  is_in_stock: boolean;
  category: Category | null;
  variants: ProductVariant[];
  average_rating?: string;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
};

export type ProductPayloadVariant = {
  id?: number;
  name: string;
  sku?: string;
  price: string;
  stock_quantity?: number;
  max_quantity_per_order?: number | null;
  is_active?: boolean;
  sort_order?: number;
};

export type ProductPayload = {
  title: string;
  slug?: string;
  description?: string;
  hero_image?: string | null;
  image_urls?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  category_id: number;
  variants: ProductPayloadVariant[];
};

export type CartItem = {
  id: number;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  unit_price?: string | number;
  line_total?: string | number;
};

export type Cart = {
  id: number;
  items: CartItem[];
  total_items: number;
  total_price: string | number;
};

export type WishlistItem = {
  id: number;
  product: Product;
};

export type Wishlist = {
  id: number;
  items: WishlistItem[];
  total_items: number;
};

export type OrderItem = {
  id: number;
  product: number;
  variant?: number | null;
  product_title?: string;
  product_slug?: string;
  variant_name?: string;
  quantity: number;
  unit_price?: string | number;
  line_total?: string | number;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'completed';

export type DeliveryOption = 'HOME_DELIVERY' | 'PICKUP_STATION';

export type Order = {
  id: number;
  slug: string;
  status?: OrderStatus | string;
  delivery_option?: DeliveryOption;
  description?: string;
  items_subtotal?: string | number;
  discount_amount?: string | number;
  shipping_fee?: string | number;
  total_price?: string | number;
  pickup_station_id?: number | null;
  pickup_station_name?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
};

export type OrderListResponse = ListResponse<Order>;
export type PaginatedOrderResponse = PaginatedResponse<Order>;

export type CheckoutOrderPayload = {
  address_id: number;
  description?: string;
  delivery_option?: DeliveryOption;
  pickup_station_id?: number | null;
};

export type CheckoutResponse = {
  order: Order;
  payment_reference: string;
  payment_status: string;
  payment_provider: string;
};

export type CreateOrderPayload = {
  slug: string;
  description: string;
  address_id: number;
};

export type NotificationType =
  | 'order'
  | 'promotion'
  | 'system'
  | 'delivery'
  | 'general'
  | string;

export type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type?: NotificationType;
  is_read: boolean;
  created_at?: string;
  read_at?: string | null;
};

export type NotificationListResponse = ListResponse<Notification>;
export type PaginatedNotificationResponse = PaginatedResponse<Notification>;

export type ReviewUser = {
  id: number;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type Review = {
  id: number;
  user: ReviewUser;
  user_id: number;
  product: number;
  product_title: string;
  product_slug: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type ProductRating = {
  id: number;
  product: number;
  product_title?: string;
  product_slug?: string;
  average_rating: string | number;
  total_reviews: number;
  created_at?: string;
  updated_at?: string;
};

export type CustomerAddressRegion =
  | 'kampala_area'
  | 'entebbe_area'
  | 'central_region'
  | 'eastern_region'
  | 'northern_region'
  | 'western_region'
  | 'rest_of_kampala';

export type CustomerAddress = {
  id: number;
  street_name: string;
  city: string;
  phone_number?: string | null;
  additional_telephone?: string | null;
  additional_information?: string | null;
  region: CustomerAddressRegion;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PickupStation = {
  id: number;
  name: string;
  city: string;
  area: string;
  address: string;
  phone?: string | null;
  opening_hours?: string | null;
  fee: string | number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateCustomerAddressPayload = {
  street_name: string;
  city: string;
  phone_number?: string;
  additional_telephone?: string;
  additional_information?: string;
  region?: CustomerAddressRegion;
  is_default?: boolean;
};

export type UpdateCustomerAddressPayload = Partial<CreateCustomerAddressPayload>;

export type CustomerAddressPayload =
  | CreateCustomerAddressPayload
  | UpdateCustomerAddressPayload;
