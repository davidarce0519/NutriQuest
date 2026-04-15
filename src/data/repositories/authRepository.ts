import { supabase } from '../supabase/supabaseClient';
import { User } from '../../domain/models';

const mapProfile = (data: any): User => ({
  id: data.id,
  fullName: data.full_name,
  email: data.email,
  role: data.role,
  avatarUrl: data.avatar_url,
  notificationsPaused: data.notifications_paused,
  dataConsent: data.data_consent,
  dataConsentAt: data.data_consent_at,
  isActive: data.is_active,
  createdAt: data.created_at,
});

// Esperar a que el trigger cree el perfil — reintenta hasta 5 veces
const getProfileWithRetry = async (userId: string, attempts = 5): Promise<User> => {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) return mapProfile(data);

    // Esperar 800ms antes del siguiente intento
    await new Promise(res => setTimeout(res, 800));
  }
  throw new Error('No se pudo obtener el perfil. Intenta iniciar sesión.');
};

export const authRepository = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register(email: string, password: string, fullName: string, role: 'estudiante' | 'nutricionista' = 'estudiante') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProfile(userId: string): Promise<User> {
    return getProfileWithRetry(userId);
  },

  async updateDataConsent(userId: string, accepted: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({
        data_consent: accepted,
        data_consent_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};