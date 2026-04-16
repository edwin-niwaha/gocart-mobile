import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { catalogApi, getErrorMessage, reviewApi } from '@/api/services';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import type { Product, Review } from '@/types';

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatRating(value: number) {
  return value > 0 ? value.toFixed(1) : '0.0';
}

function StarRating({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  const rounded = Math.round(rating);

  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rounded ? 'star' : 'star-outline'}
          size={size}
          color="#f59e0b"
        />
      ))}
    </View>
  );
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function getDisplayName(review: Review) {
  const user = review.user;
  if (!user) return 'Anonymous';

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user.username) return user.username;
  if (user.email) return user.email;
  return 'Customer';
}

export default function ProductReviewsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (isAuthenticated) {
        const [productData, reviewsData, myReviewData] = await Promise.all([
          catalogApi.product(String(slug)),
          reviewApi.listByProduct({ product_slug: String(slug) }),
          reviewApi.myReviewForProduct(String(slug)),
        ]);

        setProduct(productData);
        setReviews(reviewsData);
        setMyReview(myReviewData);
      } else {
        const [productData, reviewsData] = await Promise.all([
          catalogApi.product(String(slug)),
          reviewApi.listByProduct({ product_slug: String(slug) }),
        ]);

        setProduct(productData);
        setReviews(reviewsData);
        setMyReview(null);
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Could not load reviews.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const averageRating = useMemo(
    () => normalizeNumber(product?.average_rating, 0),
    [product]
  );

  const totalReviews = useMemo(
    () => normalizeNumber(product?.total_reviews, reviews.length),
    [product, reviews.length]
  );

  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      const rating = Math.max(1, Math.min(5, Math.round(review.rating)));
      counts[rating as 1 | 2 | 3 | 4 | 5] += 1;
    });

    return counts;
  }, [reviews]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.summaryCard}>
              {!!product?.title && (
                <Text style={styles.productTitle}>{product.title}</Text>
              )}
              <Text style={styles.sectionLabel}>Customer reviews</Text>

              {isAuthenticated ? (
                <Pressable
                  onPress={() => router.push(`/reviews/write/${slug}`)}
                  style={styles.writeButton}
                >
                  <Text style={styles.writeButtonText}>
                    {myReview ? 'Edit my review' : 'Write review'}
                  </Text>
                </Pressable>
              ) : null}

              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.bigRating}>{formatRating(averageRating)}</Text>
                  <StarRating rating={averageRating} size={18} />
                  <Text style={styles.summaryMeta}>
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
              </View>

              <View style={styles.breakdownWrap}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star as 1 | 2 | 3 | 4 | 5];
                  const widthPct = totalReviews ? (count / totalReviews) * 100 : 0;

                  return (
                    <View key={star} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{star}★</Text>
                      <View style={styles.breakdownTrack}>
                        <View style={[styles.breakdownFill, { width: `${widthPct}%` }]} />
                      </View>
                      <Text style={styles.breakdownCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>All reviews</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No reviews yet"
            subtitle="Be the first customer to share feedback on this product."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View style={styles.reviewerWrap}>
                <Text style={styles.reviewerName}>{getDisplayName(item)}</Text>
                <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.reviewRatingWrap}>
                <StarRating rating={item.rating} size={13} />
                <Text style={styles.reviewRatingValue}>{formatRating(item.rating)}</Text>
              </View>
            </View>

            {!!item.comment?.trim() && (
              <Text style={styles.reviewComment}>{item.comment.trim()}</Text>
            )}
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  headerWrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },

  productTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },

  sectionLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },

  writeButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
  },

  writeButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  bigRating: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },

  summaryMeta: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },

  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  breakdownWrap: {
    gap: 8,
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  breakdownLabel: {
    width: 28,
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
  },

  breakdownTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },

  breakdownFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f59e0b',
  },

  breakdownCount: {
    width: 22,
    textAlign: 'right',
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
  },

  listHeader: {
    paddingTop: 2,
  },

  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },

  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    gap: 12,
    marginBottom: spacing.sm,
  },

  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  reviewerWrap: {
    flex: 1,
    gap: 4,
  },

  reviewerName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  reviewDate: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  reviewRatingWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },

  reviewRatingValue: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
  },

  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
});