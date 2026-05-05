import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { CartItem } from '@/types';
import { money } from '@/utils/format';
import { getCartItemTotal, getPrimaryImage } from '@/utils/product';

export function CartRow({
  item,
  onMinus,
  onPlus,
  onRemove,
}: {
  item: CartItem;
  onMinus?: () => void;
  onPlus: () => void;
  onRemove: () => void;
}) {
  const unitPrice = Number(item.unit_price ?? item.variant?.price ?? 0);
  const lineTotal = getCartItemTotal(item);
  const disableMinus = item.quantity <= 1;
  const image = getPrimaryImage(item.product);

  return (
    <View style={styles.card}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons name="bag-outline" size={22} color={colors.muted} />
        </View>
      )}

      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.title}>
          {item.product.title}
        </Text>

        {item.variant?.name ? (
          <View style={styles.variantPill}>
            <Ionicons name="cube-outline" size={12} color={colors.primary} />
            <Text numberOfLines={1} style={styles.variant}>
              {item.variant.name}
            </Text>
          </View>
        ) : null}

        <Text style={styles.price}>{money(unitPrice)}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.actions}>
          <Pressable
            onPress={onMinus}
            disabled={disableMinus}
            style={[
              styles.qtyButton,
              disableMinus && styles.qtyButtonDisabled,
            ]}
          >
            <Ionicons
              name="remove"
              size={15}
              color={disableMinus ? colors.subtle : colors.text}
            />
          </Pressable>

          <Text style={styles.qty}>{item.quantity}</Text>

          <Pressable onPress={onPlus} style={styles.qtyButton}>
            <Ionicons name="add" size={15} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.total}>{money(lineTotal)}</Text>

        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    ...shadows.soft,
  },

  image: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },

  imageFallback: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  info: {
    flex: 1,
    gap: 7,
  },

  title: {
    fontWeight: '900',
    color: colors.text,
    lineHeight: 19,
  },

  variantPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  variant: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '800',
  },

  price: {
    color: colors.primary,
    fontWeight: '800',
  },

  right: {
    alignItems: 'flex-end',
    gap: 7,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  qtyButtonDisabled: {
    opacity: 0.45,
  },

  qty: {
    minWidth: 20,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.text,
  },

  total: {
    fontWeight: '900',
    color: colors.text,
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  remove: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
});
