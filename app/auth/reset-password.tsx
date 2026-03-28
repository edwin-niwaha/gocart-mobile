import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
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
import { Feather } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { resetPassword, loading } = useAuth();

  const [email, setEmail] = useState(emailParam ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const onSubmit = async () => {
    try {
      if (!email.trim() || !code.trim() || !password.trim() || !passwordConfirm.trim()) {
        Alert.alert('Missing details', 'Please complete all fields.');
        return;
      }

      if (password !== passwordConfirm) {
        Alert.alert('Password mismatch', 'Passwords do not match.');
        return;
      }

      await resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
        password_confirm: passwordConfirm,
      });

      Alert.alert('Success', 'Password reset successful.');
      router.replace('/auth/login');
    } catch (error: any) {
      Alert.alert('Reset failed', error?.response?.data?.detail || 'Please try again.');
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.page}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter the code sent to your email and choose a new password.
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
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Verification code</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="hash" size={18} color={colors.muted} />
                      <TextInput
                        value={code}
                        onChangeText={setCode}
                        placeholder="6-digit code"
                        placeholderTextColor={colors.muted}
                        keyboardType="number-pad"
                        style={styles.input}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>New password</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="lock" size={18} color={colors.muted} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={colors.muted}
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        editable={!loading}
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
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                        placeholder="Confirm new password"
                        placeholderTextColor={colors.muted}
                        secureTextEntry={!showPasswordConfirm}
                        style={styles.input}
                        editable={!loading}
                      />
                      <Pressable onPress={() => setShowPasswordConfirm((prev) => !prev)}>
                        <Feather
                          name={showPasswordConfirm ? 'eye-off' : 'eye'}
                          size={18}
                          color={colors.muted}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    onPress={onSubmit}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Resetting...' : 'Reset password'}
                    </Text>
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
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  page: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'flex-start',
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
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
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
  button: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
});