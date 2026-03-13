import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { money } from '@/utils/format';

export default function OrdersScreen() {
  const { orders, loadAuthedData } = useShop();

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, []);

  return (
    <Screen scroll>
      <AuthGate message="Log in to view your backend order history.">
        {!orders.length ? <EmptyState title="No orders yet" subtitle="Place an order from checkout and it will appear here." /> : null}
        {orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.row}><Text style={styles.slug}>{order.slug}</Text><Text style={styles.status}>{order.status || 'pending'}</Text></View>
            <Text style={styles.amount}>{money(order.total_price)}</Text>
            <Text style={styles.meta}>{order.items?.length ?? 0} item(s)</Text>
            {order.items?.map((item) => (
              <Text key={item.id} style={styles.item}>• {item.product_title || item.product_slug || `Product #${item.product}`} × {item.quantity}</Text>
            ))}
          </View>
        ))}
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  slug: { fontWeight: '800', color: colors.text, flex: 1 },
  status: { color: colors.primary, fontWeight: '700', textTransform: 'capitalize' },
  amount: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { color: colors.muted },
  item: { color: colors.text },
});
