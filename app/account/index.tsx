import React from 'react';
import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  actionText?: string;
};

function SettingsRow({
  label,
  icon,
  href,
  subtitle,
  danger,
  onPress,
  actionText = 'Open',
}: SettingsRowProps) {
  const content = (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: `${colors.text}10` }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[styles.label, danger && styles.dangerText]}
            numberOfLines={1}
          >
            {label}
          </Text>

          {!!subtitle && (
            <Text
              style={[styles.subtitle, danger && styles.dangerSubtitle]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={[styles.actionText, danger && styles.dangerText]}>
          {actionText}
        </Text>
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

function SectionTitle({
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
          headerBackTitleVisible: false,
        }}
      />

      <Screen scroll contentContainerStyle={styles.page}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>⚙️</Text>
            </View>

            <View style={styles.heroTextWrap}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitleText}>
                Manage your account, privacy, support, and security options in
                one place.
              </Text>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {user?.is_email_verified ? 'Email Verified' : 'Email Not Verified'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Account"
            subtitle="Personal information and saved details"
          />
          <View style={styles.card}>
            <SettingsRow
              icon="👤"
              label="Profile Information"
              subtitle="View and manage your personal profile details"
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
              subtitle="Control alerts, updates, and account messages"
              href="/notifications"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Security"
            subtitle="Protect your account and sign-in options"
          />
          <View style={styles.card}>
            {!user?.is_email_verified && (
              <SettingsRow
                icon="📧"
                label="Verify Email"
                subtitle="Confirm your email address for better security"
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
          <SectionTitle
            title="Support"
            subtitle="Help resources, legal information, and assistance"
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
              subtitle="Read our terms of service and privacy policy"
              href="/legal"
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Session"
            subtitle="Manage your current signed-in session"
          />
          <View style={styles.card}>
            <SettingsRow
              icon="🚪"
              label={loading ? 'Signing out…' : 'Logout'}
              subtitle="Securely sign out from this device"
              onPress={logout}
              danger
              actionText="Exit"
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },

  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  heroBadgeText: {
    fontSize: 22,
  },

  heroTextWrap: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },

  subtitleText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },

  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  statusPill: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  section: {
    gap: 10,
  },

  sectionHeader: {
    paddingHorizontal: 4,
    gap: 4,
  },

  sectionTitle: {
    fontSize: 13,
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
    padding: 6,
    gap: 8,
  },

  row: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },

  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },

  pressed: {
    opacity: 0.82,
  },

  dangerText: {
    color: colors.danger,
  },

  dangerSubtitle: {
    color: colors.danger,
    opacity: 0.85,
  },
});