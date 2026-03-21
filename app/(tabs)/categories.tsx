import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import type { Product, ProductVariant } from '@/types';

const FALLBACK_CATEGORY =
  'https://via.placeholder.com/300x300.png?text=Category';
const FALLBACK_PRODUCT =
  'https://via.placeholder.com/400x300.png?text=Product';

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

function getActiveVariants(product: Product) {
  const source = product.variants?.filter((variant) => variant.is_active) || [];
  return dedupeVariants(source);
}

function getProductStockInfo(product: Product) {
  const activeVariants = getActiveVariants(product);
  const selectedVariant = getInitialVariant(activeVariants);
  const isOutOfStock = selectedVariant
    ? !selectedVariant.is_in_stock
    : !product.is_in_stock;

  return {
    activeVariants,
    selectedVariant,
    isOutOfStock,
    hasSingleVariant: activeVariants.length === 1,
    hasMultipleVariants: activeVariants.length > 1,
    stockLabel: isOutOfStock ? 'Out of stock' : 'In stock',
  };
}

export default function CategoriesScreen() {
  const {
    categories,
    products,
    wishlistItems,
    loadCatalog,
    loading,
    toggleWishlist,
    addToCart,
  } = useShop();

  const protectedAction = useProtectedAction();
  const { width } = useWindowDimensions();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, [loadCatalog]);

  useEffect(() => {
    if (!activeCategory && categories.length) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCatalog();
    } finally {
      setRefreshing(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return categories;

    return categories.filter((category) =>
      `${category.name} ${category.slug}`.toLowerCase().includes(normalizedQuery)
    );
  }, [categories, normalizedQuery]);

  const selectedCategory =
    filteredCategories.find((c) => c.slug === activeCategory) ||
    categories.find((c) => c.slug === activeCategory) ||
    null;

  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];

    return products.filter((product) => {
      if (product.category?.slug !== activeCategory) return false;

      if (!normalizedQuery) return true;

      const text = [
        product.title,
        product.slug,
        product.description,
        product.category?.name,
        ...(product.variants || []).map(
          (variant) => `${variant.name || ''} ${variant.sku || ''}`
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(normalizedQuery);
    });
  }, [products, activeCategory, normalizedQuery]);

  const getCategoryCount = (slug: string) =>
    products.filter((p) => p.category?.slug === slug).length;

  const getProductImage = (product: Product) =>
    product.hero_image || product.image_urls?.[0] || FALLBACK_PRODUCT;

  const formatPrice = (price: string | number) =>
    `UGX ${Number(price || 0).toLocaleString()}`;

  const getProductSubtitle = (product: Product) => {
    const categoryName = product.category?.name || '';
    const { activeVariants } = getProductStockInfo(product);

    if (!activeVariants.length) return categoryName || 'Unavailable';
    if (activeVariants.length === 1) return categoryName || 'Available';

    return categoryName
      ? `${categoryName} • ${activeVariants.length} options`
      : `${activeVariants.length} options`;
  };

  const handleAddToCart = async (product: Product) => {
    const { activeVariants, selectedVariant, isOutOfStock } =
      getProductStockInfo(product);

    if (!activeVariants.length) {
      Alert.alert('Unavailable', 'This product has no purchasable option yet.');
      return;
    }

    if (activeVariants.length > 1) {
      router.push(`/product/${product.slug}`);
      return;
    }

    if (isOutOfStock || !selectedVariant) {
      Alert.alert('Out of stock', 'This product is currently unavailable.');
      return;
    }

    try {
      setAddingProductId(product.id);
      await addToCart(selectedVariant.id, 1);
    } finally {
      setAddingProductId(null);
    }
  };

  const sidebarWidth = 96;
  const contentWidth = width - sidebarWidth - 36;
  const productCardWidth = Math.min(Math.max(contentWidth * 0.58, 150), 190);

  if (!loading && !categories.length) {
    return (
      <Screen>
        <EmptyState
          title="No categories yet"
          subtitle="Create categories in Django and they will appear here."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories or products..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />

            {!!query && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {loading && !categories.length ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <View style={styles.layout}>
              <View style={styles.sidebar}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {filteredCategories.map((category) => {
                    const active = category.slug === activeCategory;

                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setActiveCategory(category.slug)}
                        style={[
                          styles.categoryItem,
                          active && styles.categoryItemActive,
                        ]}
                      >
                        <Image
                          source={{ uri: category.image_url || FALLBACK_CATEGORY }}
                          style={styles.categoryImage}
                        />

                        <Text
                          numberOfLines={2}
                          style={[
                            styles.categoryName,
                            active && styles.categoryNameActive,
                          ]}
                        >
                          {category.name}
                        </Text>

                        <Text style={styles.categoryMeta}>
                          {getCategoryCount(category.slug)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.content}>
                {selectedCategory ? (
                  <>
                    <View style={styles.hero}>
                      <Image
                        source={{ uri: selectedCategory.image_url || FALLBACK_CATEGORY }}
                        style={styles.heroImage}
                      />
                      <View style={styles.heroOverlay} />

                      <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>{selectedCategory.name}</Text>
                        <Text style={styles.heroSubtext}>
                          {categoryProducts.length} products
                        </Text>
                      </View>
                    </View>

                    {categoryProducts.length ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productsRow}
                      >
                        {categoryProducts.map((product) => {
                          const wished = wishlistItems.some(
                            (wishlistItem) => wishlistItem.product.id === product.id
                          );

                          const {
                            activeVariants,
                            isOutOfStock,
                            hasSingleVariant,
                            hasMultipleVariants,
                            stockLabel,
                          } = getProductStockInfo(product);

                          const isAdding = addingProductId === product.id;

                          return (
                            <Pressable
                              key={product.id}
                              onPress={() => router.push(`/product/${product.slug}`)}
                              style={[styles.card, { width: productCardWidth }]}
                            >
                              <View style={styles.imageWrapper}>
                                <Image
                                  source={{ uri: getProductImage(product) }}
                                  style={styles.cardImage}
                                />

                                <Pressable
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    protectedAction(async () => {
                                      await toggleWishlist(product.id);
                                    });
                                  }}
                                  style={styles.wishlistBtn}
                                >
                                  <Ionicons
                                    name={wished ? 'heart' : 'heart-outline'}
                                    size={18}
                                    color={colors.primary}
                                  />
                                </Pressable>
                              </View>

                              <View style={styles.cardBody}>
                                <Pressable
                                  onPress={() => router.push(`/product/${product.slug}`)}
                                >
                                  <Text numberOfLines={2} style={styles.cardTitle}>
                                    {product.title}
                                  </Text>

                                  <Text numberOfLines={1} style={styles.cardSubtitle}>
                                    {getProductSubtitle(product)}
                                  </Text>
                                </Pressable>

                                <View style={styles.cardMeta}>
                                  <Text style={styles.cardPrice}>
                                    {formatPrice(product.base_price)}
                                  </Text>

                                  <View
                                    style={[
                                      styles.stockBadgeBottom,
                                      isOutOfStock
                                        ? styles.stockBadgeOut
                                        : styles.stockBadgeIn,
                                    ]}
                                  >
                                    <Ionicons
                                      name={
                                        isOutOfStock
                                          ? 'close-circle'
                                          : 'checkmark-circle'
                                      }
                                      size={12}
                                      color={
                                        isOutOfStock ? '#dc2626' : colors.success
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.stockBadgeText,
                                        isOutOfStock
                                          ? styles.stockBadgeTextOut
                                          : styles.stockBadgeTextIn,
                                      ]}
                                    >
                                      {stockLabel}
                                    </Text>
                                  </View>

                                  {hasMultipleVariants && !isOutOfStock && (
                                    <Text style={styles.variantHint}>
                                      Choose from {activeVariants.length} variants
                                    </Text>
                                  )}
                                </View>

                                <Pressable
                                  style={[
                                    styles.cartButton,
                                    (isOutOfStock || isAdding) &&
                                      styles.cartBtnDisabled,
                                  ]}
                                  disabled={isOutOfStock || isAdding}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    protectedAction(async () => {
                                      await handleAddToCart(product);
                                    });
                                  }}
                                >
                                  {isAdding ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                  ) : (
                                    <>
                                      <Ionicons
                                        name={
                                          isOutOfStock
                                            ? 'close-circle-outline'
                                            : hasSingleVariant
                                              ? 'cart-outline'
                                              : 'options-outline'
                                        }
                                        size={16}
                                        color="#fff"
                                      />
                                      <Text style={styles.cartButtonText}>
                                        {isOutOfStock
                                          ? 'Out of stock'
                                          : hasSingleVariant
                                            ? 'Add to Cart'
                                            : 'Select'}
                                      </Text>
                                    </>
                                  )}
                                </Pressable>
                              </View>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <EmptyState
                        title="No products found"
                        subtitle="Try another category or search term."
                      />
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="No category selected"
                    subtitle="Choose a category from the left."
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 10,
  },

  layout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  sidebar: {
    width: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },

  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  categoryItemActive: {
    backgroundColor: colors.primarySoft,
  },

  categoryImage: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginBottom: 6,
  },

  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  categoryNameActive: {
    color: colors.primary,
  },

  categoryMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },

  content: {
    flex: 1,
    gap: 10,
    alignSelf: 'flex-start',
  },

  hero: {
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    justifyContent: 'flex-end',
  },

  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  heroContent: {
    padding: 12,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },

  heroSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  productsRow: {
    paddingRight: 12,
    alignItems: 'flex-start',
    gap: 10,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECECEC',
    alignSelf: 'flex-start',
  },

  imageWrapper: {
    position: 'relative',
  },

  cardImage: {
    width: '100%',
    height: 88,
  },

  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  cardBody: {
    padding: 8,
    gap: 8,
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    minHeight: 30,
  },

  cardSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  cardMeta: {
    gap: 6,
  },

  cardPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  stockBadgeBottom: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  stockBadgeIn: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },

  stockBadgeOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },

  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  stockBadgeTextIn: {
    color: colors.success,
  },

  stockBadgeTextOut: {
    color: '#dc2626',
  },

  variantHint: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },

  cartButton: {
    marginTop: 8,
    minHeight: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primary,
  },

  cartBtnDisabled: {
    opacity: 0.6,
  },

  cartButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});