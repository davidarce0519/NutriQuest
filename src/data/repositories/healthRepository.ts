import { supabase } from '../supabase/supabaseClient';
import { HealthProfile, HealthMeasurement } from '../../domain/models';

const mapProfile = (d: any): HealthProfile => ({
  id:                    d.id,
  userId:                d.user_id,
  birthDate:             d.birth_date,
  biologicalSex:         d.biological_sex,
  heightCm:              d.height_cm,
  weightKg:              d.weight_kg,
  bmi:                   d.bmi,
  bmiCategory:           d.bmi_category,
  physicalActivityLevel: d.physical_activity_level,
  hasMedicalConditions:  d.has_medical_conditions,
  medicalConditionsNotes: d.medical_conditions_notes,
  nutritionalGoal:       d.nutritional_goal,
  dailyWaterGlasses:     d.daily_water_glasses,
  avgSleepHours:         d.avg_sleep_hours,
  dietType:              d.diet_type,
  currentSemester:       d.current_semester,
  academicLoad:          d.academic_load,
  lastUpdatedAt:         d.last_updated_at,
});

const mapMeasurement = (d: any): HealthMeasurement => ({
  id:            d.id,
  userId:        d.user_id,
  measuredAt:    d.measured_at,
  weightKg:      d.weight_kg,
  heightCm:      d.height_cm,
  bmi:           d.bmi,
  bmiCategory:   d.bmi_category,
  bodyFatPct:    d.body_fat_pct,
  muscleMassKg:  d.muscle_mass_kg,
  waistCm:       d.waist_cm,
  hipCm:         d.hip_cm,
  waistHipRatio: d.waist_hip_ratio,
  energyLevel:   d.energy_level,
  stressLevel:   d.stress_level,
  sleepHours:    d.sleep_hours,
  waterGlasses:  d.water_glasses,
  isExamPeriod:  d.is_exam_period,
  notes:         d.notes,
  createdAt:     d.created_at,
});

export const healthRepository = {
  async getProfile(userId: string): Promise<HealthProfile> {
    const { data, error } = await supabase
      .from('health_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return mapProfile(data);
  },

  async upsertProfile(userId: string, profile: Partial<HealthProfile>): Promise<HealthProfile> {
    const { data, error } = await supabase
      .from('health_profiles')
      .upsert({
        user_id:                   userId,
        birth_date:                profile.birthDate,
        biological_sex:            profile.biologicalSex,
        height_cm:                 profile.heightCm,
        weight_kg:                 profile.weightKg,
        physical_activity_level:   profile.physicalActivityLevel,
        has_medical_conditions:    profile.hasMedicalConditions,
        medical_conditions_notes:  profile.medicalConditionsNotes,
        nutritional_goal:          profile.nutritionalGoal,
        daily_water_glasses:       profile.dailyWaterGlasses,
        avg_sleep_hours:           profile.avgSleepHours,
        diet_type:                 profile.dietType,
        current_semester:          profile.currentSemester,
        academic_load:             profile.academicLoad,
      })
      .select()
      .single();
    if (error) throw error;
    return mapProfile(data);
  },

  async addMeasurement(userId: string, m: Partial<HealthMeasurement>): Promise<HealthMeasurement> {
    const { data, error } = await supabase
      .from('health_measurements')
      .insert({
        user_id:       userId,
        measured_at:   m.measuredAt ?? new Date().toISOString().split('T')[0],
        weight_kg:     m.weightKg,
        height_cm:     m.heightCm,
        body_fat_pct:  m.bodyFatPct,
        muscle_mass_kg: m.muscleMassKg,
        waist_cm:      m.waistCm,
        hip_cm:        m.hipCm,
        energy_level:  m.energyLevel,
        stress_level:  m.stressLevel,
        sleep_hours:   m.sleepHours,
        water_glasses: m.waterGlasses,
        is_exam_period: m.isExamPeriod ?? false,
        notes:         m.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMeasurement(data);
  },

  async getMeasurements(userId: string, limit = 20): Promise<HealthMeasurement[]> {
    const { data, error } = await supabase
      .from('health_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map(mapMeasurement);
  },
};
