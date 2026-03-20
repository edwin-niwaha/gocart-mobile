import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
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
import type { Product } from '@/types';

const FALLBACK_HERO =
  'https://via.placeholder.com/1200x600.png?text=GoCart+Mobile';
const FALLBACK_PRODUCT =
  'https://via.placeholder.com/400x300.png?text=Product';
const FALLBACK_CATEGORY =
  'https://via.placeholder.com/200x200.png?text=Category';

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

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isTablet = width >= 768;
  const numColumns = isTablet ? 3 : 2;
  const gap = 12;
  const horizontalPadding = spacing.lg * 2;
  const gridCardWidth =
    (width - horizontalPadding - gap * (numColumns - 1)) / numColumns;
  const horizontalProductCardWidth = isTablet ? 220 : 160;
  const categoryCardWidth = isTablet ? 92 : 78;

  useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, [loadCatalog]);

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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      if (!normalizedQuery) return true;

      return `${product.title} ${product.description || ''}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [products, query]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.is_featured).slice(0, 10),
    [products]
  );

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const aDate = new Date(
          (a as Product & { created_at?: string }).created_at || 0
        ).getTime();
        const bDate = new Date(
          (b as Product & { created_at?: string }).created_at || 0
        ).getTime();
        return bDate - aDate;
      })
      .slice(0, 10);
  }, [products]);

  const allProducts = filteredProducts;

  const quickCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const formatPrice = (price: string | number) =>
    `UGX ${Number(price || 0).toLocaleString()}`;

  const getImage = (item: Product) =>
    item.hero_image || item.image_urls?.[0] || FALLBACK_PRODUCT;

  const getActiveVariants = (product: Product) =>
    product.variants?.filter((variant) => variant.is_active) || [];

  const handleAddToCart = async (product: Product) => {
    const activeVariants = getActiveVariants(product);

    if (!activeVariants.length) {
      Alert.alert('Unavailable', 'This product is currently unavailable.');
      return;
    }

    if (activeVariants.length > 1) {
      router.push(`/product/${product.slug}`);
      return;
    }

    try {
      setAddingProductId(product.id);
      await addToCart(activeVariants[0].id, 1);
    } finally {
      setAddingProductId(null);
    }
  };

  const renderGridProduct = ({ item }: { item: Product }) => {
    const wished = wishlistItems.some(
      (wishlistItem) => wishlistItem.product.id === item.id
    );
    const activeVariants = getActiveVariants(item);
    const isAdding = addingProductId === item.id;
    const hasSingleVariant = activeVariants.length === 1;

    return (
      <View style={[styles.gridCard, { width: gridCardWidth }]}>
        <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
          <Image
            source={{ uri: getImage(item) }}
            style={[styles.gridCardImage, { height: isTablet ? 165 : 135 }]}
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

        <View style={styles.gridCardBody}>
          <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
            <Text numberOfLines={1} style={styles.gridCardTitle}>
              {item.title}
            </Text>
          </Pressable>

          <View style={styles.gridCardMeta}>
            <Text style={styles.gridCardPrice}>
              {formatPrice(item.base_price)}
            </Text>

            {activeVariants.length > 1 ? (
              <Text style={styles.variantHint}>
                {activeVariants.length} options
              </Text>
            ) : null}

            {!activeVariants.length ? (
              <Text style={styles.outOfStockText}>Out of stock</Text>
            ) : null}
          </View>

          <View style={styles.gridCardFooter}>
            <Pressable
              style={[
                styles.cartBtn,
                (!activeVariants.length || isAdding) && styles.cartBtnDisabled,
              ]}
              disabled={!activeVariants.length || isAdding}
              onPress={() =>
                protectedAction(async () => {
                  await handleAddToCart(item);
                })
              }
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={hasSingleVariant ? 'cart-outline' : 'options-outline'}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.cartBtnText}>
                    {hasSingleVariant ? 'Add' : 'Select'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderHorizontalProductCard = (item: Product) => {
    const wished = wishlistItems.some(
      (wishlistItem) => wishlistItem.product.id === item.id
    );
    const activeVariants = getActiveVariants(item);
    const isAdding = addingProductId === item.id;
    const hasSingleVariant = activeVariants.length === 1;

    return (
      <View key={item.id} style={[styles.horizontalCard, { width: horizontalProductCardWidth }]}>
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
          </Pressable>

          <Text style={styles.horizontalCardPrice}>
            {formatPrice(item.base_price)}
          </Text>

          <Pressable
            style={[
              styles.smallCartBtn,
              (!activeVariants.length || isAdding) && styles.cartBtnDisabled,
            ]}
            disabled={!activeVariants.length || isAdding}
            onPress={() =>
              protectedAction(async () => {
                await handleAddToCart(item);
              })
            }
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={hasSingleVariant ? 'cart-outline' : 'options-outline'}
                  size={14}
                  color="#fff"
                />
                <Text style={styles.smallCartBtnText}>
                  {hasSingleVariant ? 'Add' : 'Select'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={[styles.hero, { minHeight: isTablet ? 250 : 210 }]}>
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
              Discover quality products, trusted prices, and smooth delivery at
              your fingertips.
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

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products..."
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

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
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
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
          {quickCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                router.push({
                  pathname: '/categories',
                  params: { category: category.slug },
                })
              }
              style={[styles.categoryShortcutCard, { width: categoryCardWidth }]}
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
          ))}
        </ScrollView>

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
          {(featuredProducts.length ? featuredProducts : products.slice(0, 10)).map(
            renderHorizontalProductCard
          )}
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

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>
              {query.trim() ? 'Search Results' : 'All Products'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {allProducts.length} item{allProducts.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {loading && !products.length ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : null}

        <FlatList
          data={allProducts}
          key={numColumns}
          numColumns={numColumns}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.productList}
          renderItem={renderGridProduct}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptyText}>
                  Try another search term.
                </Text>
              </View>
            ) : null
          }
        />
      </View>
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

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.text,
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
  },

  categoryShortcutImageWrap: {
    width: 64,
    height: 64,
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

  productList: {
    paddingBottom: spacing.xl,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
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

  gridCardBody: {
    padding: 12,
    gap: 10,
  },

  gridCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
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

  outOfStockText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
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
    gap: 6,
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
  },
});