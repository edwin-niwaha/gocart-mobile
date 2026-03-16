export type Tokens = {
  access: string;
  refresh: string;
};

export type User = {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  user_type?: string;
  is_active?: boolean;
  created_at?: string;
};

export type AuthResponse = {
  user: User;
  tokens: Tokens;
};

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
  category?: Category | null;
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
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
  variant?: number;
  product_title?: string;
  product_slug?: string;
  variant_name?: string;
  quantity: number;
  unit_price?: string | number;
  line_total?: string | number;
};

export type Order = {
  id: number;
  slug: string;
  status?: string;
  description?: string;
  total_price?: string | number;
  items: OrderItem[];
  created_at?: string;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type?: string;
  is_read?: boolean;
  created_at?: string;
};

export type Review = {
  id: number;
  user: {
    id: number;
    email?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  user_id: number;
  product: number;
  product_title: string;
  product_slug: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type CustomerAddress = {
  id: number;
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_number: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerAddressPayload = {
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone_number?: string;
  is_default?: boolean;
};