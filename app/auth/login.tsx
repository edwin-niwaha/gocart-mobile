import React, { useEffect, useState } from 'react';
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
import { Link, router, Stack } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAuth } from '@/providers/AuthProvider';

type AuthInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'email' | 'password';
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
  autoComplete,
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
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          style={styles.input}
        />

        {trailing}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const { login, loading, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    onErrorTitle: 'Google login failed',
    onSuccess: async (signedInUser) => {
      routeAuthenticatedUser(signedInUser);
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    routeAuthenticatedUser(user);
  }, [isAuthenticated, user]);

  const handleLogin = async () => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password.trim()) {
        Alert.alert('Missing details', 'Enter your email and password.');
        return;
      }

      await login({
        email: normalizedEmail,
        password,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      Alert.alert('Login failed', message);
    }
  };

  const isBusy = loading || googleLoading;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Login',
          headerBackTitleVisible: false,
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
                  <Text style={styles.title}>Welcome back</Text>
                  <Text style={styles.subtitle}>
                    Sign in to continue shopping and manage your account.
                  </Text>
                </View>

                <View style={styles.card}>
                  <View style={styles.form}>
                    <AuthInput
                      label="Email address"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      icon="mail"
                      keyboardType="email-address"
                      autoComplete="email"
                      returnKeyType="next"
                      editable={!isBusy}
                    />

                    <AuthInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      icon="lock"
                      autoComplete="password"
                      returnKeyType="done"
                      secureTextEntry={!showPassword}
                      editable={!isBusy}
                      onSubmitEditing={handleLogin}
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

                    <Pressable
                      onPress={() => router.push('/auth/forgot-password')}
                      disabled={isBusy}
                      style={({ pressed }) => [
                        styles.forgotPasswordWrap,
                        pressed && styles.linkPressed,
                      ]}
                    >
                      <Text style={styles.forgotPasswordText}>
                        Forgot password?
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleLogin}
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
                        <Text style={styles.primaryButtonText}>Login</Text>
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
                      <Text style={styles.footerText}>Don&apos;t have an account?</Text>
                      <Link href="/auth/register" style={styles.link}>
                        Register
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

  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
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

  forgotPasswordWrap: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },

  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
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

  buttonPressed: {
    opacity: 0.92,
  },

  buttonDisabled: {
    opacity: 0.65,
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
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },

  linkPressed: {
    opacity: 0.75,
  },

  pressed: {
    opacity: 0.75,
  },
});