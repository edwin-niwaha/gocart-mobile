import React, { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

export default function NotificationsScreen() {
  const { notifications, loadAuthedData } = useShop();

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, []);

  return (
    <Screen scroll>
      <AuthGate message="Log in to sync notification history from Django.">
        {!notifications.length ? <EmptyState title="No notifications" subtitle="Order updates and promos will show up here when your backend sends them." /> : null}
        {notifications.map((notification) => (
          <View key={notification.id} style={styles.card}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message}>{notification.message}</Text>
          </View>
        ))}
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 6 },
  title: { fontWeight: '800', color: colors.text },
  message: { color: colors.muted },
});
