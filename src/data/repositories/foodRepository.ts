import { supabase } from '../supabase/supabaseClient';
import { Food } from '../../domain/models';

const mapFood = (d: any): Food => ({
  id:                   d.id,
  name:                 d.name,
  description:          d.description,
  nutritionalBenefits:  d.nutritional_benefits,
  prepTimeMinutes:      d.prep_time_minutes,
  energyLevel:          d.energy_level,
  imageUrl:             d.image_url,
  isQuick:              d.is_quick,
  ingredientsSummary:   d.ingredients_summary,
  caloriesKcal:         d.calories_kcal,
  proteinG:             d.protein_g,
  carbsG:               d.carbs_g,
  fatG:                 d.fat_g,
  fiberG:               d.fiber_g,
  bestForGoal:          d.best_for_goal ?? [],
  suitableDietTypes:    d.suitable_diet_types ?? [],
  validatedBy:          d.validated_by,
  validatedAt:          d.validated_at,
  validatorName:        d.validator_name,
  isActive:             d.is_active,
});

export const foodRepository = {
  async getAll(): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data.map(mapFood);
  },

  async getById(id: string): Promise<Food> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapFood(data);
  },

  // Sistema de puntuación en lugar de filtro duro: retorna TODOS los alimentos activos ordenados por relevancia
  async getForUser(goal?: string, dietType?: string): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;

    const foods = data.map(mapFood);
    const hour = new Date().getHours();
    const isStudyTime = hour >= 12 && hour < 18;

    type Scored = { food: Food; score: number };
    const scored: Scored[] = foods.map(food => ({
      food,
      score: (goal && food.bestForGoal?.includes(goal) ? 3 : 0)
           + (dietType && dietType !== 'omnivora' && food.suitableDietTypes?.includes(dietType) ? 2 : 0)
           + (food.isQuick && isStudyTime ? 1 : 0),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.food);
  },

  async getUserRestrictionValues(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('food_preferences')
      .select('value')
      .eq('user_id', userId)
      .in('category', ['alergia', 'restriccion', 'intolerancia']);
    if (error) throw error;
    return (data ?? []).map((d: any) => d.value as string);
  },

  async upsert(food: Partial<Food>, validatorId: string, validatorName: string): Promise<Food> {
    const payload: any = {
      name:                 food.name,
      description:          food.description,
      nutritional_benefits: food.nutritionalBenefits,
      prep_time_minutes:    food.prepTimeMinutes,
      energy_level:         food.energyLevel,
      image_url:            food.imageUrl,
      is_quick:             food.isQuick,
      ingredients_summary:  food.ingredientsSummary,
      calories_kcal:        food.caloriesKcal,
      protein_g:            food.proteinG,
      carbs_g:              food.carbsG,
      fat_g:                food.fatG,
      fiber_g:              food.fiberG,
      best_for_goal:        food.bestForGoal,
      suitable_diet_types:  food.suitableDietTypes,
      validated_by:         validatorId,
      validated_at:         new Date().toISOString(),
      validator_name:       validatorName,
      updated_by:           validatorId,
      updated_at:           new Date().toISOString(),
    };
    if (food.id) payload.id = food.id;

    const { data, error } = await supabase
      .from('foods')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapFood(data);
  },
};
