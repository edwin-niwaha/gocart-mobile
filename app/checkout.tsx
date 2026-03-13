import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { money } from '@/utils/format';

export default function CheckoutScreen() {
  const { cartItems, checkout } = useShop();
  const [loading, setLoading] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + Number(item.line_total ?? Number(item.product.price) * item.quantity), 0);

  const onPlaceOrder = async () => {
    setLoading(true);
    try {
      const order = await checkout();
      Alert.alert('Order placed', `Your order ${order.slug} was created successfully.`, [
        { text: 'View orders', onPress: () => router.replace('/(tabs)/orders') },
      ]);
    } catch (error: any) {
      Alert.alert('Checkout failed', error?.response?.data?.detail || error?.message || 'Please check your backend endpoints and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <AuthGate message="Please log in before placing an order.">
        <View style={styles.card}>
          <Text style={styles.title}>Order summary</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.itemText}>{item.product.title} × {item.quantity}</Text>
              <Text style={styles.itemText}>{money(item.line_total ?? Number(item.product.price) * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(total)}</Text>
          </View>
        </View>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Production setup</Text>
          <Text style={styles.noticeText}>This flow creates an order, creates each order item from the backend cart, then clears cart items. Add payments, addresses, shipping methods, and coupon validation on top of this foundation.</Text>
        </View>
        <Pressable style={styles.button} onPress={onPlaceOrder} disabled={loading || !cartItems.length}>
          <Text style={styles.buttonText}>{loading ? 'Placing order...' : 'Place order'}</Text>
        </Pressable>
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemText: { color: colors.text, flex: 1 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  notice: { backgroundColor: colors.primarySoft, borderRadius: 18, padding: spacing.lg, gap: 6 },
  noticeTitle: { fontWeight: '800', color: colors.text },
  noticeText: { color: colors.muted, lineHeight: 20 },
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '800' },
});
