import { Food } from '../../domain/models';

export const mapFood = (d: any): Food => ({
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
