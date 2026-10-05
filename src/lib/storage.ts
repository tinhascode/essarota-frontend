import * as SecureStore from 'expo-secure-store';

export const StorageKeys = {
  token: 'essarota.token',
  session: 'essarota.session',
  themePreference: 'essarota.theme',
} as const;

export const storage = {
  get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  set(key: string, value: string): Promise<void> {
    return SecureStore.setItemAsync(key, value);
  },
  remove(key: string): Promise<void> {
    return SecureStore.deleteItemAsync(key);
  },
};
