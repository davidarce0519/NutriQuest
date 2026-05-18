import { suggestionRepository } from '../../../data/repositories/suggestionRepository';
import { foodRepository } from '../../../data/repositories/foodRepository';
import { supabase } from '../../../data/supabase/supabaseClient';
import { SuggestionResponse, SuggestionFeedback, HealthProfile } from '../../models';

const EMOTIONAL_MESSAGES_EXAM = [
  'Lo estás dando todo. Recarga energía con algo rico y sencillo.',
  'Tú puedes con esto. Este snack te acompañará en el camino.',
  'Una pausa breve alimenta tanto el cuerpo como la mente.',
  'El esfuerzo que pones merece el mejor combustible.',
];

const EMOTIONAL_MESSAGES_NORMAL = [
  'Pequeñas decisiones construyen grandes hábitos.',
  'Cuidarte es parte del proceso. Este alimento lo hace fácil.',
  'Tu bienestar importa. Esta sugerencia es para ti.',
  'Hoy también mereces comer bien. 🌿',
];

const pickMessage = (isExam: boolean) => {
  const pool = isExam ? EMOTIONAL_MESSAGES_EXAM : EMOTIONAL_MESSAGES_NORMAL;
  return pool[Math.floor(Math.random() * pool.length)];
};

const getUserExclusions = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('food_preferences')
    .select('value')
    .eq('user_id', userId)
    .in('category', ['alergia', 'restriccion', 'intolerancia']);
  return (data ?? []).map((d: any) => d.value.toLowerCase());
};

const getRecentFoodIds = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('suggestions')
    .select('food_id')
    .eq('user_id', userId)
    .order('suggested_at', { ascending: false })
    .limit(20);
  return (data ?? []).map((d: any) => d.food_id);
};

const getDislikedFoodIds = async (userId: string): Promise<string[]> => {
  return suggestionRepository.getDislikedFoodIds(userId);
};

const getFeedbackWeights = async (userId: string): Promise<Map<string, number>> => {
  return suggestionRepository.getFeedbackWeights(userId);
};

// Mezcla aleatoria tipo Fisher-Yates
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Genera N sugerencias distintas priorizando alimentos no vistos recientemente
export const generateMultipleSuggestionsUseCase = async (
  userId: string,
  healthProfile: HealthProfile,
  isExamPeriod: boolean,
  count: number = 3
): Promise<Awaited<ReturnType<typeof suggestionRepository.create>>[]> => {

  const [exclusions, recentIds] = await Promise.all([
    getUserExclusions(userId),
    getRecentFoodIds(userId),
  ]);

  // Pool completo sin filtro duro
  const allFoods = await foodRepository.getAll();

  // Filtrar ingredientes excluidos por alergias/intolerancias/restricciones
  const filtered = allFoods.filter(food => {
    if (exclusions.length === 0) return true;
    const haystack = `${food.name} ${food.ingredientsSummary ?? ''}`.toLowerCase();
    return !exclusions.some(ex => haystack.includes(ex));
  });

  // PASO 4.5 — Aprendizaje adaptativo (silencioso)
  const [dislikedIds, feedbackWeights] = await Promise.all([
    getDislikedFoodIds(userId).catch(() => [] as string[]),
    getFeedbackWeights(userId).catch(() => new Map<string, number>()),
  ]);

  // Excluir alimentos frecuentemente descartados
  let adaptive = filtered.filter(food => !dislikedIds.includes(food.id));
  if (adaptive.length < count) adaptive = filtered;

  // Expandir pool según pesos de feedback para sesgar el shuffle
  const weighted: typeof adaptive = [];
  for (const food of adaptive) {
    const weight = feedbackWeights.get(food.id) ?? 1.0;
    if (weight >= 3.0) {
      weighted.push(food, food, food);
    } else if (weight <= 0.1) {
      if (adaptive.length <= count * 2) weighted.push(food);
    } else {
      weighted.push(food);
    }
  }

  const poolToUse = weighted.length >= count ? weighted : adaptive;

  const deduped = shuffle(poolToUse).filter(
    (food, index, self) => index === self.findIndex(f => f.id === food.id)
  );

  // Priorizar alimentos no vistos recientemente; en parciales priorizar rápidos
  const nuevos    = deduped.filter(f => !recentIds.includes(f.id));
  const recientes = deduped.filter(f =>  recentIds.includes(f.id));
  let candidatePool = [...nuevos, ...recientes];
  if (isExamPeriod) {
    const quick = candidatePool.filter(f => f.isQuick);
    if (quick.length >= count) candidatePool = quick;
  }

  const selected = candidatePool.slice(0, count);

  // Crear sugerencias en secuencia para que el historial se actualice entre cada una
  const results = [];
  for (const food of selected) {
    const s = await suggestionRepository.create(
      userId,
      food.id,
      pickMessage(isExamPeriod),
      isExamPeriod
    );
    results.push(s);
  }

  return results;
};

// Mantener el use case individual para compatibilidad
export const generateSuggestionUseCase = async (
  userId: string,
  healthProfile: HealthProfile,
  isExamPeriod: boolean
) => {
  const results = await generateMultipleSuggestionsUseCase(
    userId, healthProfile, isExamPeriod, 1
  );
  return results[0];
};

export const getSuggestionUseCase = async (userId: string) => {
  return suggestionRepository.getLatest(userId);
};

export const respondSuggestionUseCase = async (
  id: string, response: SuggestionResponse
) => {
  return suggestionRepository.respond(id, response);
};

export const feedbackSuggestionUseCase = async (
  id: string, feedback: SuggestionFeedback
) => {
  return suggestionRepository.sendFeedback(id, feedback);
};

export const getSuggestionHistoryUseCase = async (
  userId: string, limit?: number
) => {
  return suggestionRepository.getHistory(userId, limit);
};

export const getWeeklySummaryUseCase = async (userId: string) => {
  return suggestionRepository.getWeeklySummary(userId);
};

export const getTopAcceptedFoodsUseCase = async (userId: string) => {
  return suggestionRepository.getTopAcceptedFoods(userId);
};

export const getUserRestrictionsUseCase = async (userId: string): Promise<string[]> => {
  return foodRepository.getUserRestrictionValues(userId);
};