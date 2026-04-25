import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { money } from '@/utils/format';
import type { Order, OrderItem, Review } from '@/types';

type SelectedProduct = {
  productId: number;
  productTitle: string;
  review: Review | null;
};

type ReviewFormValues = {
  rating: number;
  comment: string;
};

function normalizeStatus(status?: string) {
  return String(status || 'PENDING').toUpperCase();
}

function formatStatus(status?: string) {
  const value = normalizeStatus(status).toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusColor(status?: string) {
  switch (normalizeStatus(status)) {
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
    default:
      return colors.primary;
  }
}

function canReviewOrder(status?: string) {
  return normalizeStatus(status) === 'DELIVERED';
}

function getProductTitle(item?: OrderItem) {
  if (!item) return 'Product';
  return item.product_title || item.product_slug || `Product #${item.product}`;
}

function getOrderItemCount(order: Order) {
  return (order.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
}

function getUniqueOrderItems(items: OrderItem[] = []) {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.product)) return false;
    seen.add(item.product);
    return true;
  });
}

function matchesOrderSearch(order: Order, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const orderRef = String(order.slug || order.id || '').toLowerCase();
  const status = String(order.status || '').toLowerCase();
  const amount = String(order.total_price || '').toLowerCase();
  const itemTitles = (order.items || [])
    .map((item) => getProductTitle(item).toLowerCase())
    .join(' ');

  return (
    orderRef.includes(q) ||
    status.includes(q) ||
    amount.includes(q) ||
    itemTitles.includes(q)
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={8}
          style={styles.starBtn}
        >
          <Text
            style={[
              styles.starText,
              star <= value && styles.starTextActive,
            ]}
          >
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ReviewModal({
  visible,
  saving,
  productTitle,
  initialReview,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  saving: boolean;
  productTitle: string;
  initialReview: Review | null;
  onClose: () => void;
  onSubmit: (values: ReviewFormValues) => void;
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [comment, setComment] = useState(initialReview?.comment ?? '');

  useEffect(() => {
    setRating(initialReview?.rating ?? 5);
    setComment(initialReview?.comment ?? '');
  }, [initialReview, visible]);

  const handleSubmit = () => {
    if (!rating || rating < 1 || rating > 5) {
      Alert.alert('Missing rating', 'Please choose a rating.');
      return;
    }

    onSubmit({
      rating,
      comment: comment.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {initialReview ? 'Update Review' : 'Write a Review'}
          </Text>

          <Text style={styles.modalSubtitle}>{productTitle}</Text>

          <Text style={styles.fieldLabel}>Rating</Text>
          <RatingPicker value={rating} onChange={setRating} />

          <Text style={styles.fieldLabel}>Comment</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience"
            placeholderTextColor={colors.muted}
            multiline
            editable={!saving}
            textAlignVertical="top"
            style={styles.textArea}
          />

          <View style={styles.modalActions}>
            <Pressable
              disabled={saving}
              onPress={onClose}
              style={[
                styles.actionBtn,
                styles.cancelBtn,
                saving && styles.disabledBtn,
              ]}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={handleSubmit}
              style={[
                styles.actionBtn,
                styles.saveBtn,
                saving && styles.disabledBtn,
              ]}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving...' : initialReview ? 'Update' : 'Submit'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OrderCard({
  order,
  reviewMap,
  onOpen,
  onReview,
}: {
  order: Order;
  reviewMap: Map<number, Review>;
  onOpen: (order: Order) => void;
  onReview: (payload: SelectedProduct) => void;
}) {
  const firstItem = order.items?.[0];
  const itemCount = getOrderItemCount(order);
  const uniqueItems = getUniqueOrderItems(order.items || []);
  const reviewable = canReviewOrder(order.status);
  const statusColor = getStatusColor(order.status);
  const moreCount = itemCount > 1 ? itemCount - 1 : 0;

  return (
    <Pressable
      onPress={() => onOpen(order)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.cardHeaderText}>
          <Text style={styles.orderRef} numberOfLines={1}>
            Order #{order.slug || order.id}
          </Text>
          <Text style={styles.orderMetaText}>
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColor}14` },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {formatStatus(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {getProductTitle(firstItem)}
        </Text>

        {moreCount > 0 ? (
          <Text style={styles.moreItemsText}>
            +{moreCount} more item{moreCount > 1 ? 's' : ''}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.amount}>{money(order.total_price ?? 0)}</Text>
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.viewDetailsText}>View details</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.muted}
          />
        </View>

        {reviewable && uniqueItems.length > 0 ? (
          <View style={styles.reviewRow}>
            {uniqueItems.slice(0, 2).map((orderItem) => {
              const existingReview = reviewMap.get(orderItem.product);

              return (
                <Pressable
                  key={orderItem.id}
                  onPress={(event) => {
                    event.stopPropagation();
                    onReview({
                      productId: orderItem.product,
                      productTitle: getProductTitle(orderItem),
                      review: existingReview || null,
                    });
                  }}
                  style={[
                    styles.reviewBtn,
                    existingReview && styles.reviewBtnMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.reviewBtnText,
                      existingReview && styles.reviewBtnTextMuted,
                    ]}
                  >
                    {existingReview ? 'Edit Review' : 'Review Item'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const {
    orders = [],
    reviews = [],
    hasMoreOrders = false,
    loadingOrders = false,
    loadingMoreOrders = false,
    refreshingOrders = false,
    loadOrders,
    loadMoreOrders,
    refreshOrders,
    addReview,
    updateReview,
  } = useShop();

  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  useEffect(() => {
    loadOrders().catch(() => undefined);
  }, [loadOrders]);

  const reviewMap = useMemo(() => {
    return new Map<number, Review>(reviews.map((review) => [review.product, review]));
  }, [reviews]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => matchesOrderSearch(order, search));
  }, [orders, search]);

  const handleOpenOrder = useCallback((order: Order) => {
    router.push({
      pathname: '/orders/[id]',
      params: { id: String(order.id) },
    });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMoreOrders || loadingMoreOrders || loadingOrders) return;
    loadMoreOrders().catch(() => undefined);
  }, [hasMoreOrders, loadingMoreOrders, loadingOrders, loadMoreOrders]);

  const handleRefresh = useCallback(() => {
    refreshOrders().catch(() => undefined);
  }, [refreshOrders]);

  const closeModal = useCallback(() => {
    if (saving) return;
    setSelectedProduct(null);
  }, [saving]);

  const handleReviewSubmit = useCallback(
    async (values: ReviewFormValues) => {
      if (!selectedProduct) return;

      setSaving(true);

      try {
        const success = selectedProduct.review
          ? await updateReview(selectedProduct.review.id, values)
          : await addReview({
              product: selectedProduct.productId,
              rating: values.rating,
              comment: values.comment,
            });

        if (success) {
          setSelectedProduct(null);
        } else {
          Alert.alert('Review not saved', 'Something went wrong while saving your review.');
        }
      } catch {
        Alert.alert('Review not saved', 'Something went wrong while saving your review.');
      } finally {
        setSaving(false);
      }
    },
    [selectedProduct, addReview, updateReview]
  );

  return (
    <Screen>
      <AuthGate message="Log in to view your orders.">
        {loadingOrders && !orders.length ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !orders.length ? (
          <View style={styles.container}>
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No orders yet"
                subtitle="Your orders will appear here after checkout."
              />
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                reviewMap={reviewMap}
                onOpen={handleOpenOrder}
                onReview={setSelectedProduct}
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            refreshControl={
              <RefreshControl
                refreshing={refreshingOrders}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <View style={styles.headerWrap}>
                <View style={styles.searchWrap}>
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={colors.muted}
                  />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search orders, status or product"
                    placeholderTextColor={colors.muted}
                    style={styles.searchInput}
                  />
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptySearchWrap}>
                <EmptyState
                  title="No matching orders"
                  subtitle="Try another order number, product name, or status."
                />
              </View>
            }
            ListFooterComponent={
              loadingMoreOrders ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.footerSpacer} />
              )
            }
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          />
        )}

        <ReviewModal
          visible={!!selectedProduct}
          saving={saving}
          productTitle={selectedProduct?.productTitle || ''}
          initialReview={selectedProduct?.review || null}
          onClose={closeModal}
          onSubmit={handleReviewSubmit}
        />
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerWrap: {
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },

  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTextWrap: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  heroSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  cardPressed: {
    opacity: 0.94,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },

  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeaderText: {
    flex: 1,
  },

  orderRef: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  orderMetaText: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  cardBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 14,
  },

  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 21,
  },

  moreItemsText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },

  totalLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
  },

  amount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },

  cardBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  viewDetailsText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  reviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  reviewBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  reviewBtnMuted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  reviewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  reviewBtnTextMuted: {
    color: colors.text,
  },

  emptyWrap: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },

  emptySearchWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },

  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  footerSpacer: {
    height: spacing.md,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  modalSubtitle: {
    fontSize: 13,
    color: colors.muted,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },

  starBtn: {
    paddingVertical: 4,
    paddingRight: 2,
  },

  starText: {
    fontSize: 30,
    color: colors.border,
  },

  starTextActive: {
    color: '#f59e0b',
  },

  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },

  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelBtnText: {
    color: colors.text,
    fontWeight: '700',
  },

  saveBtn: {
    backgroundColor: colors.primary,
  },

  saveBtnText: {
    color: colors.surface,
    fontWeight: '800',
  },

  disabledBtn: {
    opacity: 0.6,
  },
});
