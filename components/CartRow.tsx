import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { CartItem } from '@/types';
import { money } from '@/utils/format';

export function CartRow({ item, onMinus, onPlus, onRemove }: { item: CartItem; onMinus: () => void; onPlus: () => void; onRemove: () => void }) {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.title}>{item.product.title}</Text>
        <Text style={styles.price}>{money(item.line_total ?? item.unit_price ?? item.product.price)}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onMinus} style={styles.qtyButton}><Text>-</Text></Pressable>
        <Text style={styles.qty}>{item.quantity}</Text>
        <Pressable onPress={onPlus} style={styles.qtyButton}><Text>+</Text></Pressable>
      </View>
      <Pressable onPress={onRemove}><Text style={styles.remove}>Remove</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  title: { fontWeight: '700', color: colors.text },
  price: { color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  qty: { minWidth: 20, textAlign: 'center', fontWeight: '700' },
  remove: { color: colors.danger, fontWeight: '600' },
});
