import { authRepository } from '../../../data/repositories/authRepository';

export const loginUseCase = async (email: string, password: string) => {
  if (!email || !password) throw new Error('Email y contraseña son requeridos');
  return authRepository.login(email.trim().toLowerCase(), password);
};

export const registerUseCase = async (
  email: string,
  password: string,
  fullName: string,
  role: 'estudiante' | 'nutricionista' = 'estudiante'
) => {
  if (!email || !password || !fullName) throw new Error('Todos los campos son requeridos');
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
  return authRepository.register(email.trim().toLowerCase(), password, fullName.trim(), role);
};

export const logoutUseCase = async () => {
  return authRepository.logout();
};

export const getSessionUseCase = async () => {
  return authRepository.getSession();
};

export const getProfileUseCase = async (userId: string) => {
  return authRepository.getProfile(userId);
};

export const acceptDataConsentUseCase = async (userId: string) => {
  return authRepository.updateDataConsent(userId, true);
};