import { useEffect, useState } from 'react';
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
import { router, Link } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAuth } from '@/providers/AuthProvider';

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
      if (!email.trim() || !password.trim()) {
        Alert.alert('Missing details', 'Enter your email and password.');
        return;
      }

      await login({
        email: email.trim().toLowerCase(),
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
                <Text style={styles.subtitle}>
                  Welcome back. Sign in to continue shopping.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Email address</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="mail" size={18} color={colors.muted} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.muted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        autoComplete="email"
                        returnKeyType="next"
                        editable={!isBusy}
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="lock" size={18} color={colors.muted} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.muted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        returnKeyType="done"
                        editable={!isBusy}
                        onSubmitEditing={handleLogin}
                        style={styles.input}
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

                  <Pressable
                    onPress={() => router.push('/auth/forgot-password')}
                    disabled={isBusy}
                    style={styles.forgotPasswordWrap}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleLogin}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isBusy && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Signing in...' : 'Login'}
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
  forgotPasswordWrap: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
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
  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },
});