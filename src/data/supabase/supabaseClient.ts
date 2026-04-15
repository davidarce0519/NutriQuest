import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../infrastructure/config/env';
import { secureStorage } from '../../infrastructure/storage/secureStorage';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      async getItem(key: string) {
        return secureStorage.getSession();
      },
      async setItem(key: string, value: string) {
        return secureStorage.saveSession(value);
      },
      async removeItem(key: string) {
        return secureStorage.clear();
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});