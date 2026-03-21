import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import type { Category, Product } from '@/types';

const FALLBACK_HERO =
  'https://via.placeholder.com/1200x600.png?text=GoCart+Mobile';
const FALLBACK_PRODUCT =
  'https://via.placeholder.com/400x300.png?text=Product';
const FALLBACK_CATEGORY =
  'https://via.placeholder.com/200x200.png?text=Category';

type ProductCategoryShape =
  | {
      id?: number;
      name?: string;
      slug?: string;
      image_url?: string | null;
    }
  | number
  | string
  | null
  | undefined;

type ProductVariantShape = {
  id: number;
  name?: string;
  sku?: string;
  is_active?: boolean;
  is_in_stock?: boolean;
  stock_quantity?: number;
  price?: string | number;
};

function dedupeVariants(variants: ProductVariantShape[] = []) {
  const seenIds = new Set<number>();
  const seenKeys = new Set<string>();

  return variants.filter((variant) => {
    if (typeof variant.id === 'number') {
      if (seenIds.has(variant.id)) return false;
      seenIds.add(variant.id);
      return true;
    }

    const fallbackKey = `${variant.name ?? ''}-${variant.sku ?? ''}-${variant.price ?? ''}`;
    if (seenKeys.has(fallbackKey)) return false;
    seenKeys.add(fallbackKey);
    return true;
  });
}

export default function HomeScreen() {
  const {
    products,
    categories,
    wishlistItems,
    loadCatalog,
    addToCart,
    toggleWishlist,
    loading,
  } = useShop();

  const protectedAction = useProtectedAction();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(
    null
  );

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isTablet = width >= 768;
  const numColumns = isTablet ? 3 : 2;
  const gap = 12;
  const horizontalPadding = spacing.lg * 2;
  const gridCardWidth =
    (width - horizontalPadding - gap * (numColumns - 1)) / numColumns;
  const horizontalProductCardWidth = isTablet ? 220 : 168;
  const categoryCardWidth = isTablet ? 94 : 82;

  useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, [loadCatalog]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCatalog();
    } finally {
      setRefreshing(false);
    }
  };

  const heroSlides = useMemo(() => {
    const featuredImages = products
      .filter(
        (product) =>
          product.is_featured &&
          (product.hero_image || product.image_urls?.[0])
      )
      .map((product) => product.hero_image || product.image_urls?.[0])
      .filter(Boolean)
      .slice(0, 6) as string[];

    return featuredImages.length ? featuredImages : [FALLBACK_HERO];
  }, [products]);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.35,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroIndex, fadeAnim]);

  const getCategoryName = (category: ProductCategoryShape) => {
    if (!category) return '';
    if (typeof category === 'object' && 'name' in category) {
      return category.name || '';
    }
    return '';
  };

  const getCategorySlug = (category: ProductCategoryShape) => {
    if (!category) return '';
    if (typeof category === 'object' && 'slug' in category) {
      return category.slug || '';
    }
    return '';
  };

  const getVariantsSearchText = (product: Product) => {
    const variants = (product.variants || []) as ProductVariantShape[];

    return variants
      .map((variant) => [variant.name || '', variant.sku || ''].join(' '))
      .join(' ');
  };

  const getImage = (item: Product) =>
    item.hero_image || item.image_urls?.[0] || FALLBACK_PRODUCT;

  const getActiveVariants = (product: Product) => {
    const variants = (product.variants || []) as ProductVariantShape[];
    return dedupeVariants(variants.filter((variant) => variant.is_active));
  };

  const getPurchasableVariants = (product: Product) =>
    getActiveVariants(product).filter((variant) => variant.is_in_stock);

  const getProductStockInfo = (product: Product) => {
    const activeVariants = getActiveVariants(product);
    const purchasableVariants = getPurchasableVariants(product);

    const fallbackOutOfStock =
      activeVariants.length === 0 ? !product.is_in_stock : false;

    const isOutOfStock =
      activeVariants.length > 0
        ? purchasableVariants.length === 0
        : fallbackOutOfStock;

    const primaryVariant =
      purchasableVariants[0] || activeVariants[0] || null;

    const hasSinglePurchasableVariant = purchasableVariants.length === 1;
    const hasMultipleActiveVariants = activeVariants.length > 1;

    return {
      activeVariants,
      purchasableVariants,
      primaryVariant,
      isOutOfStock,
      hasSinglePurchasableVariant,
      hasMultipleActiveVariants,
      buttonLabel: isOutOfStock
        ? 'Out of stock'
        : hasSinglePurchasableVariant
          ? 'Add'
          : 'Select',
      buttonIcon: isOutOfStock
        ? 'close-circle-outline'
        : hasSinglePurchasableVariant
          ? 'cart-outline'
          : 'options-outline',
    };
  };

  const getProductSubtitle = (product: Product) => {
    const categoryName = getCategoryName(product.category as ProductCategoryShape);
    const { activeVariants } = getProductStockInfo(product);

    if (!activeVariants.length) return categoryName || 'Unavailable';
    if (activeVariants.length === 1) {
      return categoryName || activeVariants[0].name || '';
    }

    return categoryName
      ? `${categoryName} • ${activeVariants.length} options`
      : `${activeVariants.length} options`;
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = selectedCategorySlug
        ? getCategorySlug(product.category as ProductCategoryShape) ===
          selectedCategorySlug
        : true;

      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        product.title || '',
        product.slug || '',
        product.description || '',
        getCategoryName(product.category as ProductCategoryShape),
        getCategorySlug(product.category as ProductCategoryShape),
        getVariantsSearchText(product),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [products, query, selectedCategorySlug]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.is_featured).slice(0, 10),
    [products]
  );

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const aDate = new Date((a.created_at || '') as string).getTime();
        const bDate = new Date((b.created_at || '') as string).getTime();
        return bDate - aDate;
      })
      .slice(0, 10);
  }, [products]);

  const quickCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const inStockCount = useMemo(
    () =>
      filteredProducts.filter((product) => {
        const { isOutOfStock } = getProductStockInfo(product);
        return !isOutOfStock;
      }).length,
    [filteredProducts]
  );

  const formatPrice = (price: string | number) =>
    `UGX ${Number(price || 0).toLocaleString()}`;

  const handleProductAction = async (product: Product) => {
    const {
      isOutOfStock,
      hasSinglePurchasableVariant,
      hasMultipleActiveVariants,
      primaryVariant,
    } = getProductStockInfo(product);

    if (isOutOfStock) {
      Alert.alert('Out of stock', 'This product is currently unavailable.');
      return;
    }

    if (hasMultipleActiveVariants) {
      router.push(`/product/${product.slug}`);
      return;
    }

    if (!hasSinglePurchasableVariant || !primaryVariant) {
      router.push(`/product/${product.slug}`);
      return;
    }

    try {
      setAddingProductId(product.id);
      await addToCart(primaryVariant.id, 1);
    } finally {
      setAddingProductId(null);
    }
  };

  const toggleCategoryFilter = (category: Category) => {
    setSelectedCategorySlug((current) =>
      current === category.slug ? null : category.slug
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategorySlug(null);
  };

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      <Pressable
        onPress={() => setSelectedCategorySlug(null)}
        style={[
          styles.filterChip,
          !selectedCategorySlug && styles.filterChipActive,
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            !selectedCategorySlug && styles.filterChipTextActive,
          ]}
        >
          All
        </Text>
      </Pressable>

      {quickCategories.map((category) => {
        const active = selectedCategorySlug === category.slug;

        return (
          <Pressable
            key={category.id}
            onPress={() => toggleCategoryFilter(category)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                active && styles.filterChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderStockText = (product: Product) => {
    const { isOutOfStock, hasMultipleActiveVariants, activeVariants } =
      getProductStockInfo(product);

    if (isOutOfStock) {
      return <Text style={styles.outOfStockText}>Out of stock</Text>;
    }

    if (hasMultipleActiveVariants) {
      return (
        <Text style={styles.variantHint}>
          Choose from {activeVariants.length} variants
        </Text>
      );
    }

    return <Text style={styles.inStockText}>In stock</Text>;
  };

  const renderActionButton = (
    item: Product,
    style: object,
    textStyle: object,
    iconSize: number
  ) => {
    const { isOutOfStock, buttonLabel, buttonIcon } = getProductStockInfo(item);
    const isAdding = addingProductId === item.id;

    return (
      <Pressable
        style={[
          style,
          (isOutOfStock || isAdding) && styles.cartBtnDisabled,
        ]}
        disabled={isOutOfStock || isAdding}
        onPress={() =>
          protectedAction(async () => {
            await handleProductAction(item);
          })
        }
      >
        {isAdding ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons
              name={buttonIcon as keyof typeof Ionicons.glyphMap}
              size={iconSize}
              color="#fff"
            />
            <Text style={textStyle}>{buttonLabel}</Text>
          </>
        )}
      </Pressable>
    );
  };

  const renderGridProduct = ({ item }: { item: Product }) => {
    const wished = wishlistItems.some(
      (wishlistItem) => wishlistItem.product.id === item.id
    );

    return (
      <View style={[styles.gridCard, { width: gridCardWidth }]}>
        <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
          <Image
            source={{ uri: getImage(item) }}
            style={[styles.gridCardImage, { height: isTablet ? 168 : 140 }]}
          />
        </Pressable>

        <Pressable
          onPress={() =>
            protectedAction(async () => {
              await toggleWishlist(item.id);
            })
          }
          style={styles.wishlistBtn}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={18}
            color={colors.primary}
          />
        </Pressable>

        {item.is_featured ? (
          <View style={styles.featuredPill}>
            <Text style={styles.featuredPillText}>Featured</Text>
          </View>
        ) : null}

        <View style={styles.gridCardBody}>
          <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
            <Text numberOfLines={1} style={styles.gridCardTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.gridCardSubtitle}>
              {getProductSubtitle(item)}
            </Text>
          </Pressable>

          <View style={styles.gridCardMeta}>
            <Text style={styles.gridCardPrice}>
              {formatPrice(item.base_price)}
            </Text>
            {renderStockText(item)}
          </View>

          <View style={styles.gridCardFooter}>
            {renderActionButton(item, styles.cartBtn, styles.cartBtnText, 16)}
          </View>
        </View>
      </View>
    );
  };

  const renderHorizontalProductCard = (item: Product) => {
    const wished = wishlistItems.some(
      (wishlistItem) => wishlistItem.product.id === item.id
    );

    return (
      <View
        key={item.id}
        style={[styles.horizontalCard, { width: horizontalProductCardWidth }]}
      >
        <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
          <Image
            source={{ uri: getImage(item) }}
            style={styles.horizontalCardImage}
          />
        </Pressable>

        <Pressable
          onPress={() =>
            protectedAction(async () => {
              await toggleWishlist(item.id);
            })
          }
          style={styles.horizontalWishlistBtn}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={15}
            color={colors.primary}
          />
        </Pressable>

        <View style={styles.horizontalCardBody}>
          <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
            <Text numberOfLines={2} style={styles.horizontalCardTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.horizontalCardSubtitle}>
              {getProductSubtitle(item)}
            </Text>
          </Pressable>

          <Text style={styles.horizontalCardPrice}>
            {formatPrice(item.base_price)}
          </Text>

          {renderStockText(item)}

          {renderActionButton(
            item,
            styles.smallCartBtn,
            styles.smallCartBtnText,
            14
          )}
        </View>
      </View>
    );
  };

  const hasActiveFilters = Boolean(query.trim() || selectedCategorySlug);

  return (
    <Screen scroll contentContainerStyle={{ paddingTop: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <View style={[styles.hero, { minHeight: isTablet ? 260 : 220 }]}>
            <Animated.Image
              source={{ uri: heroSlides[heroIndex] || FALLBACK_HERO }}
              style={[styles.heroBg, { opacity: fadeAnim }]}
            />
            <View style={styles.overlay} />

            <View style={styles.heroContent}>
              <Text style={styles.badge}>Featured Picks</Text>

              <Text style={[styles.heroTitle, { fontSize: isTablet ? 34 : 27 }]}>
                Shop smarter, live easier
              </Text>

              <Text style={styles.heroText}>
                Discover quality products, trusted prices, and smooth delivery
                at your fingertips.
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={() => router.push('/categories')}
                  style={styles.heroPrimaryButton}
                >
                  <Text style={styles.heroPrimaryButtonText}>Shop now</Text>
                </Pressable>

                <Link href="/notifications" asChild>
                  <Pressable style={styles.heroSecondaryButton}>
                    <Text style={styles.heroSecondaryButtonText}>Alerts</Text>
                  </Pressable>
                </Link>
              </View>

              {heroSlides.length > 1 ? (
                <View style={styles.dots}>
                  {heroSlides.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, heroIndex === index && styles.dotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.searchBlock}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search products, category..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.trim() ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>

            {renderFilterChips()}

            <View style={styles.searchSummaryRow}>
              <Text style={styles.searchSummaryText}>
                {filteredProducts.length} result
                {filteredProducts.length === 1 ? '' : 's'} • {inStockCount} in
                stock
              </Text>

              {hasActiveFilters ? (
                <Pressable onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.promoRow}>
            <View style={styles.promoCard}>
              <View style={styles.promoIconWrap}>
                <Ionicons name="car-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.promoTextWrap}>
                <Text style={styles.promoTitle}>Fast Delivery</Text>
                <Text style={styles.promoText}>Quick shipping on top items</Text>
              </View>
            </View>

            <View style={styles.promoCard}>
              <View style={styles.promoIconWrap}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.promoTextWrap}>
                <Text style={styles.promoTitle}>Trusted Quality</Text>
                <Text style={styles.promoText}>Carefully selected products</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <Text style={styles.sectionSubtitle}>
                Quick access to popular categories
              </Text>
            </View>

            <Pressable onPress={() => router.push('/categories')}>
              <Text style={styles.linkText}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {quickCategories.map((category) => {
              const active = selectedCategorySlug === category.slug;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => toggleCategoryFilter(category)}
                  style={[
                    styles.categoryShortcutCard,
                    { width: categoryCardWidth },
                    active && styles.categoryShortcutCardActive,
                  ]}
                >
                  <View style={styles.categoryShortcutImageWrap}>
                    <Image
                      source={{ uri: category.image_url || FALLBACK_CATEGORY }}
                      style={styles.categoryShortcutImage}
                    />
                  </View>
                  <Text numberOfLines={2} style={styles.categoryShortcutText}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!hasActiveFilters ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Featured Products</Text>
                  <Text style={styles.sectionSubtitle}>
                    Handpicked items you may love
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProductsRow}
              >
                {(featuredProducts.length
                  ? featuredProducts
                  : products.slice(0, 10)
                ).map(renderHorizontalProductCard)}
              </ScrollView>

              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>New Arrivals</Text>
                  <Text style={styles.sectionSubtitle}>
                    Recently added products in store
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalProductsRow}
              >
                {(newArrivals.length ? newArrivals : products.slice(0, 10)).map(
                  renderHorizontalProductCard
                )}
              </ScrollView>
            </>
          ) : null}

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {hasActiveFilters ? 'Search Results' : 'All Products'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Browse everything available in store
              </Text>
            </View>
          </View>

          {loading && !products.length ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : null}

          {filteredProducts.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalProductsRow}
            >
              {filteredProducts.map(renderHorizontalProductCard)}
            </ScrollView>
          ) : !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={34} color={colors.muted} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                Try another product name, category, or clear your filters.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.primarySoft,
  },

  heroBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  heroContent: {
    padding: spacing.lg,
    gap: 10,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },

  heroTitle: {
    color: '#fff',
    fontWeight: '900',
  },

  heroText: {
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 21,
    maxWidth: '85%',
  },

  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },

  heroPrimaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },

  heroPrimaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },

  heroSecondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },

  heroSecondaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },

  dots: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  dotActive: {
    width: 20,
    backgroundColor: '#fff',
  },

  searchBlock: {
    gap: 10,
  },

  searchWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 13,
  },

  filterRow: {
    paddingRight: spacing.sm,
    gap: 8,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  filterChipTextActive: {
    color: '#fff',
  },

  searchSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  searchSummaryText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  clearFiltersText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },

  promoRow: {
    flexDirection: 'row',
    gap: 12,
  },

  promoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  promoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  promoTextWrap: {
    flex: 1,
    gap: 2,
  },

  promoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  promoText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },

  sectionHeaderRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },

  linkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  categoriesRow: {
    paddingRight: spacing.sm,
    gap: 12,
  },

  categoryShortcutCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },

  categoryShortcutCardActive: {
    transform: [{ scale: 1.03 }],
  },

  categoryShortcutImageWrap: {
    width: 66,
    height: 66,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryShortcutImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  categoryShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 15,
  },

  horizontalProductsRow: {
    paddingRight: spacing.sm,
    gap: 12,
  },

  horizontalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  horizontalCardImage: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
  },

  horizontalWishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  horizontalCardBody: {
    padding: 10,
    gap: 8,
  },

  horizontalCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    minHeight: 34,
  },

  horizontalCardSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  horizontalCardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },

  smallCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
  },

  smallCartBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  gridCardImage: {
    width: '100%',
    resizeMode: 'cover',
  },

  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  featuredPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  gridCardBody: {
    padding: 12,
    gap: 10,
  },

  gridCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  gridCardSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },

  gridCardMeta: {
    gap: 4,
  },

  gridCardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  variantHint: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  inStockText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },

  outOfStockText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '700',
  },

  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    minWidth: 72,
    justifyContent: 'center',
  },

  cartBtnDisabled: {
    opacity: 0.65,
  },

  cartBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  emptyText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
});