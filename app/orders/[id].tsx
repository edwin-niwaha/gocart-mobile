import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { AuthGate } from '@/components/AuthGate';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { money } from '@/utils/format';
import type { Order, OrderItem, Review } from '@/types';

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

type ReviewFormValues = {
  rating: number;
  comment: string;
};

type SelectedProduct = {
  productId: number;
  productTitle: string;
  review: Review | null;
};

const EMPTY_ORDERS: Order[] = [];
const EMPTY_REVIEWS: Review[] = [];

function normalizeStatus(status?: string): OrderStatus | string {
  return (status || 'PENDING').toUpperCase();
}

function formatStatus(status?: string) {
  const normalized = normalizeStatus(status).toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

function canReviewOrder(status?: string) {
  return normalizeStatus(status) === 'DELIVERED';
}

function getProductTitle(item: OrderItem) {
  return item.product_title || item.product_slug || `Product #${item.product}`;
}

function getProductImage(item: OrderItem) {
  return (
    // @ts-ignore
    item.product_image ||
    // @ts-ignore
    item.image ||
    // @ts-ignore
    item.product_image_url ||
    // @ts-ignore
    item.thumbnail ||
    null
  );
}

function getItemUnitPrice(item: OrderItem) {
  return (
    // @ts-ignore
    item.price ??
    // @ts-ignore
    item.unit_price ??
    0
  );
}

function getItemSubtotal(item: OrderItem) {
  const qty = Number(item.quantity || 0);
  const unit = Number(getItemUnitPrice(item) || 0);
  return qty * unit;
}

function getVariantText(item: OrderItem) {
  const parts = [
    // @ts-ignore
    item.variant_name,
    // @ts-ignore
    item.variant_value,
    // @ts-ignore
    item.size,
    // @ts-ignore
    item.color,
  ].filter(Boolean);

  return parts.join(' • ');
}

function getItemCount(order?: Order) {
  return (order?.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
}

function formatDate(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
              style={[styles.actionBtn, styles.cancelBtn, saving && styles.disabledBtn]}
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

function DetailRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shop = useShop();

  const orders = shop.orders ?? EMPTY_ORDERS;
  const reviews = shop.reviews ?? EMPTY_REVIEWS;
  const loadOrders = shop.loadOrders;
  const loadingOrders = shop.loadingOrders ?? false;
  const addReview = shop.addReview;
  const updateReview = shop.updateReview;

  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  useEffect(() => {
    if (!orders.length) {
      loadOrders?.().catch(() => undefined);
    }
  }, [loadOrders, orders.length]);

  const order = useMemo<Order | undefined>(() => {
    return orders.find((item) => String(item.id) === String(id));
  }, [orders, id]);

  const reviewMap = useMemo(() => {
    return new Map<number, Review>(reviews.map((review) => [review.product, review]));
  }, [reviews]);

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
        setSelectedProduct(null);
      } else {
        Alert.alert('Review not saved', 'Something went wrong while saving your review.');
      }
    } catch {
      Alert.alert('Review not saved', 'Something went wrong while saving your review.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingOrders && !order) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthGate message="Log in to view your order details.">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </AuthGate>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <AuthGate message="Log in to view your order details.">
          <View style={styles.notFoundWrap}>
            <Text style={styles.notFoundTitle}>Order not found</Text>
            <Text style={styles.notFoundText}>
              We could not find that order in your current order list.
            </Text>

            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Go Back</Text>
            </Pressable>
          </View>
        </AuthGate>
      </Screen>
    );
  }

  const orderStatusColor = getStatusColor(order.status);
  const itemCount = getItemCount(order);
  const reviewAllowed = canReviewOrder(order.status);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />

      <AuthGate message="Log in to view your order details.">
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Pressable onPress={() => router.back()} style={styles.iconBackBtn}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${orderStatusColor}15` },
                ]}
              >
                <Text style={[styles.statusText, { color: orderStatusColor }]}>
                  {formatStatus(order.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Order Details</Text>
            <Text style={styles.heroOrderNo}>#{order.slug || order.id}</Text>
            <Text style={styles.totalAmount}>{money(order.total_price ?? 0)}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="cube-outline" size={14} color={colors.muted} />
                <Text style={styles.metaPillText}>
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </Text>
              </View>

              <View style={styles.metaPill}>
                <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                <Text style={styles.metaPillText}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <DetailRow label="Order ID" value={`#${order.slug || order.id}`} />
            <DetailRow
              label="Status"
              value={formatStatus(order.status)}
              valueStyle={{ color: orderStatusColor }}
            />
            <DetailRow
              label="Items"
              value={`${itemCount} item${itemCount === 1 ? '' : 's'}`}
            />
            <DetailRow label="Total" value={money(order.total_price ?? 0)} />
            {!!order.description && (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Order note</Text>
                <Text style={styles.noteText}>{order.description}</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Items in this order</Text>

            {(order.items || []).map((item) => {
              const image = getProductImage(item);
              const existingReview = reviewMap.get(item.product);
              const variantText = getVariantText(item);
              const unitPrice = getItemUnitPrice(item);
              const subtotal = getItemSubtotal(item);

              return (
                <View key={item.id} style={styles.productCard}>
                  <View style={styles.productRow}>
                    <View style={styles.imageWrap}>
                      {image ? (
                        <Image
                          source={{ uri: image }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imageFallback}>
                          <Ionicons
                            name="image-outline"
                            size={22}
                            color={colors.muted}
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {getProductTitle(item)}
                      </Text>

                      {!!variantText && (
                        <Text style={styles.productMeta} numberOfLines={2}>
                          {variantText}
                        </Text>
                      )}

                      <View style={styles.priceRow}>
                        <Text style={styles.productMeta}>Qty: {item.quantity}</Text>
                        <Text style={styles.productMeta}>
                          Unit: {money(unitPrice)}
                        </Text>
                      </View>

                      <Text style={styles.productSubtotal}>
                        {money(subtotal)}
                      </Text>

                      {reviewAllowed ? (
                        <Pressable
                          onPress={() =>
                            setSelectedProduct({
                              productId: item.product,
                              productTitle: getProductTitle(item),
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
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <ReviewModal
          visible={!!selectedProduct}
          productTitle={selectedProduct?.productTitle || ''}
          initialReview={selectedProduct?.review || null}
          saving={saving}
          onClose={() => (saving ? undefined : setSelectedProduct(null))}
          onSubmit={handleReviewSubmit}
        />
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },

  heroOrderNo: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '700',
  },

  totalAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },

  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },

  detailLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '700',
  },

  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
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

  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },

  noteBox: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },

  noteLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
  },

  noteText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  productCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 12,
  },

  productRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },

  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfo: {
    flex: 1,
    gap: 6,
  },

  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },

  productMeta: {
    fontSize: 13,
    color: colors.muted,
  },

  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },

  productSubtotal: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '900',
    marginTop: 2,
  },

  reviewBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
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

  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  notFoundTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },

  notFoundText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 18,
  },

  backBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backBtnText: {
    color: colors.surface,
    fontWeight: '800',
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
