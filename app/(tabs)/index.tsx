import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
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

const FALLBACK_HERO = 'https://via.placeholder.com/1200x600.png?text=GoCart+Mobile';
const FALLBACK_PRODUCT = 'https://via.placeholder.com/400x300.png?text=Product';

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
  const [activeCategory, setActiveCategory] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isTablet = width >= 768;
  const numColumns = isTablet ? 3 : 2;
  const gap = 12;
  const horizontalPadding = spacing.lg * 2;
  const cardWidth = (width - horizontalPadding - gap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    loadCatalog().catch(() => undefined);
  }, []);

  const categoryOptions = useMemo(
    () => [
      { slug: 'all', name: 'All' },
      ...categories.map((category) => ({
        slug: category.slug,
        name: category.name,
      })),
    ],
    [categories]
  );

  const heroSlides = useMemo(() => {
    const featuredImages = products
      .filter((product) => product.is_featured && (product.hero_image || product.image_urls?.[0]))
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
  }, [heroIndex]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category?.slug === activeCategory;

      const matchesQuery =
        !normalizedQuery ||
        `${product.title} ${product.description || ''}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [products, activeCategory, query]);

  const formatPrice = (price: string | number) =>
    `UGX ${Number(price || 0).toLocaleString()}`;

  const getImage = (item: any) =>
    item.hero_image || item.image_urls?.[0] || FALLBACK_PRODUCT;

  const renderProduct = ({ item }: { item: any }) => {
    const wished = wishlistItems.some((wishlistItem) => wishlistItem.product.id === item.id);

    return (
      <View style={[styles.card, { width: cardWidth }]}>
        <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
          <Image
            source={{ uri: getImage(item) }}
            style={[styles.cardImage, { height: isTablet ? 165 : 135 }]}
          />
        </Pressable>

        <Pressable
          onPress={() => protectedAction(() => toggleWishlist(item.id))}
          style={styles.wishlistBtn}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={18}
            color={colors.primary}
          />
        </Pressable>

        <View style={styles.cardBody}>
          <Pressable onPress={() => router.push(`/product/${item.slug}`)}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {item.title}
            </Text>
          </Pressable>

          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>

            <Pressable
              style={styles.cartBtn}
              onPress={() => protectedAction(() => addToCart(item.id, 1))}
            >
              <Ionicons name="cart-outline" size={16} color="#fff" />
              <Text style={styles.cartBtnText}>Add</Text>
            </Pressable>
          </View>
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
              GoCart Mobile
            </Text>
            <Text style={styles.heroText}>
              Shop quality products with fast delivery and secure checkout.
            </Text>

            <Link href="/notifications" asChild>
              <Pressable style={styles.heroButton}>
                <Text style={styles.heroButtonText}>View Alerts</Text>
              </Pressable>
            </Link>

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

        <View style={styles.chips}>
          {categoryOptions.map((category) => {
            const active = activeCategory === category.slug;

            return (
              <Pressable
                key={category.slug}
                onPress={() => setActiveCategory(category.slug)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !products.length ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : null}

        <FlatList
          data={filteredProducts}
          key={numColumns}
          numColumns={numColumns}
          scrollEnabled={false}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productList}
          renderItem={renderProduct}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptyText}>
                  Try another search or choose a different category.
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

  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },

  heroButtonText: {
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

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
  },

  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  chipText: {
    color: colors.text,
    fontWeight: '600',
  },

  chipTextActive: {
    color: colors.primary,
  },

  productList: {
    paddingBottom: spacing.xl,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  card: {
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

  cardImage: {
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

  cardBody: {
    padding: 12,
    gap: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  cardPrice: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
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