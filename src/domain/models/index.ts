// ─── User / Profile ──────────────────────────────────────────
export type UserRole = 'estudiante' | 'nutricionista' | 'superadmin';

export interface User {
  id:                   string;
  fullName:             string;
  email:                string;
  role:                 UserRole;
  avatarUrl?:           string;
  notificationsPaused:  boolean;
  dataConsent:          boolean;
  dataConsentAt?:       string;
  isActive:             boolean;
  createdAt:            string;
}

// ─── Health Profile ───────────────────────────────────────────
export type PhysicalActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo';
export type NutritionalGoal =
  | 'mantener_peso' | 'perder_peso' | 'ganar_masa'
  | 'mejorar_energia' | 'mejorar_concentracion' | 'bienestar_general';
export type DietType = 'omnivora' | 'vegetariana' | 'vegana' | 'flexitariana' | 'otra';
export type BmiCategory = 'Bajo peso' | 'Normal' | 'Sobrepeso' | 'Obesidad';
export type AcademicLoad = 'baja' | 'media' | 'alta' | 'critica';

export interface HealthProfile {
  id:                    string;
  userId:                string;
  birthDate?:            string;
  biologicalSex?:        string;
  heightCm?:             number;
  weightKg?:             number;
  bmi?:                  number;
  bmiCategory?:          BmiCategory;
  physicalActivityLevel?: PhysicalActivityLevel;
  hasMedicalConditions:  boolean;
  medicalConditionsNotes?: string;
  nutritionalGoal?:      NutritionalGoal;
  dailyWaterGlasses?:    number;
  avgSleepHours?:        number;
  dietType?:             DietType;
  currentSemester?:      number;
  academicLoad?:         AcademicLoad;
  lastUpdatedAt:         string;
}

// ─── Health Measurement ───────────────────────────────────────
export interface HealthMeasurement {
  id:            string;
  userId:        string;
  measuredAt:    string;
  weightKg?:     number;
  heightCm?:     number;
  bmi?:          number;
  bmiCategory?:  BmiCategory;
  bodyFatPct?:   number;
  muscleMassKg?: number;
  waistCm?:      number;
  hipCm?:        number;
  waistHipRatio?: number;
  energyLevel?:  number;  // 1-5
  stressLevel?:  number;  // 1-5
  sleepHours?:   number;
  waterGlasses?: number;
  isExamPeriod:  boolean;
  notes?:        string;
  createdAt:     string;
}

// ─── Food ────────────────────────────────────────────────────
export interface Food {
  id:                   string;
  name:                 string;
  description?:         string;
  nutritionalBenefits?: string;
  prepTimeMinutes?:     number;
  energyLevel?:         number;  // 1-5
  imageUrl?:            string;
  isQuick:              boolean;
  ingredientsSummary?:  string;
  caloriesKcal?:        number;
  proteinG?:            number;
  carbsG?:              number;
  fatG?:                number;
  fiberG?:              number;
  bestForGoal?:         string[];
  suitableDietTypes?:   string[];
  validatedBy?:         string;
  validatedAt?:         string;
  validatorName?:       string;
  isActive:             boolean;
}

// ─── Suggestion ───────────────────────────────────────────────
export type SuggestionResponse = 'aceptada' | 'descartada' | 'sin_respuesta';
export type SuggestionFeedback = 'me_gusta' | 'no_me_gusta' | 'no_aplica';

export interface Suggestion {
  id:               string;
  userId:           string;
  food:             Food;
  suggestedAt:      string;
  isExamPeriod:     boolean;
  response:         SuggestionResponse;
  respondedAt?:     string;
  feedback?:        SuggestionFeedback;
  emotionalMessage?: string;
}

// ─── Avatar ───────────────────────────────────────────────────
export interface AvatarLevel {
  level:        number;
  label:        string;
  minDecisions: number;
  description:  string;
  imageUrl?:    string;
}

export interface AvatarProgress {
  id:                    string;
  userId:                string;
  currentLevel:          number;
  totalHealthyDecisions: number;
  activeStreakDays:       number;
  lastActivityDate?:     string;
  updatedAt:             string;
}

// ─── Weekly Summary ───────────────────────────────────────────
export interface WeeklySummary {
  id:                   string;
  userId:               string;
  weekStart:            string;
  weekEnd:              string;
  totalSuggestions:     number;
  acceptedSuggestions:  number;
  discardedSuggestions: number;
  isExamWeek:           boolean;
  reflectiveMessage?:   string;
}
