import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

import { useAuth } from '@/providers/AuthProvider';
import { useShop } from '@/providers/ShopProvider';
import type { User } from '@/types';

WebBrowser.maybeCompleteAuthSession();

type UseGoogleAuthOptions = {
  onSuccess?: (user: User) => void | Promise<void>;
  onErrorTitle?: string;
};

export function useGoogleAuth(options?: UseGoogleAuthOptions) {
  const { googleLogin } = useAuth();
  const { loadAuthedData } = useShop();

  const [googleLoading, setGoogleLoading] = useState(false);

  const errorTitle = options?.onErrorTitle || 'Google login failed';
  const onSuccess = options?.onSuccess;

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: 'gocartmobile',
      }),
    []
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    console.log('Google Auth Config');
    console.log('redirectUri:', redirectUri);
    console.log(
      'androidClientId:',
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
    );
    console.log('iosClientId:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
    console.log('webClientId:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
    console.log('request ready:', !!request);
  }, [redirectUri, request]);

  useEffect(() => {
    console.log('Google response:', JSON.stringify(response, null, 2));

    const handleGoogleResponse = async () => {
      if (!response) return;

      if (response.type !== 'success') {
        if (response.type === 'error') {
          console.log('Google auth error response:', response.error);
          Alert.alert(
            errorTitle,
            response.error?.message || 'Google authentication failed.'
          );
        }
        setGoogleLoading(false);
        return;
      }

      try {
        setGoogleLoading(true);

        const accessToken = response.authentication?.accessToken;
        console.log('Google accessToken exists:', !!accessToken);

        if (!accessToken) {
          Alert.alert(errorTitle, 'Missing Google access token.');
          return;
        }

        const signedInUser = await googleLogin(accessToken);
        console.log('Backend googleLogin success:', signedInUser);

        await loadAuthedData();

        if (onSuccess) {
          await onSuccess(signedInUser);
        }
      } catch (error: any) {
        console.log(
          'Google login backend error:',
          error?.response?.data || error?.message || error
        );

        const message =
          error?.response?.data?.detail ||
          error?.message ||
          'Unable to complete Google authentication.';

        Alert.alert(errorTitle, message);
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response, googleLogin, loadAuthedData, onSuccess, errorTitle]);

  const startGoogleAuth = async () => {
    try {
      if (!request) {
        Alert.alert(
          errorTitle,
          'Google sign-in is not ready yet. Please try again.'
        );
        return;
      }

      console.log('Starting Google auth...');
      console.log('Using redirectUri:', redirectUri);

      setGoogleLoading(true);
      const result = await promptAsync();

      console.log('promptAsync result:', JSON.stringify(result, null, 2));
    } catch (error: any) {
      setGoogleLoading(false);

      console.log(
        'promptAsync error:',
        error?.response?.data || error?.message || error
      );

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Unable to start Google authentication.';

      Alert.alert(errorTitle, message);
    }
  };

  return {
    googleLoading,
    startGoogleAuth,
    googleReady: !!request,
    redirectUri,
  };
}