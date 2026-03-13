import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useShop } from '@/providers/ShopProvider';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProductById, addToCart, toggleWishlist, wishlist } = useShop();
  const product = getProductById(id);

  if (!product) {
    return (
      <Screen>
        <Text style={styles.notFound}>Product not found.</Text>
      </Screen>
    );
  }

  const liked = wishlist.includes(product.id);

  return (
    <Screen>
      <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.rating}>⭐ {product.rating} · {product.reviews} reviews</Text>
        </View>
        <Pressable onPress={() => toggleWishlist(product.id)} style={styles.iconButton}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#E11D48' : '#111827'} />
        </Pressable>
      </View>
      <Text style={styles.price}>${product.price}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <View style={styles.tagsRow}>
        {(product.tags ?? []).map((tag) => (
          <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
        ))}
      </View>
      <Text style={styles.stock}>In stock: {product.stock}</Text>
      <Pressable onPress={() => addToCart(product.id)} style={styles.button}><Text style={styles.buttonText}>Add to cart</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 300, borderRadius: 24, backgroundColor: '#E5E7EB' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  category: { color: '#6B7280', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  rating: { color: '#6B7280', marginTop: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: 30, fontWeight: '800', color: '#111827' },
  description: { color: '#4B5563', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  tagText: { color: '#111827', fontWeight: '600' },
  stock: { color: '#059669', fontWeight: '700' },
  button: { backgroundColor: '#111827', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  notFound: { fontSize: 18, color: '#111827', fontWeight: '700' },
});
