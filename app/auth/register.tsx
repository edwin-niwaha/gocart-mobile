import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Link, Stack, router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAuth } from '@/providers/AuthProvider';

type RegisterForm = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
};

type AuthInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoComplete?:
    | 'email'
    | 'username'
    | 'password'
    | 'password-new'
    | 'off';
  returnKeyType?: 'next' | 'done';
  secureTextEntry?: boolean;
  onSubmitEditing?: () => void;
  trailing?: React.ReactNode;
};

function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  editable = true,
  keyboardType = 'default',
  autoComplete = 'off',
  returnKeyType = 'done',
  secureTextEntry = false,
  onSubmitEditing,
  trailing,
}: AuthInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Feather name={icon} size={18} color={colors.muted} />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          onSubmitEditing={onSubmitEditing}
        />

        {trailing}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const { register, loading, isAuthenticated, user } = useAuth();

  const [form, setForm] = useState<RegisterForm>({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const routeAuthenticatedUser = useCallback((signedInUser: NonNullable<typeof user>) => {
    if (signedInUser.user_type === 'ADMIN') {
      router.replace('/');
      return;
    }

    if (!signedInUser.is_email_verified) {
      router.replace('/auth/verify-email');
      return;
    }

    router.replace('/(tabs)');
  }, []);

  const { googleLoading, startGoogleAuth } = useGoogleAuth({
    onErrorTitle: 'Google sign up failed',
    onSuccess: async (signedInUser) => {
      routeAuthenticatedUser(signedInUser);
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    routeAuthenticatedUser(user);
  }, [isAuthenticated, routeAuthenticatedUser, user]);

  const updateField = <K extends keyof RegisterForm>(
    key: K,
    value: RegisterForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const normalizedUsername = form.username.trim();

      if (
        !normalizedEmail ||
        !normalizedUsername ||
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
        email: normalizedEmail,
        username: normalizedUsername,
        password: form.password,
        password_confirm: form.password_confirm,
      });

      Alert.alert(
        'Account created',
        'Your account has been created. Please verify your email with the code we sent.'
      );
    } catch (error: any) {
      const data = error?.response?.data;
      const message =
        data?.detail ||
        data?.email?.[0] ||
        data?.username?.[0] ||
        data?.password?.[0] ||
        data?.password_confirm?.[0] ||
        'Please fix the form and try again.';

      Alert.alert('Registration failed', message);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Register',
        }}
      />

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
                  <Text style={styles.title}>Create account</Text>
                  <Text style={styles.subtitle}>
                    Sign up to start shopping and manage your GoCart account.
                  </Text>
                </View>

                <View style={styles.card}>
                  <View style={styles.form}>
                    <AuthInput
                      label="Email address"
                      value={form.email}
                      onChangeText={(value) => updateField('email', value)}
                      placeholder="Enter your email"
                      icon="mail"
                      keyboardType="email-address"
                      autoComplete="email"
                      returnKeyType="next"
                      editable={!isBusy}
                    />

                    <AuthInput
                      label="Username"
                      value={form.username}
                      onChangeText={(value) => updateField('username', value)}
                      placeholder="Choose a username"
                      icon="user"
                      autoComplete="username"
                      returnKeyType="next"
                      editable={!isBusy}
                    />

                    <AuthInput
                      label="Password"
                      value={form.password}
                      onChangeText={(value) => updateField('password', value)}
                      placeholder="Create a password"
                      icon="lock"
                      autoComplete="password-new"
                      returnKeyType="next"
                      secureTextEntry={!showPassword}
                      editable={!isBusy}
                      trailing={
                        <Pressable
                          onPress={() => setShowPassword((prev) => !prev)}
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Feather
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={18}
                            color={colors.muted}
                          />
                        </Pressable>
                      }
                    />

                    <AuthInput
                      label="Confirm password"
                      value={form.password_confirm}
                      onChangeText={(value) =>
                        updateField('password_confirm', value)
                      }
                      placeholder="Confirm your password"
                      icon="shield"
                      returnKeyType="done"
                      secureTextEntry={!showConfirmPassword}
                      editable={!isBusy}
                      onSubmitEditing={onSubmit}
                      trailing={
                        <Pressable
                          onPress={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          hitSlop={10}
                          style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Feather
                            name={showConfirmPassword ? 'eye-off' : 'eye'}
                            size={18}
                            color={colors.muted}
                          />
                        </Pressable>
                      }
                    />

                    <Pressable
                      onPress={onSubmit}
                      disabled={isBusy}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && !isBusy && styles.buttonPressed,
                        isBusy && styles.buttonDisabled,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          Create account
                        </Text>
                      )}
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
                        styles.secondaryButton,
                        pressed && !isBusy && styles.buttonPressed,
                        isBusy && styles.buttonDisabled,
                      ]}
                    >
                      {googleLoading ? (
                        <ActivityIndicator color={colors.text} />
                      ) : (
                        <>
                          <AntDesign name="google" size={18} color={colors.text} />
                          <Text style={styles.secondaryButtonText}>
                            Continue with Google
                          </Text>
                        </>
                      )}
                    </Pressable>

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>
                        Already have an account?
                      </Text>
                      <Link href="/auth/login" style={styles.link}>
                        Login
                      </Link>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },

  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: spacing.lg,
  },

  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 320,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  form: {
    gap: spacing.md,
  },

  field: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  inputWrapper: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },

  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  secondaryButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
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

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },

  footerText: {
    color: colors.muted,
    fontSize: 14,
  },

  link: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },

  buttonPressed: {
    opacity: 0.92,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  pressed: {
    opacity: 0.75,
  },
});
