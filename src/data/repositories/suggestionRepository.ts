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
};
