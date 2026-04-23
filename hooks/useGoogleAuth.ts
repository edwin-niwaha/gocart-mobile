import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

import { getErrorMessage } from '@/api/services';
import { useAuth } from '@/providers/AuthProvider';
import { useShop } from '@/providers/ShopProvider';
import { logError } from '@/utils/logger';
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
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const hasGoogleClientIds = Boolean(androidClientId || iosClientId || webClientId);

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: 'gocartmobile',
      }),
    []
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (!response) return;

      if (response.type !== 'success') {
        if (response.type === 'error') {
          logError('Google auth provider returned an error.', response.error);
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

        if (!accessToken) {
          Alert.alert(errorTitle, 'Missing Google access token.');
          return;
        }

        const signedInUser = await googleLogin(accessToken);

        await loadAuthedData();

        if (onSuccess) {
          await onSuccess(signedInUser);
        }
      } catch (error: unknown) {
        logError('Google login failed after provider success.', error);
        Alert.alert(
          errorTitle,
          getErrorMessage(error, 'Unable to complete Google authentication.')
        );
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response, googleLogin, loadAuthedData, onSuccess, errorTitle]);

  const startGoogleAuth = async () => {
    try {
      if (!hasGoogleClientIds) {
        Alert.alert(
          errorTitle,
          'Google sign-in is not configured for this build.'
        );
        return;
      }

      if (!request) {
        Alert.alert(
          errorTitle,
          'Google sign-in is not ready yet. Please try again.'
        );
        return;
      }

      setGoogleLoading(true);
      await promptAsync();
    } catch (error: unknown) {
      setGoogleLoading(false);

      logError('Google auth prompt failed.', error);
      Alert.alert(
        errorTitle,
        getErrorMessage(error, 'Unable to start Google authentication.')
      );
    }
  };

  return {
    googleLoading,
    startGoogleAuth,
    googleReady: hasGoogleClientIds && !!request,
    redirectUri,
  };
}
