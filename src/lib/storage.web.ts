export const StorageKeys = {
  token: 'essarota.token',
  session: 'essarota.session',
  themePreference: 'essarota.theme',
} as const;

function getLocalStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export const storage = {
  async get(key: string): Promise<string | null> {
    return getLocalStorage()?.getItem(key) ?? null;
  },
  async set(key: string, value: string): Promise<void> {
    getLocalStorage()?.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    getLocalStorage()?.removeItem(key);
  },
};
