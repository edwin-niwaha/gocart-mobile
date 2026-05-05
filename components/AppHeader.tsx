import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type HeaderTitleProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  tone?: 'primary' | 'dark' | 'accent';
  inverted?: boolean;
};

type HeaderIconButtonProps = {
  icon: IconName;
  onPress: () => void;
  badgeCount?: number;
  accessibilityLabel: string;
};

type PageHeaderProps = HeaderTitleProps & {
  action?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeaderTitle({
  icon,
  title,
  subtitle,
  tone = 'primary',
  inverted = false,
}: HeaderTitleProps) {
  return (
    <View style={styles.titleWrap}>
      <View style={[styles.titleIcon, styles[`${tone}Icon`]]}>
        <Ionicons name={icon} size={18} color={colors.surface} />
      </View>

      <View style={styles.titleTextWrap}>
        <Text
          style={[styles.titleText, inverted && styles.titleTextInverted]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[styles.subtitleText, inverted && styles.subtitleTextInverted]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

export function HeaderIconButton({
  icon,
  onPress,
  badgeCount = 0,
  accessibilityLabel,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={21} color={colors.ink} />
      {badgeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
  tone = 'dark',
  action,
  children,
  style,
}: PageHeaderProps) {
  return (
    <View style={[styles.pageHeader, style]}>
      <View style={styles.pageTopRow}>
        <HeaderTitle
          icon={icon}
          title={title}
          subtitle={subtitle}
          tone={tone}
          inverted
        />
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  primaryIcon: {
    backgroundColor: colors.primary,
  },
  darkIcon: {
    backgroundColor: colors.ink,
  },
  accentIcon: {
    backgroundColor: colors.accent,
  },
  titleTextWrap: {
    minWidth: 0,
    maxWidth: 230,
  },
  titleText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  titleTextInverted: {
    color: colors.surface,
  },
  subtitleText: {
    marginTop: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  subtitleTextInverted: {
    color: '#D6E4DF',
  },
  iconButton: {
    width: 42,
    height: 42,
    marginRight: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.soft,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '900',
  },
  pageHeader: {
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  pageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.76,
  },
});
