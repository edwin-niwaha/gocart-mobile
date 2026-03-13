import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useShop } from '@/providers/ShopProvider';

export default function CartScreen() {
  const { cart, getProductById, cartTotal, updateQuantity, removeFromCart } = useShop();

  return (
    <Screen>
      <Text style={styles.title}>Cart</Text>
      {cart.length ? (
        <>
          {cart.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            return (
              <View key={item.productId} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardMeta}>${product.price} each</Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => updateQuantity(item.productId, item.quantity - 1)} style={styles.circle}><Text>-</Text></Pressable>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQuantity(item.productId, item.quantity + 1)} style={styles.circle}><Text>+</Text></Pressable>
                </View>
                <Pressable onPress={() => removeFromCart(item.productId)}><Text style={styles.remove}>Remove</Text></Pressable>
              </View>
            );
          })}
          <View style={styles.summary}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={styles.summaryValue}>$8.00</Text></View>
            <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>${(cartTotal + 8).toFixed(2)}</Text></View>
            <Pressable onPress={() => router.push('/checkout')} style={styles.checkoutButton}><Text style={styles.checkoutText}>Continue to checkout</Text></Pressable>
          </View>
        </>
      ) : (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Your cart is empty</Text><Text style={styles.emptyText}>Add a few products to start checkout.</Text></View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 10 },
  cardTitle: { fontWeight: '800', color: '#111827', fontSize: 16 },
  cardMeta: { color: '#6B7280', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '700' },
  remove: { color: '#DC2626', fontWeight: '600' },
  summary: { backgroundColor: '#111827', borderRadius: 24, padding: 18, gap: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#D1D5DB' },
  summaryValue: { color: '#fff', fontWeight: '700' },
  totalLabel: { color: '#fff', fontWeight: '800', fontSize: 18 },
  totalValue: { color: '#fff', fontWeight: '800', fontSize: 18 },
  checkoutButton: { backgroundColor: '#fff', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  checkoutText: { color: '#111827', fontWeight: '800' },
  empty: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontWeight: '800', fontSize: 18, color: '#111827' },
  emptyText: { color: '#6B7280' },
});
