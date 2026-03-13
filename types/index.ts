export type Tokens = { access: string; refresh: string };

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
  image_url?: string;
  is_active?: boolean;
};

export type Product = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  hero_image?: string;
  image_urls?: string[];
  price: string | number;
  stock_quantity?: number;
  max_quantity_per_order?: number;
  is_active?: boolean;
  is_in_stock?: boolean;
  category?: Category;
};

export type CartItem = {
  id: number;
  product: Product;
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
  product_title?: string;
  product_slug?: string;
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
