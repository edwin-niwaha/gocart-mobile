import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterScreen() {
  const { register, loading, isAuthenticated, user } = useAuth();

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const routeAuthenticatedUser = (signedInUser: NonNullable<typeof user>) => {
    if (signedInUser.user_type === 'ADMIN') {
      router.replace('/');
      return;
    }

    if (!signedInUser.is_email_verified) {
      router.replace('/auth/verify-email');
      return;
    }

    router.replace('/(tabs)');
  };

  const { googleLoading, startGoogleAuth } = useGoogleAuth({
    onErrorTitle: 'Google sign up failed',
    onSuccess: async (signedInUser) => {
      routeAuthenticatedUser(signedInUser);
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    routeAuthenticatedUser(user);
  }, [isAuthenticated, user]);

  const onSubmit = async () => {
    try {
      if (
        !form.email.trim() ||
        !form.username.trim() ||
        !form.password.trim() ||
        !form.password_confirm.trim()
      ) {
        Alert.alert('Missing fields', 'Please fill in all fields.');
        return;
      }

      if (form.password !== form.password_confirm) {
        Alert.alert('Password mismatch', 'Passwords do not match.');
        return;
      }

      await register({
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
      });

      Alert.alert(
        'Account created',
        'Your account has been created. Please verify your email with the code we sent.'
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        JSON.stringify(error?.response?.data || 'Please fix the form and try again.');

      Alert.alert('Registration failed', message);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <Screen scroll contentContainerStyle={styles.page}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.brand}>GoCart</Text>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>
                  Fill in your details to get started.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSubtitle}>
                  Create your account to start shopping on GoCart
                </Text>

                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Email address</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="mail" size={18} color={colors.muted} />
                      <TextInput
                        style={styles.input}
                        value={form.email}
                        onChangeText={(email) => setForm((prev) => ({ ...prev, email }))}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        placeholder="Enter your email"
                        placeholderTextColor={colors.muted}
                        keyboardType="email-address"
                        editable={!isBusy}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Username</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="user" size={18} color={colors.muted} />
                      <TextInput
                        style={styles.input}
                        value={form.username}
                        onChangeText={(username) =>
                          setForm((prev) => ({ ...prev, username }))
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Choose a username"
                        placeholderTextColor={colors.muted}
                        editable={!isBusy}
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="lock" size={18} color={colors.muted} />
                      <TextInput
                        style={styles.input}
                        value={form.password}
                        onChangeText={(password) =>
                          setForm((prev) => ({ ...prev, password }))
                        }
                        placeholder="Create a password"
                        placeholderTextColor={colors.muted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password-new"
                        editable={!isBusy}
                        returnKeyType="next"
                      />
                      <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                        <Feather
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Confirm password</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="shield" size={18} color={colors.muted} />
                      <TextInput
                        style={styles.input}
                        value={form.password_confirm}
                        onChangeText={(password_confirm) =>
                          setForm((prev) => ({ ...prev, password_confirm }))
                        }
                        placeholder="Confirm your password"
                        placeholderTextColor={colors.muted}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isBusy}
                        returnKeyType="done"
                        onSubmitEditing={onSubmit}
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        <Feather
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isBusy && styles.buttonDisabled,
                    ]}
                    onPress={onSubmit}
                    disabled={isBusy}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Creating...' : 'Create account'}
                    </Text>
                  </Pressable>

                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.divider} />
                  </View>

                  <Pressable
                    onPress={startGoogleAuth}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.googleButton,
                      pressed && styles.buttonPressed,
                      isBusy && styles.buttonDisabled,
                    ]}
                  >
                    <AntDesign name="google" size={18} color={colors.text} />
                    <Text style={styles.googleButtonText}>
                      {googleLoading ? 'Connecting...' : 'Continue with Google'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => router.push('/auth/login')}>
                    <Text style={styles.link}>Already have an account? Login</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 2,
  },
  inputWrapper: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 15,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.muted,
  },
  googleButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
    marginTop: 10,
    fontSize: 14,
  },
  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },
});