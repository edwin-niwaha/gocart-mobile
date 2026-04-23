import { useEffect, useMemo } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { CartRow } from '@/components/CartRow';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useAuth } from '@/providers/AuthProvider';
import { money } from '@/utils/format';

export default function CartScreen() {
  const { cartItems, loadAuthedData, updateCartQty, removeCartItem, loading } = useShop();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAuthedData().catch(() => undefined);
    }
  }, [isAuthenticated, user, loadAuthedData]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const lineTotal =
        item.line_total != null
          ? Number(item.line_total)
          : Number(item.variant?.price || 0) * item.quantity;

      return sum + lineTotal;
    }, 0);
  }, [cartItems]);

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
      <AuthGate message="Log in to view your cart and place orders.">
        {loading && !cartItems.length ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your cart...</Text>
          </View>
        ) : !cartItems.length ? (
          <EmptyState
            title="Your cart is empty"
            subtitle="Add products from the shop to start checkout."
          />
        ) : null}

        {cartItems.map((item) => {
          const canDecrease = item.quantity > 1;

          return (
            <CartRow
              key={item.id}
              item={item}
              onMinus={() => {
                if (canDecrease) {
                  updateCartQty(item.id, item.quantity - 1);
                }
              }}
              onPlus={() => updateCartQty(item.id, item.quantity + 1)}
              onRemove={() => removeCartItem(item.id)}
            />
          );
        })}

        {!!cartItems.length && (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{money(total)}</Text>

            <Link href="/checkout" asChild>
              <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Proceed to checkout</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 8,
  },
  summaryLabel: {
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '700',
  },
});
