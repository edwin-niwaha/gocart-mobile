import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { money } from '@/utils/format';

function getStatusColor(status?: string) {
  switch ((status || '').toUpperCase()) {
    case 'DELIVERED':
      return '#16a34a';
    case 'SHIPPED':
      return '#2563eb';
    case 'PROCESSING':
      return '#d97706';
    case 'PAID':
      return '#7c3aed';
    case 'CANCELLED':
      return '#dc2626';
    case 'PENDING':
    default:
      return colors.primary;
  }
}

function formatStatus(status?: string) {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function OrdersScreen() {
  const { orders, loadAuthedData } = useShop();

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any[]> = {};

    orders.forEach((order) => {
      const status = order.status || 'PENDING';

      if (!groups[status]) groups[status] = [];

      groups[status].push(order);
    });

    return groups;
  }, [orders]);

  return (
    <Screen scroll>
      <AuthGate message="Log in to view your order history.">
        <View style={styles.container}>
          {!orders.length ? (
            <EmptyState
              title="No orders yet"
              subtitle="Place an order from checkout and it will appear here."
            />
          ) : (
            Object.entries(groupedOrders).map(([status, orders]) => {
              const statusColor = getStatusColor(status);

              return (
                <View key={status} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {formatStatus(status)}
                    </Text>

                    <Text style={styles.countPill}>
                      {orders.length}
                    </Text>
                  </View>

                  {orders.map((order) => {
                    const itemCount =
                      order.items?.reduce(
                        (sum: number, item: any) => sum + item.quantity,
                        0
                      ) ?? 0;

                    return (
                      <View key={order.id} style={styles.card}>
                        <View style={styles.header}>
                          <View style={styles.headerText}>
                            <Text style={styles.slug}>
                              Order #{order.slug}
                            </Text>

                            <Text style={styles.meta}>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: `${statusColor}15`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: statusColor },
                              ]}
                            >
                              {formatStatus(status)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.amount}>
                          {money(order.total_price)}
                        </Text>

                        {!!order.items?.length && (
                          <View style={styles.itemsWrap}>
                            {order.items.map((item: any) => (
                              <View key={item.id} style={styles.itemRow}>
                                <View style={styles.dot} />

                                <Text style={styles.itemText}>
                                  {item.product_title ||
                                    item.product_slug ||
                                    `Product #${item.product}`}{' '}
                                  × {item.quantity}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },

  section: {
    gap: spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  countPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerText: {
    gap: 4,
  },

  slug: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },

  meta: {
    fontSize: 13,
    color: colors.muted,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  amount: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },

  itemsWrap: {
    gap: 8,
    paddingTop: 4,
  },

  itemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginTop: 6,
  },

  itemText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
});