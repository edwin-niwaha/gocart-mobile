import React, { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { catalogApi, getErrorMessage, reviewApi } from '@/api/services';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { showError, showSuccess } from '@/utils/toast';
import type { Product, Review } from '@/types';

export default function WriteReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, ready, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [ready, isAuthenticated]);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!ready || !isAuthenticated) return;

      try {
        setLoadingPage(true);

        const productData = await catalogApi.product(String(slug));
        if (!mounted) return;
        setProduct(productData);

        const myReview = await reviewApi.myReviewForProduct(String(slug));
        if (!mounted) return;

        setExistingReview(myReview);

        if (myReview) {
          setRating(Number(myReview.rating) || 0);
          setComment(myReview.comment || '');
        }
      } catch (error: any) {
        if (!mounted) return;
        showError(getErrorMessage(error, 'Could not load this review form.'));
      } finally {
        if (mounted) {
          setLoadingPage(false);
        }
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [slug, ready, isAuthenticated]);

  const activeRating = useMemo(() => hoverRating || rating, [hoverRating, rating]);
  const isEditing = !!existingReview;

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      showError('Please log in to write a review.');
      router.push('/auth/login');
      return;
    }

    if (!product?.id) {
      showError('Product information is missing.');
      return;
    }

    if (rating < 1 || rating > 5) {
      showError('Please select a star rating.');
      return;
    }

    if (!comment.trim()) {
      showError('Please write your review comment.');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && existingReview?.id) {
        await reviewApi.update(existingReview.id, {
          rating,
          comment: comment.trim(),
        });

        showSuccess('Review updated successfully.');
      } else {
        await reviewApi.create({
          product: product.id,
          rating,
          comment: comment.trim(),
        });

        showSuccess('Review submitted successfully.');
      }

      router.push(`/reviews/${slug}`);
    } catch (error: any) {
      console.log('Review submit error:', error?.response?.data || error);
      showError(getErrorMessage(error, 'Failed to submit review.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loadingPage) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading review form...</Text>
        </View>
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Screen scroll contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.smallLabel}>
          {isEditing ? 'Edit your review' : 'Write a review'}
        </Text>

        <Text style={styles.title}>{product?.title ?? 'Product review'}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Your rating</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= activeRating;

              return (
                <Pressable
                  key={star}
                  onPressIn={() => setHoverRating(star)}
                  onPressOut={() => setHoverRating(0)}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={filled ? 'star' : 'star-outline'}
                    size={32}
                    color="#f59e0b"
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.helperText}>
            {rating > 0 ? `You selected ${rating} out of 5.` : 'Choose a rating.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Your review</Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this product..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
            style={styles.textarea}
            editable={!submitting}
          />

          <Text style={styles.counterText}>{comment.trim().length}/1000 characters</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.primaryButton, submitting && styles.disabledButton]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isEditing ? 'Update review' : 'Submit review'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            disabled={submitting}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },

  loadingText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.lg,
  },

  smallLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },

  section: {
    gap: spacing.sm,
  },

  label: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  starButton: {
    padding: 2,
  },

  helperText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },

  textarea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },

  counterText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'right',
  },

  actions: {
    gap: spacing.sm,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});