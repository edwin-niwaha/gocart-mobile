import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { useShop } from '@/providers/ShopProvider';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const { loadAuthedData } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await login({ email, password });
      await loadAuthedData();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.detail || 'Check your credentials and try again.');
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>Welcome back</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Login'}</Text>
      </Pressable>
      <Text style={styles.or}>or</Text>
      <GoogleSignInButton />
      <Pressable onPress={() => router.push('/auth/register')}><Text style={styles.link}>Create a new account</Text></Pressable>
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
