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

  // Filtrar por objetivo y tipo de dieta (personalización)
  async getForUser(goal?: string, dietType?: string): Promise<Food[]> {
    let query = supabase
      .from('foods')
      .select('*')
      .eq('is_active', true);

    if (goal) {
      query = query.contains('best_for_goal', [goal]);
    }
    if (dietType && dietType !== 'omnivora') {
      query = query.contains('suitable_diet_types', [dietType]);
    }

    const { data, error } = await query.order('energy_level', { ascending: false });
    if (error) throw error;
    return data.map(mapFood);
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
