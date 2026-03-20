import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import type { Product } from '@/types';

const FALLBACK_CATEGORY =
  'https://via.placeholder.com/300x300.png?text=Category';
const FALLBACK_PRODUCT =
  'https://via.placeholder.com/400x300.png?text=Product';

export default function CategoriesScreen() {
  const { categories, products, loadCatalog, loading } = useShop();
  const { width } = useWindowDimensions();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const isTablet = width >= 768;
  const sidebarWidth = isTablet ? 120 : 95;
  const layoutGap = 12;
  const contentWidth = width - spacing.lg * 2 - sidebarWidth - layoutGap;
  const numColumns = isTablet ? 3 : 2;
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, [loadCatalog]);

  useEffect(() => {
    if (!activeCategory && categories.length) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.slug === activeCategory) || null,
    [categories, activeCategory]
  );

  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter(
      (product) => product.category?.slug === activeCategory
    );
  }, [products, activeCategory]);

  const previewProducts = useMemo(
    () => categoryProducts.slice(0, isTablet ? 6 : 4),
    [categoryProducts, isTablet]
  );

  const displayedProducts = showAllProducts ? categoryProducts : previewProducts;

  const getProductImage = (product: Product) =>
    product.hero_image || product.image_urls?.[0] || FALLBACK_PRODUCT;

  const formatPrice = (price: string | number) =>
    `UGX ${Number(price || 0).toLocaleString()}`;

  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    setShowAllProducts(false);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <Pressable
        onPress={() => router.push(`/product/${item.slug}`)}
        style={[styles.productCard, { width: cardWidth }]}
      >
        <Image
          source={{ uri: getProductImage(item) }}
          style={styles.productImage}
        />

        <View style={styles.productBody}>
          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>

          <Text style={styles.productPrice}>{formatPrice(item.base_price)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        {!loading && !categories.length ? (
          <EmptyState
            title="No categories yet"
            subtitle="Create categories in Django and they will appear here."
          />
        ) : (
          <>
            <View style={styles.topRow}>
              <Text style={styles.pageTitle}>Categories</Text>
              <Text style={styles.resultText}>
                {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
              </Text>
            </View>

            {loading && !categories.length ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <View style={styles.layout}>
                <View style={[styles.sidebar, { width: sidebarWidth }]}>
                  {categories.map((category) => {
                    const active = category.slug === activeCategory;

                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => handleCategorySelect(category.slug)}
                        style={[
                          styles.categoryItem,
                          active && styles.categoryItemActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.categoryThumbWrap,
                            active && styles.categoryThumbWrapActive,
                          ]}
                        >
                          <Image
                            source={{
                              uri: category.image_url || FALLBACK_CATEGORY,
                            }}
                            style={styles.categoryThumb}
                          />
                        </View>

                        <Text
                          numberOfLines={2}
                          style={[
                            styles.categoryLabel,
                            active && styles.categoryLabelActive,
                          ]}
                        >
                          {category.name}
                        </Text>

                        {active ? <View style={styles.activeBar} /> : null}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.content}>
                  {selectedCategory ? (
                    <>
                      <View style={styles.categoryHero}>
                        <Image
                          source={{
                            uri: selectedCategory.image_url || FALLBACK_CATEGORY,
                          }}
                          style={styles.categoryHeroImage}
                        />
                        <View style={styles.categoryHeroOverlay} />

                        <View style={styles.categoryHeroContent}>
                          <View style={styles.heroBadge}>
                            <Ionicons
                              name="grid-outline"
                              size={12}
                              color="#fff"
                            />
                            <Text style={styles.heroBadgeText}>Category</Text>
                          </View>

                          <Text style={styles.categoryHeroTitle}>
                            {selectedCategory.name}
                          </Text>

                          <Text style={styles.categoryHeroSubtitle}>
                            {showAllProducts
                              ? 'All products in this category'
                              : 'Browse products in this category'}
                          </Text>

                          <Pressable
                            onPress={() => setShowAllProducts((prev) => !prev)}
                            style={styles.exploreButton}
                          >
                            <Text style={styles.exploreButtonText}>
                              {showAllProducts ? 'Show less' : 'View all'}
                            </Text>
                            <Ionicons
                              name={
                                showAllProducts
                                  ? 'chevron-up-outline'
                                  : 'arrow-forward'
                              }
                              size={14}
                              color="#fff"
                            />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                          {showAllProducts ? 'All Products' : 'Featured Products'}
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                          {displayedProducts.length} item
                          {displayedProducts.length === 1 ? '' : 's'}
                          {!showAllProducts && categoryProducts.length > displayedProducts.length
                            ? ` of ${categoryProducts.length}`
                            : ''}
                        </Text>
                      </View>

                      <FlatList
                        data={displayedProducts}
                        key={numColumns}
                        numColumns={numColumns}
                        scrollEnabled={false}
                        keyExtractor={(item) => String(item.id)}
                        columnWrapperStyle={
                          numColumns > 1 ? styles.row : undefined
                        }
                        contentContainerStyle={styles.productList}
                        renderItem={renderProduct}
                        ListEmptyComponent={
                          <View style={styles.emptyProducts}>
                            <Text style={styles.emptyProductsTitle}>
                              No products in this category
                            </Text>
                            <Text style={styles.emptyProductsText}>
                              Add products in Django and they will appear here.
                            </Text>
                          </View>
                        }
                      />
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
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  resultText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  layout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  sidebar: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
    backgroundColor: '#fff',
  },

  categoryItemActive: {
    backgroundColor: '#FFF7ED',
  },

  categoryThumbWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  categoryThumbWrapActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  categoryThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },

  categoryLabelActive: {
    color: colors.primary,
  },

  activeBar: {
    position: 'absolute',
    right: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
    backgroundColor: colors.primary,
  },

  content: {
    flex: 1,
    gap: 12,
  },

  categoryHero: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    justifyContent: 'flex-end',
  },

  categoryHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  categoryHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  categoryHeroContent: {
    padding: 14,
    gap: 8,
  },

  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  categoryHeroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },

  categoryHeroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
  },

  exploreButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  exploreButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  sectionHeader: {
    gap: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },

  productList: {
    paddingBottom: spacing.xl,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECECEC',
    marginBottom: 10,
  },

  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },

  productBody: {
    padding: 10,
    gap: 6,
  },

  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    minHeight: 34,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },

  emptyProducts: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: 6,
  },

  emptyProductsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  emptyProductsText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});