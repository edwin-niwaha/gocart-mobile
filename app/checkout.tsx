import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useShop } from '@/providers/ShopProvider';

export default function CheckoutScreen() {
  const { cart, cartTotal, checkout } = useShop();

  const handleCheckout = () => {
    const order = checkout();
    if (!order) return;
    Alert.alert('Order placed', `Your order ${order.id} was created successfully.`);
    router.replace('/orders');
  };

  return (
    <Screen>
      <Text style={styles.title}>Checkout</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery address</Text>
        <Text style={styles.cardText}>Kampala Road, Kampala</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>
        <Text style={styles.cardText}>Card ending in 2048</Text>
      </View>
      <View style={styles.summary}>
        <View style={styles.row}><Text style={styles.label}>Items</Text><Text style={styles.value}>{cart.length}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>${cartTotal.toFixed(2)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Shipping</Text><Text style={styles.value}>$8.00</Text></View>
        <View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>${(cartTotal + 8).toFixed(2)}</Text></View>
      </View>
      <Pressable onPress={handleCheckout} disabled={!cart.length} style={[styles.button, !cart.length && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>Place order</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 8 },
  cardTitle: { color: '#111827', fontWeight: '800', fontSize: 16 },
  cardText: { color: '#6B7280' },
  summary: { backgroundColor: '#111827', borderRadius: 24, padding: 18, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#D1D5DB' },
  value: { color: '#fff', fontWeight: '700' },
  totalLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  totalValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  button: { backgroundColor: '#111827', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
