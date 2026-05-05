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
            icon="mail-outline"
            label="Notifications"
            subtitle="Manage email updates, offers, and alerts"
            href="/account/notifications"
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
