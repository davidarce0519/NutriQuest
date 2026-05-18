import { supabase } from '../supabase/supabaseClient';
import { Suggestion, SuggestionResponse, SuggestionFeedback } from '../../domain/models';
import { mapFood } from '../mappers/foodMapper';

const mapSuggestion = (d: any): Suggestion => ({
  id:               d.id,
  userId:           d.user_id,
  food:             mapFood(d.foods),
  suggestedAt:      d.suggested_at,
  isExamPeriod:     d.is_exam_period,
  response:         d.response,
  respondedAt:      d.responded_at,
  feedback:         d.feedback,
  emotionalMessage: d.emotional_message,
});

export const suggestionRepository = {
  async getLatest(userId: string): Promise<Suggestion | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*, foods(*)')
      .eq('user_id', userId)
      .eq('response', 'sin_respuesta')
      .order('suggested_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapSuggestion(data) : null;
  },

  async getHistory(userId: string, limit = 30): Promise<Suggestion[]> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*, foods(*)')
      .eq('user_id', userId)
      .order('suggested_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map(mapSuggestion);
  },

  async create(userId: string, foodId: string, emotionalMessage: string, isExamPeriod: boolean): Promise<Suggestion> {
    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        user_id:          userId,
        food_id:          foodId,
        emotional_message: emotionalMessage,
        is_exam_period:   isExamPeriod,
      })
      .select('*, foods(*)')
      .single();
    if (error) throw error;
    return mapSuggestion(data);
  },

  async respond(id: string, response: SuggestionResponse): Promise<void> {
    const { error } = await supabase
      .from('suggestions')
      .update({ response, responded_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async sendFeedback(id: string, feedback: SuggestionFeedback): Promise<void> {
    const { error } = await supabase
      .from('suggestions')
      .update({ feedback, feedback_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getWeeklySummary(userId: string) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Dom, 1=Lun...6=Sab
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    const { data, error } = await supabase
      .from('suggestions')
      .select('suggested_at, response')
      .eq('user_id', userId)
      .gte('suggested_at', monday.toISOString())
      .lt('suggested_at', nextMonday.toISOString());

    if (error) throw error;

    const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const days = DAY_LABELS.map((day, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);

      const dayData = (data ?? []).filter(d => {
        const date = new Date(d.suggested_at);
        return (
          date.getFullYear() === dayDate.getFullYear() &&
          date.getMonth()    === dayDate.getMonth()    &&
          date.getDate()     === dayDate.getDate()
        );
      });

      return {
        day,
        accepted:  dayData.filter(d => d.response === 'aceptada').length,
        discarded: dayData.filter(d => d.response === 'descartada').length,
        total:     dayData.length,
      };
    });

    const totalAccepted  = days.reduce((sum, d) => sum + d.accepted, 0);
    const totalDiscarded = days.reduce((sum, d) => sum + d.discarded, 0);
    const total          = days.reduce((sum, d) => sum + d.total, 0);
    const acceptanceRate = total > 0 ? Math.round((totalAccepted / total) * 100) : 0;

    return { days, totalAccepted, totalDiscarded, total, acceptanceRate };
  },

  // Índices en BD:
  //   idx_suggestions_user_response  ON suggestions(user_id, response, suggested_at DESC)
  //   idx_suggestions_user_feedback  ON suggestions(user_id, feedback) WHERE feedback IS NOT NULL
  async getDislikedFoodIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('food_id')
      .eq('user_id', userId)
      .eq('response', 'descartada')
      .order('suggested_at', { ascending: false })
      .limit(20);
    if (error) throw error;

    const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
      const id = row.food_id as string;
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .filter(([, c]) => c >= 3)
      .map(([foodId]) => foodId);
  },

  async getFeedbackWeights(userId: string): Promise<Map<string, number>> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('food_id, feedback')
      .eq('user_id', userId)
      .not('feedback', 'is', null)
      .order('suggested_at', { ascending: false })
      .limit(30);
    if (error) throw error;

    type FeedbackCounts = { me_gusta: number; no_me_gusta: number };
    const grouped = (data ?? []).reduce<Record<string, FeedbackCounts>>((acc, row) => {
      const id = row.food_id as string;
      if (!acc[id]) acc[id] = { me_gusta: 0, no_me_gusta: 0 };
      if (row.feedback === 'me_gusta')    acc[id].me_gusta++;
      if (row.feedback === 'no_me_gusta') acc[id].no_me_gusta++;
      return acc;
    }, {});

    const weights = new Map<string, number>();
    for (const [foodId, counts] of Object.entries(grouped)) {
      if (counts.no_me_gusta >= 2) {
        weights.set(foodId, 0.1);
      } else if (counts.me_gusta >= 2) {
        weights.set(foodId, 3.0);
      } else {
        weights.set(foodId, 1.0);
      }
    }
    return weights;
  },

  async getTopAcceptedFoods(userId: string, limit = 3) {
    const { count } = await supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!count || count < 10) return [];

    const { data, error } = await supabase
      .from('suggestions')
      .select('food_id, foods(*)')
      .eq('user_id', userId)
      .eq('response', 'aceptada');

    if (error) throw error;

    const counts: Record<string, { food: any; count: number }> = {};
    for (const d of data ?? []) {
      if (!d.food_id || !d.foods) continue;
      if (!counts[d.food_id]) counts[d.food_id] = { food: d.foods, count: 0 };
      counts[d.food_id].count++;
    }

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ food, count }) => ({ food: mapFood(food), count }));
  },
};
