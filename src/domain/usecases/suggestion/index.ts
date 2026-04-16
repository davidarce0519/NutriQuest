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
    .limit(15); // más amplio para evitar repetición
  return (data ?? []).map((d: any) => d.food_id);
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

// Genera N sugerencias distintas de una sola vez
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

  // Traer todos los alimentos compatibles
  let foods = await foodRepository.getForUser(
    healthProfile.nutritionalGoal,
    healthProfile.dietType
  );
  if (foods.length === 0) foods = await foodRepository.getAll();

  // Filtrar excluidos
  let filtered = foods.filter(food => {
    const haystack = `${food.name} ${food.ingredientsSummary ?? ''}`.toLowerCase();
    return !exclusions.some(ex => haystack.includes(ex));
  });
  if (filtered.length === 0) filtered = foods;

  // Excluir recientes
  let candidates = filtered.filter(f => !recentIds.includes(f.id));

  // Si quedan menos candidatos que los necesitados, relajar el filtro de recientes
  if (candidates.length < count) candidates = filtered;

  // En parciales priorizar rápidos
  if (isExamPeriod) {
    const quick = candidates.filter(f => f.isQuick);
    if (quick.length >= count) candidates = quick;
  }

  // Mezclar y tomar los primeros N — garantiza variedad sin repetir
  const selected = shuffle(candidates).slice(0, count);

  // Si no alcanza, rellenar con más del pool general
  if (selected.length < count) {
    const extra = shuffle(filtered)
      .filter(f => !selected.find(s => s.id === f.id))
      .slice(0, count - selected.length);
    selected.push(...extra);
  }

  // Crear las sugerencias en secuencia para que el historial se actualice
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