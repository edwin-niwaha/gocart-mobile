import React, { useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '@/components/AuthGate';
import { Screen } from '@/components/Screen';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useShop } from '@/providers/ShopProvider';
import { fullName } from '@/utils/format';

type IconName = keyof typeof Ionicons.glyphMap;

type QuickActionItem = {
  href: Href;
  icon: IconName;
  label: string;
  count?: number;
};

type SupportActionProps = {
  icon: IconName;
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

function QuickActionTile({ href, icon, label, count }: QuickActionItem) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}>
        <View style={styles.quickIconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
          {typeof count === 'number' ? <CountBadge count={count} /> : null}
        </View>
        <Text style={styles.quickLabel} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function StatusPill({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <View style={[styles.statusPill, muted && styles.statusPillMuted]}>
      <View style={[styles.statusDot, muted && styles.statusDotMuted]} />
      <Text style={[styles.statusPillText, muted && styles.statusPillTextMuted]}>
        {label}
      </Text>
    </View>
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
      <Ionicons
        name={icon}
        size={20}
        color={isPrimary ? colors.surface : colors.primaryDark}
      />
      <Text
        style={[
          styles.supportButtonLabel,
          isPrimary && styles.supportButtonLabelPrimary,
        ]}
      >
        {label}
      </Text>
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
              <Ionicons
                name="mail-unread-outline"
                size={20}
                color={colors.primary}
              />
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

  const safeNotifications = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications]
  );
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
      { href: '/orders', icon: 'cube-outline', label: 'Orders', count: orders.length },
      {
        href: '/notifications',
        icon: 'mail-unread-outline',
        label: 'Inbox',
        count: unreadCount,
      },
      { href: '/orders', icon: 'star-outline', label: 'Ratings', count: reviews.length },
      {
        href: '/addresses',
        icon: 'location-outline',
        label: 'Addresses',
        count: addresses.length,
      },
      { href: '/account', icon: 'settings-outline', label: 'Settings' },
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
    <Screen scroll style={styles.screen} contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.profileTopRow}>
          <View style={styles.profileRow}>
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

            <View style={styles.profileIdentity}>
              <Text style={styles.heroEyebrow}>My Profile</Text>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {user?.email || 'Guest checkout is available'}
              </Text>
            </View>
          </View>

          <View style={styles.profileMeta}>
            <StatusPill
              label={isAuthenticated ? 'Active Member' : 'Guest'}
              muted={!isAuthenticated}
            />
            {isAuthenticated && unreadCount > 0 ? (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
              </View>
            ) : null}
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

      <View style={styles.section}>
        <SectionHeader title="Account" />
        <AuthGate message="Log in to manage your orders, inbox, addresses, and account settings.">
          <View style={styles.quickActionsCard}>
            {quickActions.map((item) => (
              <QuickActionTile key={`${item.label}-${String(item.href)}`} {...item} />
            ))}
          </View>
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
            icon="logo-whatsapp"
            label="WhatsApp"
            onPress={openWhatsApp}
            variant="primary"
          />
          <SupportAction
            icon="mail-outline"
            label="Email Support"
            onPress={openSupportEmail}
          />
        </View>
      </View>

      {isAuthenticated ? (
        <View style={styles.section}>
          <SectionHeader title="Session" />
          <Pressable
            onPress={logout}
            disabled={loading}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutText}>
              {loading ? 'Signing out...' : 'Logout'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.footer}>v1.0.0 - GoCart</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F3F6F8',
  },
  page: {
    gap: spacing.md,
    backgroundColor: '#F3F6F8',
  },
  section: {
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.65,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
    flex: 1,
  },
  hero: {
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: '#173B35',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#27554D',
    ...shadows.card,
  },
  profileTopRow: {
    gap: spacing.md,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.56)',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 23,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  profileIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#A7F3D0',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.surface,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  profileMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillMuted: {
    backgroundColor: 'rgba(248,250,252,0.12)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusDotMuted: {
    backgroundColor: '#CBD5E1',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statusPillTextMuted: {
    color: '#E2E8F0',
  },
  unreadPill: {
    backgroundColor: 'rgba(247,148,32,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FDBA74',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.surface,
  },
  statLabel: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
    textTransform: 'uppercase',
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
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  quickIconWrap: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: radii.md,
    backgroundColor: '#EAF6F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  countBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '900',
  },
  quickLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#334155',
    fontWeight: '900',
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
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxTextWrap: {
    flex: 1,
    gap: 2,
  },
  inboxTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
  },
  inboxSubtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  inboxCountWrap: {
    minWidth: 30,
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxCountText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  supportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  supportButton: {
    flex: 1,
    height: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    ...shadows.soft,
  },
  supportButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  supportButtonDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  supportButtonLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text,
  },
  supportButtonLabelPrimary: {
    color: colors.surface,
  },
  logoutButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
