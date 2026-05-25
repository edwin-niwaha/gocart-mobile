import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Linking,
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
import { getErrorMessage, paymentApi } from '@/api/services';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { money } from '@/utils/format';
import type { Payment } from '@/types';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function statusColor(status?: string) {
  switch (String(status || '').toUpperCase()) {
    case 'PAID':
      return colors.success;
    case 'FAILED':
    case 'CANCELLED':
      return colors.danger;
    case 'PROCESSING':
      return '#2563EB';
    case 'REFUNDED':
      return '#7C3AED';
    default:
      return colors.warning;
  }
}

function providerLabel(provider?: string) {
  const labels: Record<string, string> = {
    CARD: 'Card',
    CASH: 'Cash',
    FLUTTERWAVE: 'Flutterwave',
    MTN: 'MTN Mobile Money',
    PAYSTACK: 'Paystack',
    STRIPE: 'Stripe',
  };

  return labels[String(provider || '').toUpperCase()] || provider || 'Payment';
}

function getPaymentDocumentUrl(payment: Payment, key: 'receipt_url' | 'invoice_url') {
  const value = payment[key];
  return typeof value === 'string' && value.trim() ? value : '';
}

function PaymentCard({ payment }: { payment: Payment }) {
  const color = statusColor(payment.status);
  const refunds = Array.isArray(payment.refunds) ? payment.refunds : [];
  const receiptUrl = getPaymentDocumentUrl(payment, 'receipt_url');
  const invoiceUrl = getPaymentDocumentUrl(payment, 'invoice_url');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name="card-outline" size={19} color={colors.primary} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {payment.order_slug ? `Order ${payment.order_slug}` : payment.reference}
          </Text>
          <Text style={styles.cardSubtitle}>{providerLabel(payment.provider)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.badgeText, { color }]}>
            {String(payment.status || 'PENDING').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={styles.metaLabel}>Amount</Text>
          <Text style={styles.amount}>{money(payment.amount || 0)}</Text>
        </View>
        <Text style={styles.currency}>{payment.currency || 'UGX'}</Text>
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.metaLabel}>Reference</Text>
          <Text style={styles.detailText} numberOfLines={2}>
            {payment.reference || '-'}
          </Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.metaLabel}>Transaction</Text>
          <Text style={styles.detailText} numberOfLines={2}>
            {payment.transaction_id || '-'}
          </Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.metaLabel}>Created</Text>
          <Text style={styles.detailText}>{formatDate(payment.created_at)}</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.metaLabel}>Paid at</Text>
          <Text style={styles.detailText}>{formatDate(payment.paid_at)}</Text>
        </View>
      </View>

      {payment.refund_status || refunds.length > 0 ? (
        <View style={styles.refundBox}>
          <View style={styles.refundHeader}>
            <Text style={styles.refundTitle}>Refund status</Text>
            {payment.refund_status ? (
              <Text style={styles.refundStatus}>
                {String(payment.refund_status).toUpperCase()}
              </Text>
            ) : null}
          </View>

          {refunds.map((refund, index) => (
            <View
              key={refund.id ?? refund.reference ?? index}
              style={styles.refundItem}
            >
              <Text style={styles.refundAmount}>{money(refund.amount ?? 0)}</Text>
              <Text style={styles.refundMeta}>
                {String(refund.status || 'Refund').toUpperCase()}
                {refund.reason ? ` • ${refund.reason}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {receiptUrl || invoiceUrl ? (
        <View style={styles.documentRow}>
          {receiptUrl ? (
            <Pressable
              onPress={() => Linking.openURL(receiptUrl)}
              style={styles.documentButton}
            >
              <Ionicons name="receipt-outline" size={15} color={colors.primary} />
              <Text style={styles.documentButtonText}>Receipt</Text>
            </Pressable>
          ) : null}
          {invoiceUrl ? (
            <Pressable
              onPress={() => Linking.openURL(invoiceUrl)}
              style={styles.documentButton}
            >
              <Ionicons
                name="document-text-outline"
                size={15}
                color={colors.primary}
              />
              <Text style={styles.documentButtonText}>Invoice</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function AccountPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadPayments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      setPayments(await paymentApi.list());
    } catch (err: unknown) {
      setPayments([]);
      setError(getErrorMessage(err, 'Failed to load payments.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments().catch(() => undefined);
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;

    return payments.filter((payment) =>
      [
        payment.reference,
        payment.order_slug,
        payment.provider,
        payment.status,
        payment.transaction_id,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [payments, search]);

  const paidTotal = useMemo(
    () =>
      payments
        .filter((payment) => String(payment.status).toUpperCase() === 'PAID')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Payments' }} />
      <Screen>
        <AuthGate message="Log in to view payment history.">
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadPayments(true)}
                tintColor={colors.primary}
              />
            }
          >
            <PageHeader
              icon="card"
              title="Payments"
              subtitle="Track payment status, references, and receipts"
              tone="primary"
            >
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{payments.length}</Text>
                  <Text style={styles.metricLabel}>Payments</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{money(paidTotal)}</Text>
                  <Text style={styles.metricLabel}>Paid total</Text>
                </View>
              </View>
            </PageHeader>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search payments"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>

            {loading ? (
              <View style={styles.centerCard}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.centerText}>Loading payments...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerCard}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={() => loadPayments()} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : !filteredPayments.length ? (
              <View style={styles.centerCard}>
                <EmptyState
                  title="No payments found"
                  subtitle="Payment records appear here after checkout."
                />
              </View>
            ) : (
              filteredPayments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
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
    fontSize: 18,
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
  currency: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
  },
  detailGrid: {
    gap: 10,
  },
  detailBox: {
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
  refundBox: {
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  refundTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  refundStatus: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7C3AED',
  },
  refundItem: {
    padding: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  refundAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
  },
  refundMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  documentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  documentButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
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
