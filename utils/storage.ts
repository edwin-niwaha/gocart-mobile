import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tokens } from '@/types';

const ACCESS_KEY = 'gocart_access';
const REFRESH_KEY = 'gocart_refresh';

export async function saveTokens(tokens: Tokens) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, tokens.access],
    [REFRESH_KEY, tokens.refresh],
  ]);
}

export async function getTokens(): Promise<Tokens | null> {
  const entries = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  const map = Object.fromEntries(entries);
  if (!map[ACCESS_KEY] || !map[REFRESH_KEY]) return null;
  return { access: map[ACCESS_KEY]!, refresh: map[REFRESH_KEY]! };
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
