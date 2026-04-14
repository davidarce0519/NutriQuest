import { suggestionRepository } from '../../data/repositories/suggestionRepository';
import { foodRepository } from '../../data/repositories/foodRepository';
import { SuggestionResponse, SuggestionFeedback, HealthProfile } from '../models';

// Mensajes emocionales de acompañamiento (HU_1.5.1) — máx 15 palabras
const EMOTIONAL_MESSAGES_EXAM = [
  'Lo estás dando todo. Recarga energía con algo rico y sencillo.',
  'Tú puedes con esto. Este snack te acompañará en el camino.',
  'Una pausa breve alimenta tanto el cuerpo como la mente.',
  'El esfuerzo que pones merece el mejor combustible. Aquí va uno.',
];

const EMOTIONAL_MESSAGES_NORMAL = [
  'Pequeñas decisiones construyen grandes hábitos. Aquí tienes una.',
  'Cuidarte es parte del proceso. Este alimento lo hace fácil.',
  'Tu bienestar importa. Esta sugerencia es para ti.',
];

const pickMessage = (isExam: boolean): string => {
  const pool = isExam ? EMOTIONAL_MESSAGES_EXAM : EMOTIONAL_MESSAGES_NORMAL;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getSuggestionUseCase = async (userId: string) => {
  return suggestionRepository.getLatest(userId);
};

export const generateSuggestionUseCase = async (
  userId: string,
  healthProfile: HealthProfile,
  isExamPeriod: boolean
) => {
  // Obtener alimentos compatibles con el perfil del usuario
  const foods = await foodRepository.getForUser(
    healthProfile.nutritionalGoal,
    healthProfile.dietType
  );

  if (foods.length === 0) {
    const allFoods = await foodRepository.getAll();
    if (allFoods.length === 0) throw new Error('No hay alimentos disponibles en el catálogo');
    const food = allFoods[Math.floor(Math.random() * allFoods.length)];
    return suggestionRepository.create(userId, food.id, pickMessage(isExamPeriod), isExamPeriod);
  }

  // En semana de parciales, priorizar alimentos rápidos (≤10 min)
  const candidates = isExamPeriod ? foods.filter(f => f.isQuick) : foods;
  const pool = candidates.length > 0 ? candidates : foods;
  const food = pool[Math.floor(Math.random() * pool.length)];

  return suggestionRepository.create(userId, food.id, pickMessage(isExamPeriod), isExamPeriod);
};

export const respondSuggestionUseCase = async (id: string, response: SuggestionResponse) => {
  return suggestionRepository.respond(id, response);
};

export const feedbackSuggestionUseCase = async (id: string, feedback: SuggestionFeedback) => {
  return suggestionRepository.sendFeedback(id, feedback);
};

export const getSuggestionHistoryUseCase = async (userId: string, limit?: number) => {
  return suggestionRepository.getHistory(userId, limit);
};
