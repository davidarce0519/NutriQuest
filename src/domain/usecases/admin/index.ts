import { adminRepository } from '../../../data/repositories/adminRepository';

export const getSystemAnalyticsUseCase = async () => {
  const [
    roleCounts,
    suggestionStats,
    activeFoods,
    mostSuggested,
    recentActivity,
    topFoods,
    validatedFoods,
    unvalidatedFoods,
  ] = await Promise.all([
    adminRepository.getUserCountsByRole(),
    adminRepository.getSuggestionStats(),
    adminRepository.getActiveFoodsCount(),
    adminRepository.getMostSuggestedFood(),
    adminRepository.getRecentActivity(),
    adminRepository.getTopFoods(),
    adminRepository.getValidatedFoodsCount(),
    adminRepository.getUnvalidatedFoodsCount(),
  ]);
  return {
    roleCounts,
    suggestionStats,
    activeFoods,
    mostSuggested,
    recentActivity,
    topFoods,
    validatedFoods,
    unvalidatedFoods,
  };
};
