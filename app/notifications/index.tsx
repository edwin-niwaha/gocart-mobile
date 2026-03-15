import React, { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';

export default function NotificationsScreen() {
  const { notifications, loadAuthedData } = useShop();

  useEffect(() => {
    loadAuthedData().catch(() => undefined);
  }, [loadAuthedData]);

  return (
    <Screen scroll>
      <AuthGate message="Log in to sync your notifications.">
        <View style={styles.container}>
          {notifications.length ? (
            <View style={styles.topRow}>
              <Text style={styles.countPill}>
                {notifications.length} notification
                {notifications.length === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}

          {!notifications.length ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No notifications"
                subtitle="Order updates and promotions will appear here."
              />
            </View>
          ) : (
            <View style={styles.list}>
              {notifications.map((notification) => (
                <View key={notification.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name="notifications-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.textWrap}>
                      <Text style={styles.title}>{notification.title}</Text>
                      <Text style={styles.message}>
                        {notification.message}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </AuthGate>
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

  countPill: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },

  emptyWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },

  list: {
    gap: spacing.md,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textWrap: {
    flex: 1,
    gap: 6,
  },

  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});