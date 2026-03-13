import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useShop } from '@/providers/ShopProvider';

export default function OrdersScreen() {
  const { orders } = useShop();

  return (
    <Screen>
      <Text style={styles.title}>Orders</Text>
      {orders.length ? (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.id}>{order.id}</Text>
            <Text style={styles.meta}>{new Date(order.createdAt).toLocaleString()}</Text>
            <Text style={styles.meta}>{order.items.length} items</Text>
            <Text style={styles.total}>${order.total.toFixed(2)}</Text>
          </View>
        ))
      ) : (
        <View style={styles.empty}><Text style={styles.emptyTitle}>No orders yet</Text><Text style={styles.emptyText}>Complete checkout to see orders here.</Text></View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 6 },
  id: { color: '#111827', fontSize: 18, fontWeight: '800' },
  meta: { color: '#6B7280' },
  total: { color: '#111827', fontWeight: '800', fontSize: 18, marginTop: 4 },
  empty: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { fontWeight: '800', fontSize: 18, color: '#111827' },
  emptyText: { color: '#6B7280' },
});
