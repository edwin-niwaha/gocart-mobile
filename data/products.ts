export type Category = 'Phones' | 'Fashion' | 'Beauty' | 'Home' | 'Gaming';

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  category: Category;
  image: string;
  description: string;
  stock: number;
  featured?: boolean;
  tags?: string[];
};

export const categories: Category[] = ['Phones', 'Fashion', 'Beauty', 'Home', 'Gaming'];

export const products: Product[] = [
  {
    id: '1',
    name: 'Nova X Pro',
    price: 899,
    oldPrice: 999,
    rating: 4.8,
    reviews: 212,
    category: 'Phones',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    description: 'Flagship phone with OLED display, 5G, and all-day battery.',
    stock: 14,
    featured: true,
    tags: ['5G', 'OLED', 'Fast charging'],
  },
  {
    id: '2',
    name: 'Stride Runner',
    price: 119,
    oldPrice: 149,
    rating: 4.5,
    reviews: 86,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    description: 'Comfort-first sneakers built for daily wear and light runs.',
    stock: 35,
    featured: true,
    tags: ['Breathable', 'Lightweight'],
  },
  {
    id: '3',
    name: 'Glow Kit',
    price: 42,
    rating: 4.6,
    reviews: 63,
    category: 'Beauty',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    description: 'Complete skincare bundle for a clean, hydrated routine.',
    stock: 22,
    tags: ['Clean beauty', 'Hydration'],
  },
  {
    id: '4',
    name: 'Aura Lamp',
    price: 69,
    oldPrice: 89,
    rating: 4.4,
    reviews: 49,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern smart lamp with warm scenes and app control.',
    stock: 17,
    tags: ['Smart home', 'Ambient'],
  },
  {
    id: '5',
    name: 'Pulse Controller',
    price: 79,
    rating: 4.7,
    reviews: 140,
    category: 'Gaming',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80',
    description: 'Wireless controller with low latency and ergonomic grip.',
    stock: 41,
    featured: true,
    tags: ['Wireless', 'Low latency'],
  },
  {
    id: '6',
    name: 'Urban Tote',
    price: 58,
    rating: 4.3,
    reviews: 31,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80',
    description: 'Minimal tote bag with roomy design for work or travel.',
    stock: 29,
    tags: ['Travel', 'Minimal'],
  },
];
