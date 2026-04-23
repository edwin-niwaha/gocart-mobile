import React, { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { catalogApi } from '@/api/services';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { useShop } from '@/providers/ShopProvider';
import { Product, ProductVariant } from '@/types';
import { money } from '@/utils/format';

const FALLBACK_PRODUCT = 'https://via.placeholder.com/800x600.png?text=Product';

type ProductRatingShape = {
  average_rating?: number | string;
  total_reviews?: number;
};

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getAverageRating(product: Product | null) {
  const productAny = product as Product & {
    product_rating?: ProductRatingShape;
    rating?: ProductRatingShape;
    average_rating?: number | string;
  };

  return normalizeNumber(
    productAny?.product_rating?.average_rating ??
      productAny?.rating?.average_rating ??
      productAny?.average_rating,
    0
  );
}

function getTotalReviews(product: Product | null) {
  const productAny = product as Product & {
    product_rating?: ProductRatingShape;
    rating?: ProductRatingShape;
    total_reviews?: number;
  };

  return normalizeNumber(
    productAny?.product_rating?.total_reviews ??
      productAny?.rating?.total_reviews ??
      productAny?.total_reviews,
    0
  );
}

function formatRating(value: number) {
  return value > 0 ? value.toFixed(1) : '0.0';
}

function getStatusTone(isOutOfStock: boolean) {
  return isOutOfStock
    ? {
        badge: styles.stockOut,
        text: styles.stockTextOut,
        label: 'Out of stock',
        icon: 'close-circle',
      }
    : {
        badge: styles.stockIn,
        text: styles.stockTextIn,
        label: 'In stock',
        icon: 'checkmark-circle',
      };
}

function dedupeImageUrls(urls: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (!url || typeof url !== 'string') continue;
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function dedupeVariants(variants: ProductVariant[] = []) {
  const seenIds = new Set<number>();
  const seenKeys = new Set<string>();

  return variants.filter((variant) => {
    if (typeof variant.id === 'number') {
      if (seenIds.has(variant.id)) return false;
      seenIds.add(variant.id);
      return true;
    }

    const fallbackKey = `${variant.name}-${variant.sku ?? ''}-${variant.price}`;
    if (seenKeys.has(fallbackKey)) return false;
    seenKeys.add(fallbackKey);
    return true;
  });
}

function getInitialVariant(variants: ProductVariant[]) {
  return (
    variants.find((variant) => variant.is_active && variant.is_in_stock) ||
    variants.find((variant) => variant.is_active) ||
    variants[0] ||
    null
  );
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

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <View style={styles.infoPillTextWrap}>
        <Text style={styles.infoPillLabel}>{label}</Text>
        <Text style={styles.infoPillValue}>{value}</Text>
      </View>
    </View>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Pressable onPress={onToggle} style={styles.collapsibleHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.expandIconWrap}>
          <Ionicons
            name={expanded ? 'remove' : 'add'}
            size={20}
            color={colors.text}
          />
        </View>
      </Pressable>

      {expanded ? children : null}
    </View>
  );
}

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { addToCart, toggleWishlist, wishlistItems } = useShop();
  const protectedAction = useProtectedAction();
  const { width } = useWindowDimensions();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartBusy, setCartBusy] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const isCompact = width < 380;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const nextProduct = await catalogApi.product(String(slug));
        if (mounted) {
          setProduct(nextProduct);
        }
      } catch {
        if (mounted) {
          Alert.alert('Error', 'Could not load this product.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const activeVariants = useMemo(() => {
    const source = product?.variants?.filter((variant) => variant.is_active) || [];
    return dedupeVariants(source);
  }, [product]);

  useEffect(() => {
    if (!activeVariants.length) {
      setSelectedVariant(null);
      return;
    }

    setSelectedVariant((current) => {
      if (current) {
        const stillExists = activeVariants.find((variant) => variant.id === current.id);
        if (stillExists) return stillExists;
      }
      return getInitialVariant(activeVariants);
    });
  }, [activeVariants]);

  const wished = useMemo(
    () => wishlistItems.some((item) => item.product.id === product?.id),
    [wishlistItems, product]
  );

  const productImages = useMemo(() => {
    return dedupeImageUrls([product?.hero_image, ...(product?.image_urls || [])]);
  }, [product]);

  const imageUri = productImages[0] || FALLBACK_PRODUCT;

  const displayPrice = selectedVariant?.price || product?.base_price || '0';
  const isOutOfStock = selectedVariant ? !selectedVariant.is_in_stock : !product?.is_in_stock;
  const stockState = getStatusTone(isOutOfStock);

  const averageRating = getAverageRating(product);
  const totalReviews = getTotalReviews(product);

  const categoryName = product?.category?.name || 'General';
  const selectedOptionName = selectedVariant?.name || 'Default';
  const description = product?.description || 'No description provided.';
  const hasVariants = activeVariants.length > 0;

  const handleToggleWishlist = () => {
    if (!product || wishlistBusy) return;

    setWishlistBusy(true);

    protectedAction(async () => {
      try {
        await toggleWishlist(product.id);
      } finally {
        setWishlistBusy(false);
      }
    });
  };

  const handleAddToCart = () => {
    if (cartBusy) return;

    if (hasVariants && !selectedVariant) {
      Alert.alert('Select an option', 'Please choose a size, volume, or variation first.');
      return;
    }

    if (selectedVariant && !selectedVariant.is_in_stock) {
      Alert.alert('Out of stock', 'This option is currently unavailable.');
      return;
    }

    if (!selectedVariant && !product?.is_in_stock) {
      Alert.alert('Out of stock', 'This product is currently unavailable.');
      return;
    }

    if (!selectedVariant) {
      Alert.alert('Unavailable', 'This product has no purchasable option yet.');
      return;
    }

    setCartBusy(true);

    protectedAction(async () => {
      try {
        await addToCart(selectedVariant.id, 1);
      } finally {
        setCartBusy(false);
      }
    });
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={34} color={colors.muted} />
          <Text style={styles.notFound}>Product not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.imageCard}>
          <View style={styles.imageWrap}>
            <Image source={{ uri: imageUri }} style={styles.image} />

            <Pressable
              style={[styles.wishlistBtn, wishlistBusy && styles.actionBusy]}
              onPress={handleToggleWishlist}
              disabled={wishlistBusy}
            >
              <Ionicons
                name={wished ? 'heart' : 'heart-outline'}
                size={22}
                color={wished ? colors.primary : colors.text}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.headerBlock}>
            <View style={styles.titleWrap}>
              <Text style={styles.category}>{categoryName}</Text>
              <Text style={styles.title}>{product.title}</Text>
            </View>

            <View style={[styles.stockBadge, stockState.badge]}>
              <Ionicons
                name={stockState.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={isOutOfStock ? '#dc2626' : colors.success}
              />
              <Text style={[styles.stockText, stockState.text]}>{stockState.label}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, isCompact && styles.priceCompact]}>
              {money(displayPrice)}
            </Text>

            <Pressable
              style={styles.ratingWrap}
              onPress={() =>
                router.push({
                  pathname: '/reviews/[slug]',
                  params: { slug: product.slug },
                })
              }
            >
              <View style={styles.ratingTopRow}>
                <StarRating rating={averageRating} size={15} />
                <Text style={styles.ratingValue}>{formatRating(averageRating)}</Text>
              </View>
              <Text style={styles.ratingCount}>
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </Text>
              <Text style={styles.ratingCta}>See all reviews</Text>
            </Pressable>
          </View>

          <View style={styles.infoGrid}>
            <InfoPill icon="pricetag-outline" label="Category" value={categoryName} />
            <InfoPill icon="cube-outline" label="Option" value={selectedOptionName} />
            <InfoPill
              icon="layers-outline"
              label="Availability"
              value={isOutOfStock ? 'Unavailable' : 'Available'}
            />
            <InfoPill
              icon="chatbubble-ellipses-outline"
              label="Customer rating"
              value={`${formatRating(averageRating)} / 5`}
            />
          </View>

          {hasVariants ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Choose option</Text>
                <Text style={styles.sectionHint}>
                  Select the version you want before adding to cart.
                </Text>
              </View>

              <View style={styles.variantWrap}>
                {activeVariants.map((variant) => {
                  const active = selectedVariant?.id === variant.id;
                  const disabled = !variant.is_in_stock;

                  return (
                    <Pressable
                      key={variant.id}
                      onPress={() => !disabled && setSelectedVariant(variant)}
                      disabled={disabled}
                      style={[
                        styles.variantChip,
                        active && styles.variantChipActive,
                        disabled && styles.variantChipDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.variantChipText,
                          active && styles.variantChipTextActive,
                          disabled && styles.variantChipTextDisabled,
                        ]}
                      >
                        {variant.name}
                      </Text>

                      {typeof variant.stock_quantity === 'number' && (
                        <Text
                          style={[
                            styles.variantStockText,
                            active && styles.variantStockTextActive,
                          ]}
                        >
                          {disabled ? 'Unavailable' : `${variant.stock_quantity} left`}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <CollapsibleSection
            title="Product details"
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded((prev) => !prev)}
          >
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{categoryName}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Selected option</Text>
                <Text style={styles.metaValue}>{selectedOptionName}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Availability</Text>
                <Text style={styles.metaValue}>
                  {isOutOfStock ? 'Unavailable' : 'Available'}
                </Text>
              </View>

              {typeof selectedVariant?.stock_quantity === 'number' ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Stock quantity</Text>
                  <Text style={styles.metaValue}>{selectedVariant.stock_quantity}</Text>
                </View>
              ) : null}

              {selectedVariant?.max_quantity_per_order ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Max per order</Text>
                  <Text style={styles.metaValue}>
                    {selectedVariant.max_quantity_per_order}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Reviews</Text>
                <Text style={styles.metaValue}>
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Average rating</Text>
                <Text style={styles.metaValue}>{formatRating(averageRating)} / 5</Text>
              </View>
            </View>
          </CollapsibleSection>

          <CollapsibleSection
            title="Description"
            expanded={descriptionExpanded}
            onToggle={() => setDescriptionExpanded((prev) => !prev)}
          >
            <Text style={styles.desc}>{description}</Text>
          </CollapsibleSection>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.button,
                (isOutOfStock || cartBusy) && styles.buttonDisabled,
              ]}
              disabled={isOutOfStock || cartBusy}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>
                {cartBusy ? 'Adding...' : isOutOfStock ? 'Out of stock' : 'Add to cart'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                wishlistBusy && styles.buttonDisabled,
              ]}
              onPress={handleToggleWishlist}
              disabled={wishlistBusy}
            >
              <Ionicons
                name={wished ? 'heart' : 'heart-outline'}
                size={18}
                color={wished ? colors.primary : colors.text}
              />
              <Text style={styles.secondaryText}>
                {wishlistBusy
                  ? 'Please wait...'
                  : wished
                    ? 'Saved to wishlist'
                    : 'Save to wishlist'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },

  notFound: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  imageCard: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  imageWrap: {
    position: 'relative',
    backgroundColor: colors.surface,
  },

  image: {
    width: '100%',
    height: 340,
    resizeMode: 'cover',
  },

  wishlistBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  actionBusy: {
    opacity: 0.7,
  },

  content: {
    gap: spacing.md,
  },

  headerBlock: {
    gap: spacing.sm,
  },

  titleWrap: {
    gap: 4,
  },

  category: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 34,
  },

  stockBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  stockIn: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },

  stockOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },

  stockText: {
    fontSize: 12,
    fontWeight: '800',
  },

  stockTextIn: {
    color: colors.success,
  },

  stockTextOut: {
    color: '#dc2626',
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    flexWrap: 'wrap',
  },

  price: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
  },

  priceCompact: {
    fontSize: 26,
  },

  ratingWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 116,
  },

  ratingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },

  ratingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  ratingCount: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  ratingCta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  infoPill: {
    minWidth: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  infoPillTextWrap: {
    flex: 1,
    gap: 2,
  },

  infoPillLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  infoPillValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
  },

  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },

  sectionHeader: {
    gap: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },

  sectionHint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },

  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  expandIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },

  desc: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },

  variantWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  variantChip: {
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    gap: 3,
  },

  variantChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  variantChipDisabled: {
    opacity: 0.5,
  },

  variantChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  variantChipTextActive: {
    color: colors.primary,
  },

  variantChipTextDisabled: {
    color: colors.muted,
  },

  variantStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },

  variantStockTextActive: {
    color: colors.primary,
  },

  metaCard: {
    gap: 12,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  metaLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },

  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },

  actions: {
    gap: 12,
    marginTop: spacing.xs,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
  },

  secondaryText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
});
