import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useShop } from '@/providers/ShopProvider';

export default function ProfileScreen() {
  const { orders, wishlist, cartCount } = useShop();

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>GC</Text></View>
        <View>
          <Text style={styles.name}>GoCart User</Text>
          <Text style={styles.email}>demo@gocart.app</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}><Text style={styles.statNumber}>{orders.length}</Text><Text style={styles.statLabel}>Orders</Text></View>
        <View style={styles.statCard}><Text style={styles.statNumber}>{wishlist.length}</Text><Text style={styles.statLabel}>Wishlist</Text></View>
        <View style={styles.statCard}><Text style={styles.statNumber}>{cartCount}</Text><Text style={styles.statLabel}>Cart items</Text></View>
      </View>

      <Pressable onPress={() => router.push('/orders')} style={styles.action}><Text style={styles.actionTitle}>View order history</Text><Text style={styles.actionArrow}>→</Text></Pressable>
      <Pressable onPress={() => router.push('/(tabs)/wishlist')} style={styles.action}><Text style={styles.actionTitle}>Saved products</Text><Text style={styles.actionArrow}>→</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#111827', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  email: { color: '#D1D5DB' },
  stats: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center', gap: 6 },
  statNumber: { color: '#111827', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#6B7280' },
  action: { backgroundColor: '#fff', borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-between' },
  actionTitle: { color: '#111827', fontWeight: '700' },
  actionArrow: { color: '#6B7280', fontSize: 20 },
});
