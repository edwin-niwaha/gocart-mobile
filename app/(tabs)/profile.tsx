import React, { useEffect, useMemo } from 'react';
import { Link } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/providers/AuthProvider';
import { useShop } from '@/providers/ShopProvider';
import { fullName } from '@/utils/format';
import { colors, spacing } from '@/constants/theme';

type MenuRowProps = {
  label: string;
  icon: string;
  href?: any;
  onPress?: () => void;
  danger?: boolean;
  noBorder?: boolean;
};

type AccountItem = {
  href: string;
  icon: string;
  label: string;
  count?: number;
};

function MenuRow({ label, icon, href, onPress, danger, noBorder }: MenuRowProps) {
  const content = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !noBorder && styles.menuRowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.menuIconWrap, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>

      <Text
        style={[styles.menuLabel, danger && styles.dangerText]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </Pressable>
  );

  return href ? <Link href={href} asChild>{content}</Link> : content;
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

function AccountGrid({ items }: { items: AccountItem[] }) {
  return (
    <View style={styles.iconGrid}>
      {items.map(({ href, icon, label, count }) => (
        <Link key={href} href={href} asChild>
          <Pressable style={({ pressed }) => [styles.iconItem, pressed && styles.pressed]}>
            <View style={styles.iconCircleWrap}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>{icon}</Text>
              </View>

              {typeof count === 'number' && count > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>{count > 99 ? '99+' : count}</Text>
                </View>
              )}
            </View>

            <Text style={styles.iconLabel} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { orders, reviews, wishlistItems, notifications, addresses, loadAuthedData } = useShop();

  useEffect(() => {
    if (isAuthenticated) {
      loadAuthedData().catch(() => undefined);
    }
  }, [isAuthenticated, loadAuthedData]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const unreadNotifications = useMemo(
    () => safeNotifications.filter((item) => !item.is_read),
    [safeNotifications]
  );

  const unreadCount = unreadNotifications.length;

  const initials =
    user?.first_name?.[0]?.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    'G';

  const stats = useMemo(
    () => ({
      orders: orders.length,
      reviews: reviews.length,
      saved: wishlistItems.length,
    }),
    [orders, reviews, wishlistItems]
  );

  const accountItems = useMemo<AccountItem[]>(
    () => [
      { href: '/orders', icon: '📦', label: 'Orders', count: orders.length },
      { href: '/notifications', icon: '📬', label: 'Inbox', count: unreadCount },
      { href: '#', icon: '⭐', label: 'Ratings', count: reviews.length },
      { href: '/addresses', icon: '📍', label: 'Address', count: addresses.length },
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
      
      <View style={styles.hero}>
        <View style={styles.heroBg} />

        <View style={styles.heroInner}>
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
            <Text style={styles.heroName}>
              {isAuthenticated
                ? fullName(user?.first_name, user?.last_name, user?.username)
                : 'Guest'}
            </Text>

            <Text style={styles.heroEmail}>{user?.email || 'Not signed in'}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroBadge}>
                <View style={[styles.dot, !isAuthenticated && styles.dotMuted]} />
                <Text style={[styles.heroBadgeText, !isAuthenticated && styles.mutedText]}>
                  {isAuthenticated ? 'Standard Member' : 'Guest'}
                </Text>
              </View>

              {isAuthenticated && unreadCount > 0 ? (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>
                    {unreadCount} unread
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {isAuthenticated && (
          <View style={styles.statsRow}>
            <StatPill value={stats.orders} label="Orders" />
            <View style={styles.statDivider} />
            <StatPill value={stats.reviews} label="Reviews" />
            <View style={styles.statDivider} />
            <StatPill value={stats.saved} label="Saved" />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.section}>
          <SectionHeader title="Account" />
          <AuthGate message="Log in to manage your orders, inbox, addresses, and account settings.">
            <AccountGrid items={accountItems} />
          </AuthGate>
        </View>

        {isAuthenticated && unreadCount > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Inbox" />
            <Link href="/notifications" asChild>
              <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={styles.inboxPreviewRow}>
                  <View style={styles.inboxPreviewLeft}>
                    <View style={styles.inboxPreviewIconWrap}>
                      <Text style={styles.inboxPreviewIcon}>📬</Text>
                    </View>

                    <View style={styles.inboxPreviewTextWrap}>
                      <Text style={styles.inboxPreviewTitle}>Unread notifications</Text>
                      <Text style={styles.inboxPreviewSubtitle} numberOfLines={2}>
                        You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inboxPreviewBadge}>
                    <Text style={styles.inboxPreviewBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Support" />
          <View style={styles.supportGrid}>
            <Pressable
              onPress={openWhatsApp}
              style={({ pressed }) => [styles.supportBtn, styles.whatsappBtn, pressed && styles.pressed]}
            >
              <Text style={styles.supportBtnIcon}>💬</Text>
              <Text style={styles.supportBtnLabel}>WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={openSupportEmail}
              style={({ pressed }) => [styles.supportBtn, styles.emailBtn, pressed && styles.pressed]}
            >
              <Text style={styles.supportBtnIcon}>✉️</Text>
              <Text style={styles.supportBtnLabel}>Email Support</Text>
            </Pressable>
          </View>
        </View>

        {isAuthenticated && (
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
        )}

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

  pressed: {
    opacity: 0.7,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  hero: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },

  heroBg: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primarySoft,
  },

  heroInner: {
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

  heroBadge: {
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

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  dotMuted: {
    backgroundColor: colors.muted,
  },

  heroBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  mutedText: {
    color: colors.muted,
  },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  statPill: {
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

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
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

  menuIconDanger: {
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

  iconGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },

  iconCircleWrap: {
    position: 'relative',
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconEmoji: {
    fontSize: 20,
  },

  iconBadge: {
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

  iconBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '800',
  },

  iconLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
  },

  inboxPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },

  inboxPreviewLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  inboxPreviewIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inboxPreviewIcon: {
    fontSize: 18,
  },

  inboxPreviewTextWrap: {
    flex: 1,
    gap: 2,
  },

  inboxPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },

  inboxPreviewSubtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },

  inboxPreviewBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inboxPreviewBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },

  supportGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  supportBtn: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
  },

  whatsappBtn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  emailBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  supportBtnIcon: {
    fontSize: 18,
  },

  supportBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

});