import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Tokens } from '@/types';

const ACCESS_KEY = 'gocart_access';
const REFRESH_KEY = 'gocart_refresh';
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'gocart.auth',
};

async function canUseSecureStore() {
  if (Platform.OS === 'web') return false;

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveTokens(tokens: Tokens) {
  if (await canUseSecureStore()) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.access, SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh, SECURE_STORE_OPTIONS),
    ]);
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    return;
  }

  await AsyncStorage.multiSet([
    [ACCESS_KEY, tokens.access],
    [REFRESH_KEY, tokens.refresh],
  ]);
}

export async function getTokens(): Promise<Tokens | null> {
  if (await canUseSecureStore()) {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY, SECURE_STORE_OPTIONS),
      SecureStore.getItemAsync(REFRESH_KEY, SECURE_STORE_OPTIONS),
    ]);

    if (access && refresh) return { access, refresh };

    // One-time migration from the previous AsyncStorage token location.
    const legacyEntries = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
    const legacyMap = Object.fromEntries(legacyEntries);
    if (legacyMap[ACCESS_KEY] && legacyMap[REFRESH_KEY]) {
      const migratedTokens = {
        access: legacyMap[ACCESS_KEY]!,
        refresh: legacyMap[REFRESH_KEY]!,
      };
      await saveTokens(migratedTokens);
      return migratedTokens;
    }

    return null;
  }

  const entries = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  const map = Object.fromEntries(entries);
  if (!map[ACCESS_KEY] || !map[REFRESH_KEY]) return null;
  return { access: map[ACCESS_KEY]!, refresh: map[REFRESH_KEY]! };
}

export async function clearTokens() {
  if (await canUseSecureStore()) {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(REFRESH_KEY, SECURE_STORE_OPTIONS),
    ]);
  }

  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
