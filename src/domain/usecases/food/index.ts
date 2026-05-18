import { foodRepository } from '../../../data/repositories/foodRepository';
import { Food } from '../../models';

export const getAllFoodsUseCase = (): Promise<Food[]> =>
  foodRepository.getAllAdmin();

export const searchFoodsUseCase = (query: string): Promise<Food[]> =>
  foodRepository.search(query);

export const createFoodUseCase = (food: Partial<Food>): Promise<Food> =>
  foodRepository.create(food);

export const updateFoodUseCase = (id: string, food: Partial<Food>): Promise<Food> =>
  foodRepository.update(id, food);

export const toggleFoodActiveUseCase = (id: string, active: boolean): Promise<void> =>
  foodRepository.toggleActive(id, active);

export const validateFoodUseCase = (
  id: string,
  validatorId: string,
  validatorName: string,
): Promise<void> => foodRepository.validate(id, validatorId, validatorName);

export const getValidatedFoodsCountUseCase = (userId: string): Promise<number> =>
  foodRepository.getValidatedFoodsCount(userId);

export const getActiveFoodsCountUseCase = (): Promise<number> =>
  foodRepository.getActiveFoodsCount();
