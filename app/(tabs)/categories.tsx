import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

const FALLBACK_CATEGORY =
  'https://via.placeholder.com/300x300.png?text=Category';

export default function CategoriesScreen() {
  const { categories, loadCatalog } = useShop();

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
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Browse products by category</Text>
      </View>

      {!categories.length ? (
        <EmptyState
          title="No categories yet"
          subtitle="Create categories in Django and they will appear here."
        />
      ) : (
        <View style={styles.grid}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => handleCategoryPress(category.slug)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <Image
                source={{ uri: category.image_url || FALLBACK_CATEGORY }}
                style={styles.image}
              />

              <Text numberOfLines={1} style={styles.name}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    gap: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: colors.muted,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  card: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardPressed: {
    opacity: 0.85,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 14,
    marginBottom: 8,
    resizeMode: 'cover',
  },

  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});