import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const store = {
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setString(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      /* best effort */
    }
  },
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await store.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setJSON(key: string, value: unknown) {
    await store.setString(key, JSON.stringify(value));
  },
  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* best effort */
    }
  },
};

const TOKEN_KEY = 'mentoos.auth.tokens.v1';
const USER_KEY = 'mentoos.auth.user.v1';

export type StoredTokens = { accessToken: string | null; refreshToken: string | null };

/**
 * Tokens live in the keychain/keystore on device. SecureStore has no web
 * implementation, so the browser preview falls back to AsyncStorage.
 */
export async function saveTokens(tokens: StoredTokens) {
  const raw = JSON.stringify(tokens);
  if (isWeb) return store.setString(TOKEN_KEY, raw);
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, raw);
  } catch {
    await store.setString(TOKEN_KEY, raw);
  }
}

export async function readTokens(): Promise<StoredTokens | null> {
  const raw = isWeb ? await store.getString(TOKEN_KEY) : await readSecure(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function readSecure(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return store.getString(key);
  }
}

export async function clearTokens() {
  if (isWeb) return store.remove(TOKEN_KEY);
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
  await store.remove(TOKEN_KEY);
}

export const readCachedUser = () => store.getJSON<unknown>(USER_KEY);
export const cacheUser = (user: unknown) => store.setJSON(USER_KEY, user);
export const clearCachedUser = () => store.remove(USER_KEY);
