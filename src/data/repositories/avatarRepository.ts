import { supabase } from '../supabase/supabaseClient';
import { AvatarProgress, AvatarLevel } from '../../domain/models';

const mapProgress = (d: any): AvatarProgress => ({
  id:                    d.id,
  userId:                d.user_id,
  currentLevel:          d.current_level,
  totalHealthyDecisions: d.total_healthy_decisions,
  activeStreakDays:       d.active_streak_days,
  lastActivityDate:      d.last_activity_date,
  updatedAt:             d.updated_at,
});

const mapLevel = (d: any): AvatarLevel => ({
  level:        d.level,
  label:        d.label,
  minDecisions: d.min_decisions,
  description:  d.description,
  imageUrl:     d.image_url,
});

export const avatarRepository = {
  async getProgress(userId: string): Promise<AvatarProgress> {
    const { data, error } = await supabase
      .from('avatar_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return mapProgress(data);
  },

  async getLevels(): Promise<AvatarLevel[]> {
    const { data, error } = await supabase
      .from('avatar_levels')
      .select('*')
      .order('level');
    if (error) throw error;
    return data.map(mapLevel);
  },

  async getLevelHistory(userId: string) {
    const { data, error } = await supabase
      .from('avatar_level_history')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Requiere migración en Supabase:
  // ALTER TABLE avatar_level_history ADD COLUMN IF NOT EXISTS seen BOOLEAN DEFAULT false;
  // UPDATE avatar_level_history SET seen = true;
  async getUnseenLevelUps(userId: string): Promise<{ id: string; level: number; achievedAt: string }[]> {
    const { data, error } = await supabase
      .from('avatar_level_history')
      .select('*')
      .eq('user_id', userId)
      .eq('seen', false)
      .order('achieved_at', { ascending: false });

    if (error) {
      // Columna seen no existe aún — mostrar entradas de últimas 24h como fallback
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const fallback = await supabase
        .from('avatar_level_history')
        .select('*')
        .eq('user_id', userId)
        .gte('achieved_at', yesterday)
        .order('achieved_at', { ascending: false });
      return (fallback.data ?? []).map((d: any) => ({
        id:          d.id,
        level:       d.level ?? d.new_level ?? 1,
        achievedAt:  d.achieved_at,
      }));
    }

    return (data ?? []).map((d: any) => ({
      id:          d.id,
      level:       d.level ?? d.new_level ?? 1,
      achievedAt:  d.achieved_at,
    }));
  },

  async markLevelUpSeen(levelHistoryId: string): Promise<void> {
    const { error } = await supabase
      .from('avatar_level_history')
      .update({ seen: true })
      .eq('id', levelHistoryId);
    if (error) throw error;
  },
};
