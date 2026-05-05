import { useMemo } from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PageHeader } from '@/components/AppHeader';
import { CartRow } from '@/components/CartRow';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useAuth } from '@/providers/AuthProvider';
import { money } from '@/utils/format';
import { getCartTotal } from '@/utils/product';

export default function CartScreen() {
  const { cartItems, updateCartQty, removeCartItem, loading } = useShop();
  const { isAuthenticated } = useAuth();

  const total = useMemo(() => {
    return getCartTotal(cartItems);
  }, [cartItems]);

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
        <PageHeader
          icon="cart"
          title="Shopping Cart"
          subtitle="Review your bag before checkout"
          tone="dark"
          style={styles.pageHeader}
        >
          <View style={styles.cartStatsRow}>
            <View>
              <Text style={styles.statLabel}>Items</Text>
              <Text style={styles.statValue}>{cartItems.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statLabel}>Subtotal</Text>
              <Text style={styles.statValue}>{money(total)}</Text>
            </View>
          </View>
        </PageHeader>

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
              onMinus={
                canDecrease
                  ? () => updateCartQty(item.id, item.quantity - 1)
                  : undefined
              }
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
                <Ionicons
                  name={isAuthenticated ? 'card-outline' : 'log-in-outline'}
                  size={18}
                  color={colors.surface}
                />
                <Text style={styles.buttonText}>
                  {isAuthenticated ? 'Proceed to checkout' : 'Log in to checkout'}
                </Text>
              </Pressable>
            </Link>
          </View>
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    marginBottom: spacing.sm,
  },
  cartStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingTop: spacing.md,
  },
  statLabel: {
    color: '#D6E4DF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 3,
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 8,
    ...shadows.card,
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
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.soft,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '700',
  },
});
