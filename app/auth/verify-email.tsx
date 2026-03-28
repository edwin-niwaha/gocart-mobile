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
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/constants/theme';

export default function VerifyEmailScreen() {
  const { verifyEmail, sendEmailVerification, loading, user } = useAuth();
  const [code, setCode] = useState('');

  const onVerify = async () => {
    try {
      if (!code.trim()) {
        Alert.alert('Missing code', 'Please enter the verification code.');
        return;
      }

      await verifyEmail(code.trim());
      Alert.alert('Success', 'Email verified successfully.');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Verification failed', error?.response?.data?.detail || 'Try again.');
    }
  };

  const onResend = async () => {
    try {
      await sendEmailVerification();
      Alert.alert('Sent', `A code was sent to ${user?.email}.`);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'Could not resend code.');
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
                <Text style={styles.brand}>GoCart</Text>
                <Text style={styles.title}>Verify your email</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to {user?.email || 'your email'}.
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Verification code</Text>
                    <View style={styles.inputWrapper}>
                      <Feather name="shield" size={18} color={colors.muted} />
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

                  <Pressable
                    onPress={onVerify}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Verifying...' : 'Verify email'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={onResend}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>Resend code</Text>
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
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});