import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useShop } from '@/providers/ShopProvider';

export function GoogleSignInButton({ label = 'Continue with Google' }: { label?: string }) {
  const { googleLogin, loading } = useAuth();
  const { loadAuthedData } = useShop();

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const configured = useMemo(() => {
    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: false,
      scopes: ['email', 'profile'],
      profileImageSize: 120,
    });
    return true;
  }, [iosClientId, webClientId]);

  const onPress = async () => {
    if (!configured) return;
    if (!webClientId) {
      Alert.alert('Google sign-in is not configured', 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file first.');
      return;
    }

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        if (isCancelledResponse(response)) return;
        throw new Error('Google sign-in did not complete.');
      }

      const { accessToken } = await GoogleSignin.getTokens();
      if (!accessToken) throw new Error('Google did not return an access token.');

      await googleLogin(accessToken);
      await loadAuthedData();
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Google Play Services required', 'Update or enable Google Play Services on this device, then try again.');
            return;
          case statusCodes.SIGN_IN_CANCELLED:
            return;
        }
      }

      Alert.alert('Google sign-in failed', error?.response?.data?.detail || error?.message || 'Unable to sign in with Google.');
    }
  };

  return (
    <Pressable style={[styles.button, loading && styles.disabled]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={colors.text} /> : <Ionicons name="logo-google" size={18} color={colors.text} />}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  text: {
    color: colors.text,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.7,
  },
});
