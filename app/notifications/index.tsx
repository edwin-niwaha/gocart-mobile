import React, { useEffect, useCallback } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { useShop } from '@/providers/ShopProvider';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const shop = useShop();

  const notifications = shop.notifications ?? [];
  const totalNotifications = shop.totalNotifications ?? notifications.length;
  const loadNotifications = shop.loadNotifications;
  const loadMoreNotifications = shop.loadMoreNotifications;
  const refreshNotifications = shop.refreshNotifications;
  const hasMoreNotifications = shop.hasMoreNotifications ?? false;
  const loadingNotifications = shop.loadingNotifications ?? false;
  const loadingMoreNotifications = shop.loadingMoreNotifications ?? false;
  const refreshingNotifications = shop.refreshingNotifications ?? false;

  const markNotificationRead = shop.markNotificationRead;
  const markAllNotificationsRead = shop.markAllNotificationsRead;
  const markingNotificationIds = shop.markingNotificationIds ?? [];
  const markingAllNotifications = shop.markingAllNotifications ?? false;

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, [loadNotifications]);

  const handleOpenNotification = useCallback(
    async (notificationId: number, isRead: boolean) => {
      if (isRead) return;
      await markNotificationRead(notificationId);
    },
    [markNotificationRead]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMoreNotifications) return;
    if (loadingMoreNotifications) return;
    if (loadingNotifications) return;

    loadMoreNotifications().catch(() => undefined);
  }, [
    hasMoreNotifications,
    loadingMoreNotifications,
    loadingNotifications,
    loadMoreNotifications,
  ]);

  const handleRefresh = useCallback(() => {
    refreshNotifications().catch(() => undefined);
  }, [refreshNotifications]);

  const renderItem = useCallback(
    ({ item: notification }: { item: Notification }) => {
      const isMarking = markingNotificationIds.includes(notification.id);
      const isRead = Boolean(notification.is_read);

      return (
        <Pressable
          onPress={() => handleOpenNotification(notification.id, isRead)}
          disabled={isMarking}
          style={({ pressed }) => [
            styles.card,
            !isRead && styles.cardUnread,
            pressed && styles.pressed,
            isMarking && styles.disabled,
          ]}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={isRead ? 'notifications-outline' : 'notifications'}
                size={18}
                color={colors.primary}
              />
            </View>

            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, !isRead && styles.titleUnread]}>
                  {notification.title}
                </Text>

                {!isRead ? <View style={styles.unreadDot} /> : null}
              </View>

              <Text style={styles.message}>{notification.message}</Text>

              {notification.read_at ? (
                <Text style={styles.meta}>Read</Text>
              ) : (
                <Text style={styles.meta}>Tap to mark as read</Text>
              )}
            </View>
          </View>
        </Pressable>
      );
    },
    [handleOpenNotification, markingNotificationIds]
  );

  const renderHeader = useCallback(
    () =>
      notifications.length ? (
        <View style={styles.topRow}>
          <Text style={styles.countPill}>
            {totalNotifications} notification
            {totalNotifications === 1 ? '' : 's'}
          </Text>

          <Pressable
            onPress={() => markAllNotificationsRead()}
            disabled={markingAllNotifications || !notifications.length}
            style={({ pressed }) => [
              styles.markAllButton,
              pressed && styles.pressed,
              (markingAllNotifications || !notifications.length) && styles.disabled,
            ]}
          >
            {markingAllNotifications ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
          </Pressable>
        </View>
      ) : null,
    [
      notifications.length,
      totalNotifications,
      markAllNotificationsRead,
      markingAllNotifications,
    ]
  );

  const renderFooter = useCallback(() => {
    if (loadingMoreNotifications) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    return <View style={styles.footerSpacer} />;
  }, [loadingMoreNotifications]);

  return (
    <Screen>
      <AuthGate message="Log in to sync your notifications.">
        {loadingNotifications && !notifications.length ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !notifications.length ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No notifications"
              subtitle="Order updates and promotions will appear here."
            />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.container}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            onRefresh={handleRefresh}
            refreshing={refreshingNotifications}
            showsVerticalScrollIndicator={false}
          />
        )}
      </AuthGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  markAllButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
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
    marginBottom: spacing.md,
  },
  cardUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  titleUnread: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerSpacer: {
    height: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
});