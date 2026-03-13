import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Product } from '@/data/products';
import { useShop } from '@/providers/ShopProvider';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const liked = wishlist.includes(product.id);

  return (
    <Pressable onPress={() => router.push(`/product/${product.id}`)} style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
      <Pressable onPress={() => toggleWishlist(product.id)} style={styles.likeButton}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#E11D48' : '#111827'} />
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.category}>{product.category}</Text>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text style={styles.rating}>⭐ {product.rating} ({product.reviews})</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.price}>${product.price}</Text>
            {product.oldPrice ? <Text style={styles.oldPrice}>${product.oldPrice}</Text> : null}
          </View>
          <Pressable onPress={() => addToCart(product.id)} style={styles.addButton}>
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: 160, backgroundColor: '#E5E7EB' },
  likeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 12, gap: 6 },
  category: { color: '#6B7280', fontSize: 12 },
  name: { color: '#111827', fontWeight: '700', fontSize: 15, minHeight: 40 },
  rating: { color: '#6B7280', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#111827', fontWeight: '800', fontSize: 18 },
  oldPrice: { color: '#9CA3AF', fontSize: 12, textDecorationLine: 'line-through' },
  addButton: {
    backgroundColor: '#111827',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
