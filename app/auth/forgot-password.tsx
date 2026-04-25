import React, { useState } from 'react';
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
import { router, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState('');

  const normalizedEmail = email.trim().toLowerCase();

  const onSubmit = async () => {
    try {
      if (!normalizedEmail) {
        Alert.alert('Missing email', 'Please enter your email address.');
        return;
      }

      await forgotPassword(normalizedEmail);

      Alert.alert('Success', 'If the email exists, a reset code has been sent.');

      router.push({
        pathname: '/auth/reset-password',
        params: { email: normalizedEmail },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.email?.[0] ||
        'Request failed.';

      Alert.alert('Error', message);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Forgot Password',
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
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Forgot password</Text>
                  <Text style={styles.subtitle}>
                    Enter your email address and weâ€™ll send you a reset code.
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
                          editable={!loading}
                          style={styles.input}
                        />
                      </View>
                    </View>

                    <Pressable
                      onPress={onSubmit}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.button,
                        pressed && !loading && styles.buttonPressed,
                        loading && styles.buttonDisabled,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Send code</Text>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => router.push('/auth/login')}
                      style={({ pressed }) => [pressed && styles.linkPressed]}
                    >
                      <Text style={styles.link}>Back to login</Text>
                    </Pressable>
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
    maxWidth: 330,
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

  button: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  buttonPressed: {
    opacity: 0.92,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  link: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
    marginTop: 8,
    fontSize: 14,
  },

  linkPressed: {
    opacity: 0.75,
  },
});
