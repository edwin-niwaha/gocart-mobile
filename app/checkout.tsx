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

  const total = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.line_total ?? Number(item.variant?.price || 0) * item.quantity),
    0
  );

  const onPlaceOrder = async () => {
    setLoading(true);
    try {
      const order = await checkout();

      Alert.alert(
        'Order placed',
        `Your order ${order.slug} was created successfully.`,
        [{ text: 'View orders', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Checkout failed',
        error?.response?.data?.detail ||
        error?.message ||
        'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <AuthGate message="Please log in before placing an order.">
        <View style={styles.container}>
          {cartItems.length ? (
            <View style={styles.topRow}>
              <Text style={styles.countPill}>
                {cartItems.length} item{cartItems.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.title}>Order summary</Text>

            <View style={styles.divider} />

            {cartItems.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.itemInfo}>
                  <Text numberOfLines={2} style={styles.itemText}>
                    {item.product.title}
                  </Text>

                  <Text style={styles.itemMeta}>
                    Qty {item.quantity}
                    {item.variant?.name ? ` • ${item.variant.name}` : ''}
                  </Text>
                </View>

                <Text style={styles.price}>
                  {money(
                    item.line_total ??
                    Number(item.variant?.price || 0) * item.quantity
                  )}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.button,
              (!cartItems.length || loading) && styles.buttonDisabled,
            ]}
            onPress={onPlaceOrder}
            disabled={loading || !cartItems.length}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Placing order...' : 'Place order'}
            </Text>
          </Pressable>
        </View>
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  countPill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },

  itemInfo: {
    flex: 1,
    gap: 4,
  },

  itemText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  itemMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  price: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 14,
  },

  totalRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
});