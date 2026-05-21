import { supabase } from '../supabase/supabaseClient';
import { User, UserRole } from '../../domain/models';
import { ENV } from '../../infrastructure/config/env';

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
  onboardingCompleted: data.onboarding_completed ?? false,
  createdAt: data.created_at,
});

const getProfileWithRetry = async (userId: string, attempts = 3): Promise<User> => {
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) return mapProfile(data);
    if (i < attempts - 1) {
      await new Promise(res => setTimeout(res, 600));
    }
  }
  throw new Error('No se pudo obtener el perfil. Intenta iniciar sesión de nuevo.');
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

  async deleteUserData(userId: string): Promise<void> {
    const tables = [
      'suggestions',
      'food_preferences',
      'health_measurements',
      'avatar_level_history',
      'avatar_progress',
      'health_profiles',
      'notification_settings',
      'scheduled_notifications',
      'weekly_summaries',
    ];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) throw new Error(`Error al eliminar ${table}: ${error.message}`);
    }
  },

  async deleteAccount(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const response = await fetch(
      `${ENV.SUPABASE_FUNCTIONS_URL}/delete-account`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? 'Error al eliminar la cuenta');
    }

    await supabase.auth.signOut();
  },

  async getStudentProfiles(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'estudiante')
      .eq('is_active', true)
      .order('full_name');
    if (error) throw error;
    return (data ?? []).map(mapProfile);
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProfile);
  },

  async changeUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
    if (error) throw error;
  },

  async getActiveUsersCount(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw error;
    return count ?? 0;
  },

  async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);
    if (error) throw error;
  },

  async resetOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: false })
      .eq('id', userId);
    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};