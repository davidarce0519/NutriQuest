import { healthRepository } from '../../../data/repositories/healthRepository';
import { HealthProfile, HealthMeasurement } from '../../models';

export const getHealthProfileUseCase = async (userId: string): Promise<HealthProfile> => {
  return healthRepository.getProfile(userId);
};

export const saveHealthProfileUseCase = async (
  userId: string,
  profile: Partial<HealthProfile>
): Promise<HealthProfile> => {
  return healthRepository.upsertProfile(userId, profile);
};

export const addMeasurementUseCase = async (
  userId: string,
  measurement: Partial<HealthMeasurement>
): Promise<HealthMeasurement> => {
  return healthRepository.addMeasurement(userId, measurement);
};

export const getMeasurementsUseCase = async (
  userId: string,
  limit?: number
): Promise<HealthMeasurement[]> => {
  return healthRepository.getMeasurements(userId, limit);
};

// Calcula el IMC localmente (antes de guardar, para mostrarlo al usuario)
export const calculateBmiUseCase = (weightKg: number, heightCm: number): { bmi: number; category: string } => {
  if (!weightKg || !heightCm || heightCm === 0) throw new Error('Datos insuficientes para calcular IMC');
  const bmi = parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(2));
  const category =
    bmi < 18.5 ? 'Bajo peso' :
    bmi < 25   ? 'Normal'    :
    bmi < 30   ? 'Sobrepeso' : 'Obesidad';
  return { bmi, category };
};
