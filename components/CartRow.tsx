import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { CartItem } from '@/types';
import { money } from '@/utils/format';

export function CartRow({
  item,
  onMinus,
  onPlus,
  onRemove,
}: {
  item: CartItem;
  onMinus: () => void;
  onPlus: () => void;
  onRemove: () => void;
}) {
  const unitPrice = Number(item.unit_price ?? item.variant?.price ?? 0);
  const lineTotal = Number(item.line_total ?? unitPrice * item.quantity);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.product.title}</Text>

        {item.variant?.name ? (
          <Text style={styles.variant}>{item.variant.name}</Text>
        ) : null}

        <Text style={styles.price}>{money(unitPrice)}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.actions}>
          <Pressable onPress={onMinus} style={styles.qtyButton}>
            <Text>-</Text>
          </Pressable>

          <Text style={styles.qty}>{item.quantity}</Text>

          <Pressable onPress={onPlus} style={styles.qtyButton}>
            <Text>+</Text>
          </Pressable>
        </View>

        <Text style={styles.total}>{money(lineTotal)}</Text>

        <Pressable onPress={onRemove}>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  info: {
    flex: 1,
    gap: 4,
  },

  title: {
    fontWeight: '700',
    color: colors.text,
  },

  variant: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  price: {
    color: colors.primary,
    fontWeight: '700',
  },

  right: {
    alignItems: 'flex-end',
    gap: 6,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  qty: {
    minWidth: 20,
    textAlign: 'center',
    fontWeight: '700',
  },

  total: {
    fontWeight: '800',
    color: colors.text,
  },

  remove: {
    color: colors.danger,
    fontWeight: '600',
  },
});