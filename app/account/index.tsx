import React from 'react';
import { Link, Stack } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/constants/theme';

type SettingsRowProps = {
  label: string;
  icon: string;
  href?: string;
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
  const isLinkRow = Boolean(href);

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
          <Text style={styles.icon}>{icon}</Text>
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
          <ActivityIndicator size="small" color={danger ? colors.danger : colors.primary} />
        ) : isLinkRow ? (
          <Text style={styles.chevron}>›</Text>
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

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, logout, loading } = useAuth();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
        }}
      />

      <Screen scroll contentContainerStyle={styles.page}>
        <View style={styles.section}>
          <SectionHeader
            title="Account"
            subtitle="Personal details and saved information"
          />

          <View style={styles.card}>
            <SettingsRow
              icon="👤"
              label="Profile"
              subtitle="View and update your personal details"
              href="/account/profile"
            />
            <SettingsRow
              icon="📍"
              label="Addresses"
              subtitle="Manage your saved delivery addresses"
              href="/addresses"
            />
            <SettingsRow
              icon="📬"
              label="Notifications"
              subtitle="Manage email updates, offers, and alerts"
              href="/account/notifications"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Security"
            subtitle="Sign-in, password, and email verification"
          />

          <View style={styles.card}>
            {!user?.is_email_verified && (
              <SettingsRow
                icon="📧"
                label="Verify Email"
                subtitle="Confirm your email address for added account security"
                href="/auth/verify-email"
              />
            )}

            <SettingsRow
              icon="🔒"
              label="Change Password"
              subtitle="Update your current password"
              href="/auth/change-password"
            />

            <SettingsRow
              icon="🔑"
              label="Forgot Password"
              subtitle="Reset your password using your email"
              href="/auth/forgot-password"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Support"
            subtitle="Get help and review important information"
          />

          <View style={styles.card}>
            <SettingsRow
              icon="❓"
              label="Help & Support"
              subtitle="Get help with orders, payments, and account issues"
              href="/support"
            />
            <SettingsRow
              icon="📄"
              label="Terms & Privacy"
              subtitle="Review our terms of service and privacy policy"
              href="/legal"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Session"
            subtitle="Manage your current signed-in session"
          />

          <View style={styles.card}>
            <SettingsRow
              icon="🚪"
              label={loading ? 'Signing out...' : 'Logout'}
              subtitle="Securely sign out from this device"
              onPress={logout}
              danger
              loading={loading}
            />
          </View>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.md,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },

  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },

  section: {
    gap: 10,
  },

  sectionHeader: {
    paddingHorizontal: 4,
    gap: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    gap: 8,
  },

  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  iconWrapNeutral: {
    backgroundColor: colors.surface,
  },

  iconWrapDanger: {
    backgroundColor: `${colors.danger}14`,
  },

  icon: {
    fontSize: 18,
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  rowSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },

  chevron: {
    fontSize: 22,
    color: colors.muted,
    fontWeight: '600',
    lineHeight: 22,
  },

  actionText: {
    fontSize: 12,
    fontWeight: '700',
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
