import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

type IconName = keyof typeof Ionicons.glyphMap;

type SettingsRowProps = {
  label: string;
  icon: IconName;
  href?: Href;
  subtitle?: string;
  danger?: boolean;
  onPress?: () => void;
  loading?: boolean;
};

function SettingsRow({
  label,
  icon,
  href,
  subtitle,
  danger,
  onPress,
  loading,
}: SettingsRowProps) {
  const content = (
    <Pressable
      onPress={onPress}
      disabled={loading}
      android_ripple={{ color: `${colors.text}10` }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconWrap,
            danger ? styles.iconWrapDanger : styles.iconWrapNeutral,
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={danger ? colors.danger : colors.primary}
          />
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[styles.rowLabel, danger && styles.dangerText]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {!!subtitle && (
            <Text
              style={[styles.rowSubtitle, danger && styles.dangerSubtitle]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rowRight}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={danger ? colors.danger : colors.primary}
          />
        ) : href ? (
          <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
        ) : danger ? (
          <Text style={[styles.actionText, styles.dangerText]}>Exit</Text>
        ) : null}
      </View>
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, logout, loading } = useAuth();
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'GoCart shopper';

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />

      <Screen scroll contentContainerStyle={styles.page}>
        <PageHeader
          icon="settings"
          title="Account Settings"
          subtitle="Profile, security, support, and preferences"
          tone="dark"
        />

        <View style={styles.summaryCard}>
          <View style={styles.summaryAvatar}>
            <Text style={styles.summaryAvatarText}>
              {(displayName || user?.email || 'G').charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.summaryBody}>
            <Text style={styles.summaryName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.summaryEmail} numberOfLines={1}>
              {user?.email || 'No email address'}
            </Text>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusPill,
                  user?.is_email_verified
                    ? styles.statusPillSuccess
                    : styles.statusPillWarning,
                ]}
              >
                <Ionicons
                  name={user?.is_email_verified ? 'checkmark-circle' : 'alert-circle'}
                  size={13}
                  color={user?.is_email_verified ? colors.success : colors.warning}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    user?.is_email_verified
                      ? styles.statusPillTextSuccess
                      : styles.statusPillTextWarning,
                  ]}
                >
                  {user?.is_email_verified ? 'Verified' : 'Verify email'}
                </Text>
              </View>

              <View style={styles.statusPill}>
                <Ionicons name="person-circle" size={13} color={colors.primary} />
                <Text style={styles.statusPillText}>{user?.user_type || 'USER'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Section title="Account" subtitle="Personal details and saved information">
          <SettingsRow
            icon="person-outline"
            label="Profile"
            subtitle="View and update your personal details"
            href="/account/profile"
          />
          <SettingsRow
            icon="location-outline"
            label="Addresses"
            subtitle="Manage your saved delivery addresses"
            href="/addresses"
          />
          <SettingsRow
            icon="receipt-outline"
            label="Orders"
            subtitle="Track purchases and manage product reviews"
            href="/orders"
          />
          <SettingsRow
            icon="heart-outline"
            label="Wishlist"
            subtitle="Return to products you saved for later"
            href="/wishlist"
          />
          <SettingsRow
            icon="mail-outline"
            label="Notifications"
            subtitle="Manage email updates, offers, and alerts"
            href="/account/notifications"
          />
          <SettingsRow
            icon="card-outline"
            label="Payments"
            subtitle="View payment status, references, and totals"
            href="/account/payments"
          />
          <SettingsRow
            icon="cube-outline"
            label="Shipments"
            subtitle="Follow delivery status and tracking details"
            href="/account/shipments"
          />
        </Section>

        <Section title="Security" subtitle="Sign-in, password, and verification">
          {!user?.is_email_verified && (
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Verify Email"
              subtitle="Confirm your email address for added account security"
              href="/auth/verify-email"
            />
          )}
          <SettingsRow
            icon="lock-closed-outline"
            label="Change Password"
            subtitle="Update your current password"
            href="/auth/change-password"
          />
          <SettingsRow
            icon="key-outline"
            label="Forgot Password"
            subtitle="Reset your password using your email"
            href="/auth/forgot-password"
          />
        </Section>

        <Section title="Support" subtitle="Help and important information">
          <SettingsRow
            icon="help-circle-outline"
            label="Help & Support"
            subtitle="Get help with orders, payments, and account issues"
            href="/support"
          />
          <SettingsRow
            icon="document-text-outline"
            label="Terms & Privacy"
            subtitle="Review our terms of service and privacy policy"
            href="/legal"
          />
        </Section>

        <Section title="Session" subtitle="Manage this signed-in device">
          <SettingsRow
            icon="log-out-outline"
            label={loading ? 'Signing out...' : 'Logout'}
            subtitle="Securely sign out from this device"
            onPress={logout}
            danger
            loading={loading}
          />
        </Section>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  summaryAvatar: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.surface,
    flexShrink: 0,
  },
  summaryAvatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
  },
  summaryBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  summaryEmail: {
    fontSize: 13,
    color: colors.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  statusPillSuccess: {
    backgroundColor: colors.successSoft,
  },
  statusPillWarning: {
    backgroundColor: colors.warningSoft,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  statusPillTextSuccess: {
    color: colors.success,
  },
  statusPillTextWarning: {
    color: colors.warning,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
    ...shadows.soft,
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  rowRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapNeutral: {
    backgroundColor: colors.surface,
  },
  iconWrapDanger: {
    backgroundColor: colors.dangerSoft,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.65,
  },
  dangerText: {
    color: colors.danger,
  },
  dangerSubtitle: {
    color: colors.danger,
    opacity: 0.88,
  },
});
