import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useShop } from '@/providers/ShopProvider';

export default function RegisterScreen() {
  const { register, loading } = useAuth();
  const { loadAuthedData } = useShop();
  const [form, setForm] = useState({ email: '', username: '', password: '', password_confirm: '' });

  const onSubmit = async () => {
    try {
      await register(form);
      await loadAuthedData();
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error?.response?.data?.detail || JSON.stringify(error?.response?.data || 'Please fix the form and try again.');
      Alert.alert('Registration failed', message);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>Create account</Text>
      <TextInput style={styles.input} value={form.email} onChangeText={(email) => setForm((prev) => ({ ...prev, email }))} autoCapitalize="none" placeholder="Email" keyboardType="email-address" />
      <TextInput style={styles.input} value={form.username} onChangeText={(username) => setForm((prev) => ({ ...prev, username }))} autoCapitalize="none" placeholder="Username" />
      <TextInput style={styles.input} value={form.password} onChangeText={(password) => setForm((prev) => ({ ...prev, password }))} placeholder="Password" secureTextEntry />
      <TextInput style={styles.input} value={form.password_confirm} onChangeText={(password_confirm) => setForm((prev) => ({ ...prev, password_confirm }))} placeholder="Confirm password" secureTextEntry />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Register'}</Text>
      </Pressable>
      <Text style={styles.or}>or</Text>
      <GoogleSignInButton label="Sign up with Google" />
      <Pressable onPress={() => router.push('/auth/login')}><Text style={styles.link}>Already have an account? Login</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 14 },
  button: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '800' },
  link: { textAlign: 'center', color: colors.primary, fontWeight: '700' },
  or: { textAlign: 'center', color: colors.muted, fontWeight: '700' },
});
