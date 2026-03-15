import React, { useEffect } from 'react';
import {
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

const FALLBACK_CATEGORY =
  'https://via.placeholder.com/300x300.png?text=Category';

export default function CategoriesScreen() {
  const { categories, loadCatalog } = useShop();
  const { width } = useWindowDimensions();

  const gap = 14;
  const contentPadding = spacing.lg * 2;
  const cardWidth = (width - contentPadding - gap) / 2;

  useEffect(() => {
    if (!categories.length) {
      loadCatalog().catch(() => undefined);
    }
  }, [categories.length, loadCatalog]);

  const handleCategoryPress = (slug: string) => {
    router.push({
      pathname: '/',
      params: { category: slug },
    });
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        {!categories.length ? (
          <EmptyState
            title="No categories yet"
            subtitle="Create categories in Django and they will appear here."
          />
        ) : (
          <>
            <View style={styles.topRow}>
              <Text style={styles.resultText}>
                {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
              </Text>
            </View>

            <View style={styles.grid}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategoryPress(category.slug)}
                  style={({ pressed }) => [
                    styles.card,
                    { width: cardWidth },
                    pressed && styles.cardPressed,
                  ]}
                >
                  <Image
                    source={{ uri: category.image_url || FALLBACK_CATEGORY }}
                    style={styles.image}
                  />

                  <View style={styles.imageOverlay} />

                  <View style={styles.cardContent}>
                    <View style={styles.iconBadge}>
                      <Ionicons name="grid-outline" size={14} color="#fff" />
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.textWrap}>
                        <Text numberOfLines={2} style={styles.name}>
                          {category.name}
                        </Text>
                        <Text style={styles.hint}>Explore products</Text>
                      </View>

                      <View style={styles.arrowCircle}>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={colors.text}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  card: {
    height: 210,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },

  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
  },

  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },

  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardFooter: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  textWrap: {
    flex: 1,
    gap: 2,
  },

  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  hint: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});