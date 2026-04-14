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
};
