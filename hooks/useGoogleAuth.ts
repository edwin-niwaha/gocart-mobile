import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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
  const isNativeMobile = Platform.OS === 'android' || Platform.OS === 'ios';
  const appEnv =
    process.env.EXPO_PUBLIC_APP_ENV?.trim() ||
    process.env.NODE_ENV ||
    'development';
  const isReleaseBuild = appEnv === 'production' || appEnv === 'staging';
  const rawAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '';
  const rawIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
  const authSessionAndroidClientId =
    rawAndroidClientId || (!isReleaseBuild ? webClientId : '');
  const authSessionIosClientId =
    rawIosClientId || (!isReleaseBuild ? webClientId : '');
  const platformClientId =
    Platform.OS === 'android'
      ? authSessionAndroidClientId
      : Platform.OS === 'ios'
        ? authSessionIosClientId
        : webClientId;
  const hasGoogleClientIds = Boolean(platformClientId);
  const hasNativeClientId =
    Platform.OS === 'android'
      ? Boolean(rawAndroidClientId)
      : Platform.OS === 'ios'
        ? Boolean(rawIosClientId)
        : false;
  const canUseNativeGoogleSignIn =
    isNativeMobile && Boolean(webClientId) && hasNativeClientId;

  useEffect(() => {
    if (!isNativeMobile) return;

    GoogleSignin.configure({
      scopes: ['openid', 'profile', 'email'],
      webClientId: webClientId || undefined,
      iosClientId: rawIosClientId || undefined,
      offlineAccess: false,
    });
  }, [isNativeMobile, rawIosClientId, webClientId]);

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme: 'gocartmobile',
      }),
    []
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: authSessionAndroidClientId || undefined,
    iosClientId: authSessionIosClientId || undefined,
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
      if (isNativeMobile && canUseNativeGoogleSignIn) {
        if (!webClientId) {
          Alert.alert(
            errorTitle,
            'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add the web OAuth client ID used by the backend before signing in with Google.'
          );
          return;
        }

        setGoogleLoading(true);

        if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
        }

        const signInResponse = await GoogleSignin.signIn();

        if (signInResponse.type === 'cancelled') {
          setGoogleLoading(false);
          return;
        }

        const tokens = await GoogleSignin.getTokens();
        const accessToken = tokens.accessToken;

        if (!accessToken) {
          setGoogleLoading(false);
          Alert.alert(errorTitle, 'Missing Google access token.');
          return;
        }

        const signedInUser = await googleLogin(accessToken);
        await loadAuthedData();

        if (onSuccess) {
          await onSuccess(signedInUser);
        }

        setGoogleLoading(false);
        return;
      }

      if (isNativeMobile && isReleaseBuild) {
        Alert.alert(
          errorTitle,
          Platform.OS === 'android'
            ? 'This build is missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. Add the Android OAuth client ID for package com.gocart.mobile and rebuild the app.'
            : 'This build is missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID. Add the iOS OAuth client ID and rebuild the app.'
        );
        return;
      }

      if (isNativeMobile && !webClientId) {
        Alert.alert(
          errorTitle,
          'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add the web OAuth client ID used by the backend before signing in with Google.'
        );
        return;
      }

      if (!isNativeMobile && !hasGoogleClientIds) {
        Alert.alert(
          errorTitle,
          Platform.OS === 'android'
            ? 'Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID. Add an Android OAuth client ID for package com.gocart.mobile, or set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID for local development.'
            : 'Google sign-in is not configured for this build.'
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

      const code = typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code)
        : '';
      const message = error instanceof Error ? error.message : String(error || '');

      if (code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      if (
        isNativeMobile &&
        !isReleaseBuild &&
        request &&
        (code === '10' || message.includes('DEVELOPER_ERROR'))
      ) {
        logError(
          'Native Google sign-in is not configured for this debug build; falling back to browser auth.',
          error
        );
        setGoogleLoading(true);
        await promptAsync();
        return;
      }

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
    googleReady: isNativeMobile
      ? Boolean(webClientId) && (canUseNativeGoogleSignIn || !isReleaseBuild)
      : hasGoogleClientIds && !!request,
    redirectUri,
  };
}
