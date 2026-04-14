import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION: 'nq_session',
  USER_ID:  'nq_user_id',
} as const;

export const secureStorage = {
  async saveSession(value: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.SESSION, value);
  },

  async getSession(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.SESSION);
  },

  async saveUserId(userId: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER_ID, userId);
  },

  async getUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.USER_ID);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.SESSION);
    await SecureStore.deleteItemAsync(KEYS.USER_ID);
  },
};
