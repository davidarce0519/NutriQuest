import { supabase } from '../supabase/supabaseClient';

type SuggestionRow   = { response: string };
type SuggestionJoin  = { food_id: string | null; response: string; foods: { name: string }[] | null };

export const adminRepository = {
  async getUserCountsByRole(): Promise<Record<string, number>> {
    const { data, error } = await supabase.from('profiles').select('role');
    if (error) throw error;
    const counts: Record<string, number> = { estudiante: 0, nutricionista: 0, superadmin: 0 };
    for (const d of (data ?? []) as Array<{ role: string }>) {
      counts[d.role] = (counts[d.role] ?? 0) + 1;
    }
    return counts;
  },

  async getSuggestionStats(): Promise<{ total: number; accepted: number; acceptanceRate: number }> {
    const { data, error } = await supabase.from('suggestions').select('response');
    if (error) throw error;
    const rows = (data ?? []) as SuggestionRow[];
    const total    = rows.length;
    const accepted = rows.filter(d => d.response === 'aceptada').length;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, acceptanceRate };
  },

  async getActiveFoodsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('foods')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw error;
    return count ?? 0;
  },

  async getMostSuggestedFood(): Promise<{ foodName: string; count: number } | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('food_id, foods(name)');
    if (error) throw error;
    const rows = (data ?? []) as Array<{ food_id: string | null; foods: { name: string }[] | null }>;
    const tally: Record<string, { name: string; count: number }> = {};
    for (const row of rows) {
      if (!row.food_id || !row.foods || row.foods.length === 0) continue;
      const foodName = row.foods[0].name;
      if (!tally[row.food_id]) tally[row.food_id] = { name: foodName, count: 0 };
      tally[row.food_id].count++;
    }
    const sorted = Object.values(tally).sort((a, b) => b.count - a.count);
    return sorted.length > 0 ? { foodName: sorted[0].name, count: sorted[0].count } : null;
  },

  async getRecentActivity(): Promise<{
    suggestionsLast7Days: number;
    suggestionsLast30Days: number;
    newUsersLast30Days: number;
  }> {
    const now = new Date();
    const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [r7, r30, u30] = await Promise.all([
      supabase.from('suggestions').select('id', { count: 'exact', head: true }).gte('suggested_at', d7),
      supabase.from('suggestions').select('id', { count: 'exact', head: true }).gte('suggested_at', d30),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', d30),
    ]);
    if (r7.error)  throw r7.error;
    if (r30.error) throw r30.error;
    if (u30.error) throw u30.error;
    return {
      suggestionsLast7Days:  r7.count  ?? 0,
      suggestionsLast30Days: r30.count ?? 0,
      newUsersLast30Days:    u30.count ?? 0,
    };
  },

  async getTopFoods(): Promise<Array<{ foodName: string; count: number; acceptanceRate: number }>> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('food_id, response, foods(name)');
    if (error) throw error;
    const rows = (data ?? []) as SuggestionJoin[];
    const tally: Record<string, { name: string; count: number; accepted: number }> = {};
    for (const row of rows) {
      if (!row.food_id || !row.foods || row.foods.length === 0) continue;
      const foodName = row.foods[0].name;
      if (!tally[row.food_id]) tally[row.food_id] = { name: foodName, count: 0, accepted: 0 };
      tally[row.food_id].count++;
      if (row.response === 'aceptada') tally[row.food_id].accepted++;
    }
    return Object.values(tally)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(t => ({
        foodName:       t.name,
        count:          t.count,
        acceptanceRate: t.count > 0 ? Math.round((t.accepted / t.count) * 100) : 0,
      }));
  },

  async getValidatedFoodsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('foods')
      .select('id', { count: 'exact', head: true })
      .not('validated_by', 'is', null);
    if (error) throw error;
    return count ?? 0;
  },

  async getUnvalidatedFoodsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('foods')
      .select('id', { count: 'exact', head: true })
      .is('validated_by', null)
      .eq('is_active', true);
    if (error) throw error;
    return count ?? 0;
  },
};
