import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';

import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { getErrorMessage, shippingApi } from '@/api/services';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { money } from '@/utils/format';
import type { Shipment } from '@/types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium' }).format(date);
}

function statusColor(status?: string) {
  switch (String(status || '').toUpperCase()) {
    case 'DELIVERED':
      return colors.success;
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return '#2563EB';
    case 'CANCELLED':
      return colors.danger;
    default:
      return colors.warning;
  }
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const color = statusColor(shipment.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube-outline" size={19} color={colors.primary} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {shipment.order_slug ? `Order ${shipment.order_slug}` : `Shipment #${shipment.id}`}
          </Text>
          <Text style={styles.cardSubtitle}>
            {shipment.shipping_method_name || 'Shipping method pending'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.badgeText, { color }]}>
            {String(shipment.status || 'PENDING').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.metaLabel}>Shipping fee</Text>
          <Text style={styles.amount}>{money(shipment.shipping_fee || 0)}</Text>
        </View>
        <Text style={styles.detailText}>Address #{shipment.address || '-'}</Text>
      </View>

      <View style={styles.detailBox}>
        <Text style={styles.metaLabel}>Tracking number</Text>
        <Text style={styles.trackingText} numberOfLines={2}>
          {shipment.tracking_number || 'Not assigned yet'}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateBox}>
          <Text style={styles.metaLabel}>Created</Text>
          <Text style={styles.detailText}>{formatDate(shipment.created_at)}</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.metaLabel}>Updated</Text>
          <Text style={styles.detailText}>{formatDate(shipment.updated_at)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function AccountShipmentsScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadShipments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      setShipments(await shippingApi.shipments());
    } catch (err: unknown) {
      setShipments([]);
      setError(getErrorMessage(err, 'Failed to load shipments.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShipments().catch(() => undefined);
  }, [loadShipments]);

  const filteredShipments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return shipments;

    return shipments.filter((shipment) =>
      [
        shipment.order_slug,
        shipment.status,
        shipment.tracking_number,
        shipment.shipping_method_name,
        shipment.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [shipments, search]);

  const deliveredCount = useMemo(
    () =>
      shipments.filter(
        (shipment) => String(shipment.status).toUpperCase() === 'DELIVERED'
      ).length,
    [shipments]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Shipments' }} />
      <Screen>
        <AuthGate message="Log in to view shipments.">
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadShipments(true)}
                tintColor={colors.primary}
              />
            }
          >
            <PageHeader
              icon="cube"
              title="Shipments"
              subtitle="Follow delivery status and tracking details"
              tone="primary"
            >
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{shipments.length}</Text>
                  <Text style={styles.metricLabel}>Shipments</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{deliveredCount}</Text>
                  <Text style={styles.metricLabel}>Delivered</Text>
                </View>
              </View>
            </PageHeader>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search shipments"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>

            {loading ? (
              <View style={styles.centerCard}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.centerText}>Loading shipments...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerCard}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={() => loadShipments()} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : !filteredShipments.length ? (
              <View style={styles.centerCard}>
                <EmptyState
                  title="No shipments found"
                  subtitle="Shipment records appear after orders are prepared for delivery."
                />
              </View>
            ) : (
              filteredShipments.map((shipment) => (
                <ShipmentCard key={shipment.id} shipment={shipment} />
              ))
            )}
          </ScrollView>
        </AuthGate>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: 150,
    gap: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  metricValue: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 3,
    color: '#D6E4DF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  searchWrap: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  card: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.subtle,
    textTransform: 'uppercase',
  },
  amount: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  detailBox: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  trackingText: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateBox: {
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  detailText: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  centerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '800',
  },
});
