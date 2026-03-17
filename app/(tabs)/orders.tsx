import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { money } from '@/utils/format';
import type { Review } from '@/types';

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

type OrderItem = {
  id: number;
  product: number;
  quantity: number;
  product_title?: string;
  product_slug?: string;
};

type Order = {
  id: number;
  slug: string;
  status?: string;
  total_price: number | string;
  items?: OrderItem[];
};

type SelectedProduct = {
  productId: number;
  productTitle: string;
  review: Review | null;
};

type ReviewFormValues = {
  rating: number;
  comment: string;
};

function normalizeStatus(status?: string): OrderStatus | string {
  return (status || 'PENDING').toUpperCase();
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
    case 'PENDING':
    default:
      return colors.primary;
  }
}

function formatStatus(status?: string) {
  const normalized = normalizeStatus(status).toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function canReviewOrder(status?: string) {
  return normalizeStatus(status) === 'DELIVERED';
}

function getProductTitle(item: OrderItem) {
  return item.product_title || item.product_slug || `Product #${item.product}`;
}

function getUniqueOrderItems(items: OrderItem[] = []) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.product)) return false;
    seen.add(item.product);
    return true;
  });
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
          style={styles.starBtn}
          hitSlop={8}
        >
          <Text style={[styles.starText, star <= value && styles.starTextActive]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ReviewModal({
  visible,
  productTitle,
  initialReview,
  saving,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  productTitle: string;
  initialReview: Review | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ReviewFormValues) => void;
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [comment, setComment] = useState(initialReview?.comment ?? '');

  useEffect(() => {
    setRating(initialReview?.rating ?? 5);
    setComment(initialReview?.comment ?? '');
  }, [initialReview, visible]);

  const submit = () => {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              onPress={saving ? undefined : onClose}
              disabled={saving}
              style={[
                styles.actionBtn,
                styles.cancelBtn,
                saving && styles.disabledBtn,
              ]}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={submit}
              disabled={saving}
              style={[styles.actionBtn, styles.saveBtn, saving && styles.disabledBtn]}
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

export default function OrdersScreen() {
  const { orders, reviews, loadAuthedData, addReview, updateReview } = useShop() as {
    orders: Order[];
    reviews: Review[];
    loadAuthedData: () => Promise<void>;
    addReview: (payload: {
      product: number;
      rating: number;
      comment: string;
    }) => Promise<boolean>;
    updateReview: (
      reviewId: number,
      payload: { rating: number; comment: string }
    ) => Promise<boolean>;
  };

  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};

    orders.forEach((order) => {
      const status = normalizeStatus(order.status);
      if (!groups[status]) groups[status] = [];
      groups[status].push(order);
    });

    return groups;
  }, [orders]);

  const reviewMap = useMemo(() => {
    return new Map<number, Review>(reviews.map((review) => [review.product, review]));
  }, [reviews]);

  const closeModal = () => {
    if (saving) return;
    setSelectedProduct(null);
  };

  const handleReviewSubmit = async (values: ReviewFormValues) => {
    if (!selectedProduct) return;

    setSaving(true);

    try {
      const ok = selectedProduct.review
        ? await updateReview(selectedProduct.review.id, values)
        : await addReview({
            product: selectedProduct.productId,
            rating: values.rating,
            comment: values.comment,
          });

      if (ok) {
        closeModal();
      } else {
        Alert.alert(
          'Review not saved',
          'Something went wrong while saving your review.'
        );
      }
    } catch {
      Alert.alert(
        'Review not saved',
        'Something went wrong while saving your review.'
      );
    } finally {
      setSaving(false);
    }
  };

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
            Object.entries(groupedOrders).map(([status, grouped]) => {
              const statusColor = getStatusColor(status);

              return (
                <View key={status} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{formatStatus(status)}</Text>
                    <Text style={styles.countPill}>{grouped.length}</Text>
                  </View>

                  {grouped.map((order) => {
                    const uniqueItems = getUniqueOrderItems(order.items || []);
                    const itemCount =
                      order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
                    const reviewAllowed = canReviewOrder(order.status);
                    const orderStatusColor = getStatusColor(order.status);

                    return (
                      <View key={order.id} style={styles.card}>
                        <View style={styles.header}>
                          <View style={styles.headerText}>
                            <Text style={styles.slug}>Order #{order.slug}</Text>
                            <Text style={styles.meta}>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: `${orderStatusColor}15` },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: orderStatusColor }]}
                            >
                              {formatStatus(order.status)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.amount}>{money(order.total_price)}</Text>

                        {!uniqueItems.length ? (
                          <Text style={styles.emptyItemsText}>
                            No items found for this order.
                          </Text>
                        ) : (
                          <View style={styles.itemsWrap}>
                            {uniqueItems.map((item) => {
                              const existingReview = reviewMap.get(item.product);
                              const productTitle = getProductTitle(item);

                              return (
                                <View key={item.id} style={styles.itemBlock}>
                                  <View style={styles.itemRow}>
                                    <View style={styles.dot} />
                                    <Text style={styles.itemText}>
                                      {productTitle} × {item.quantity}
                                    </Text>
                                  </View>

                                  {reviewAllowed && (
                                    <Pressable
                                      onPress={() =>
                                        setSelectedProduct({
                                          productId: item.product,
                                          productTitle,
                                          review: existingReview || null,
                                        })
                                      }
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
                                        {existingReview ? 'Edit Review' : 'Write Review'}
                                      </Text>
                                    </Pressable>
                                  )}
                                </View>
                              );
                            })}
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

        <ReviewModal
          visible={!!selectedProduct}
          productTitle={selectedProduct?.productTitle || ''}
          initialReview={selectedProduct?.review || null}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleReviewSubmit}
        />
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
    flex: 1,
    paddingRight: 12,
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

  emptyItemsText: {
    fontSize: 13,
    color: colors.muted,
  },

  itemsWrap: {
    gap: 10,
    paddingTop: 4,
  },

  itemBlock: {
    gap: 8,
    paddingTop: 2,
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

  reviewBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    marginLeft: 14,
  },

  reviewBtnMuted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  reviewBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  reviewBtnTextMuted: {
    color: colors.text,
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