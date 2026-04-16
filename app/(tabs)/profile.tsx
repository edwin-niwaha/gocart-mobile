import React, { useEffect, useMemo } from 'react';
import { Link } from 'expo-router';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthGate } from '@/components/AuthGate';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useShop } from '@/providers/ShopProvider';
import { fullName } from '@/utils/format';

type MenuRowProps = {
  label: string;
  icon: string;
  href?: string;
  onPress?: () => void;
  danger?: boolean;
  noBorder?: boolean;
};

type QuickActionItem = {
  href: string;
  icon: string;
  label: string;
  count?: number;
};

type SupportActionProps = {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'default';
};

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <View style={styles.countBadge}>
      <Text style={styles.countBadgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function IconTile({
  href,
  icon,
  label,
  count,
}: QuickActionItem) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.iconTile, pressed && styles.pressed]}>
        <View style={styles.iconTileWrap}>
          <View style={styles.iconTileCircle}>
            <Text style={styles.iconTileEmoji}>{icon}</Text>
          </View>
          {typeof count === 'number' ? <CountBadge count={count} /> : null}
        </View>

        <Text style={styles.iconTileLabel} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function QuickActionsGrid({ items }: { items: QuickActionItem[] }) {
  return (
    <View style={styles.quickActionsCard}>
      {items.map((item) => (
        <IconTile key={item.href} {...item} />
      ))}
    </View>
  );
}

function StatusPill({
  label,
  muted,
}: {
  label: string;
  muted?: boolean;
}) {
  return (
    <View style={[styles.statusPill, muted && styles.statusPillMuted]}>
      <View style={[styles.statusDot, muted && styles.statusDotMuted]} />
      <Text style={[styles.statusPillText, muted && styles.statusPillTextMuted]}>
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  label,
  icon,
  href,
  onPress,
  danger,
  noBorder,
}: MenuRowProps) {
  const content = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !noBorder && styles.menuRowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.menuIconWrap, danger && styles.menuIconWrapDanger]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>

      <Text style={[styles.menuLabel, danger && styles.dangerText]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return href ? (
    <Link href={href} asChild>
      {content}
    </Link>
  ) : (
    content
  );
}

function SupportAction({
  icon,
  label,
  onPress,
  variant = 'default',
}: SupportActionProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.supportButton,
        isPrimary ? styles.supportButtonPrimary : styles.supportButtonDefault,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.supportButtonIcon}>{icon}</Text>
      <Text style={styles.supportButtonLabel}>{label}</Text>
    </Pressable>
  );
}

function InboxPreview({ unreadCount }: { unreadCount: number }) {
  return (
    <Link href="/notifications" asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.inboxRow}>
          <View style={styles.inboxLeft}>
            <View style={styles.inboxIconWrap}>
              <Text style={styles.inboxIcon}>📬</Text>
            </View>

            <View style={styles.inboxTextWrap}>
              <Text style={styles.inboxTitle}>Unread notifications</Text>
              <Text style={styles.inboxSubtitle} numberOfLines={2}>
                You have {unreadCount} unread notification
                {unreadCount === 1 ? '' : 's'}.
              </Text>
            </View>
          </View>

          <View style={styles.inboxCountWrap}>
            <Text style={styles.inboxCountText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const {
    orders,
    reviews,
    wishlistItems,
    notifications,
    addresses,
    loadAuthedData,
  } = useShop();

  useEffect(() => {
    if (isAuthenticated) {
      loadAuthedData().catch(() => undefined);
    }
  }, [isAuthenticated, loadAuthedData]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = useMemo(
    () => safeNotifications.filter((item) => !item.is_read).length,
    [safeNotifications]
  );

  const initials =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    'G';

  const displayName = isAuthenticated
    ? fullName(user?.first_name, user?.last_name, user?.username)
    : 'Guest';

  const stats = useMemo(
    () => [
      { label: 'Orders', value: orders.length },
      { label: 'Reviews', value: reviews.length },
      { label: 'Saved', value: wishlistItems.length },
    ],
    [orders.length, reviews.length, wishlistItems.length]
  );

  const quickActions = useMemo<QuickActionItem[]>(
    () => [
      { href: '/orders', icon: '📦', label: 'Orders', count: orders.length },
      { href: '/notifications', icon: '📬', label: 'Inbox', count: unreadCount },
      { href: '#', icon: '⭐', label: 'Ratings', count: reviews.length },
      { href: '/addresses', icon: '📍', label: 'Addresses', count: addresses.length },
      { href: '/account', icon: '⚙️', label: 'Settings' },
    ],
    [orders.length, unreadCount, reviews.length, addresses.length]
  );

  const openWhatsApp = () => {
    const phone = '256703163074';
    const message = 'Hello, I need help with my account or order.';
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  };

  const openSupportEmail = () => {
    Linking.openURL('mailto:support@yourshop.com?subject=Help%20%26%20Support');
  };

  return (
    <Screen scroll contentContainerStyle={styles.page}>
      <View style={styles.heroCard}>
        <View style={styles.heroBackgroundShape} />

        <View style={styles.heroHeader}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{user?.email || 'Not signed in'}</Text>

            <View style={styles.heroMetaRow}>
              <StatusPill
                label={isAuthenticated ? 'Standard Member' : 'Guest'}
                muted={!isAuthenticated}
              />

              {isAuthenticated && unreadCount > 0 ? (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {isAuthenticated ? (
          <View style={styles.statsRow}>
            {stats.map((item, index) => (
              <React.Fragment key={item.label}>
                <StatItem value={item.value} label={item.label} />
                {index < stats.length - 1 ? <View style={styles.statDivider} /> : null}
              </React.Fragment>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <SectionHeader title="Account" />
          <AuthGate message="Log in to manage your orders, inbox, addresses, and account settings.">
            <QuickActionsGrid items={quickActions} />
          </AuthGate>
        </View>

        {isAuthenticated && unreadCount > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Inbox" />
            <InboxPreview unreadCount={unreadCount} />
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Support" />
          <View style={styles.supportRow}>
            <SupportAction
              icon="💬"
              label="WhatsApp"
              onPress={openWhatsApp}
              variant="primary"
            />
            <SupportAction
              icon="✉️"
              label="Email Support"
              onPress={openSupportEmail}
            />
          </View>
        </View>

        {isAuthenticated ? (
          <View style={styles.section}>
            <SectionHeader title="Session" />
            <View style={styles.card}>
              <MenuRow
                icon="🚪"
                label={loading ? 'Signing out…' : 'Logout'}
                onPress={logout}
                danger
                noBorder
              />
            </View>
          </View>
        ) : null}

        <Text style={styles.footer}>v1.0.0 · GoCart</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },

  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  section: {
    gap: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  pressed: {
    opacity: 0.76,
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },

  heroBackgroundShape: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primarySoft,
  },

  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },

  heroInfo: {
    flex: 1,
  },

  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },

  heroEmail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  statusPillMuted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  statusDotMuted: {
    backgroundColor: colors.muted,
  },

  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  statusPillTextMuted: {
    color: colors.muted,
  },

  unreadPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },

  unreadPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },

  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },

  statLabel: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  quickActionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },

  iconTileWrap: {
    position: 'relative',
  },

  iconTileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconTileEmoji: {
    fontSize: 20,
  },

  countBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },

  countBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '800',
  },

  iconTileLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
  },

  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },

  inboxLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  inboxIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inboxIcon: {
    fontSize: 18,
  },

  inboxTextWrap: {
    flex: 1,
    gap: 2,
  },

  inboxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  inboxSubtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },

  inboxCountWrap: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inboxCountText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },

  supportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  supportButton: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
  },

  supportButtonPrimary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  supportButtonDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  supportButtonIcon: {
    fontSize: 18,
  },

  supportButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },

  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuIconWrapDanger: {
    backgroundColor: `${colors.danger}14`,
  },

  menuIcon: {
    fontSize: 15,
  },

  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  dangerText: {
    color: colors.danger,
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
});