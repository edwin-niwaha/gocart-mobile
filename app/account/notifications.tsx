import { useEffect, useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { newsletterApi, getErrorMessage } from '@/api/services';
import { showError, showInfo, showSuccess } from '@/utils/toast';

const NEWSLETTER_INFO_URL = 'https://gocart.com/newsletter';
const NEWSLETTER_MANAGE_URL = 'https://gocart.com/newsletter/manage';

export default function AccountNotificationsScreen() {
  const { user, ready, isAuthenticated } = useAuth();

  const [emailUpdates, setEmailUpdates] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [ready, isAuthenticated]);

  const userEmail = useMemo(() => user?.email?.trim() || '', [user?.email]);

  const openExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        showError('Unable to open that link right now.');
        return;
      }

      await Linking.openURL(url);
    } catch {
      showError('Unable to open that link right now.');
    }
  };

  const handleSubscribe = async () => {
    if (!userEmail) {
      showError('No email address found on your account.');
      return;
    }

    try {
      setSaving(true);

      const response = await newsletterApi.subscribe(userEmail);

      setEmailUpdates(true);
      showSuccess(response?.detail || 'You are now subscribed to updates.');
    } catch (error: any) {
      setEmailUpdates(false);
      showError(getErrorMessage(error, 'Unable to subscribe right now.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!userEmail) {
      showError('No email address found on your account.');
      return;
    }

    try {
      setSaving(true);

      const response = await newsletterApi.unsubscribe(userEmail);

      setEmailUpdates(false);
      showInfo(
        response?.detail || 'You have unsubscribed from email updates.'
      );
    } catch (error: any) {
      showError(getErrorMessage(error, 'Unable to unsubscribe right now.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmailUpdates = async (value: boolean) => {
    if (value) {
      await handleSubscribe();
      return;
    }

    await handleUnsubscribe();
  };

  if (!ready) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Email Updates',
        }}
      />

      <Screen scroll contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Manage how you receive product news, offers, and important GoCart
            updates.
          </Text>

          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View style={styles.optionText}>
                <Text style={styles.label}>Newsletter subscription</Text>
                <Text style={styles.helper}>
                  Updates will be sent to{' '}
                  <Text style={styles.emailText}>
                    {userEmail || 'No email found'}
                  </Text>
                </Text>
              </View>

              <Switch
                value={emailUpdates}
                onValueChange={handleToggleEmailUpdates}
                disabled={saving}
                trackColor={{ false: '#cbd5e1', true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <Text style={styles.note}>
              Subscribe to hear about offers, new arrivals, store updates, and
              helpful announcements.
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  emailUpdates
                    ? styles.statusBadgeActive
                    : styles.statusBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    emailUpdates
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {emailUpdates ? 'Subscribed' : 'Not subscribed'}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={handleSubscribe}
                disabled={saving || !userEmail || emailUpdates}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                  (saving || !userEmail || emailUpdates) && styles.disabled,
                ]}
              >
                {saving && !emailUpdates ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {emailUpdates ? 'Subscribed' : 'Subscribe now'}
                  </Text>
                )}
              </Pressable>

              {emailUpdates ? (
                <Pressable
                  onPress={handleUnsubscribe}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                    saving && styles.disabled,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Unsubscribe</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => openExternalLink(NEWSLETTER_MANAGE_URL)}
                disabled={saving}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                  saving && styles.disabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  Manage subscription
                </Text>
              </Pressable>

              <Pressable
                onPress={() => openExternalLink(NEWSLETTER_INFO_URL)}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.linkButtonText}>
                  Learn more about email updates
                </Text>
              </Pressable>
            </View>

            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.savingText}>Saving preference...</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },

  optionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },

  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },

  optionText: {
    flex: 1,
    gap: 4,
  },

  label: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  helper: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },

  emailText: {
    color: colors.text,
    fontWeight: '700',
  },

  note: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },

  statusRow: {
    paddingTop: 4,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  statusBadgeActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  statusBadgeInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  statusTextActive: {
    color: colors.primary,
  },

  statusTextInactive: {
    color: colors.muted,
  },

  actions: {
    gap: 10,
    paddingTop: 8,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.surface,
  },

  secondaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  linkButton: {
    alignSelf: 'flex-start',
    paddingTop: 4,
  },

  linkButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },

  savingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },

  pressed: {
    opacity: 0.85,
  },

  disabled: {
    opacity: 0.6,
  },
});
