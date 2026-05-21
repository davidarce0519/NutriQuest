import { authRepository } from '../../../data/repositories/authRepository';
import { User, UserRole } from '../../models';

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

export const deleteUserDataUseCase = async (userId: string): Promise<void> => {
  if (!userId) throw new Error('Usuario requerido');
  return authRepository.deleteUserData(userId);
};

export const deleteAccountUseCase = async (): Promise<void> => {
  await authRepository.deleteAccount();
};

export const getStudentProfilesUseCase = async (): Promise<User[]> => {
  return authRepository.getStudentProfiles();
};

export const getAllUsersUseCase = async (): Promise<User[]> => {
  return authRepository.getAllUsers();
};

export const changeUserRoleUseCase = async (userId: string, role: UserRole): Promise<void> => {
  if (!userId || !role) throw new Error('Usuario y rol son requeridos');
  return authRepository.changeUserRole(userId, role);
};

export const toggleUserActiveUseCase = async (userId: string, isActive: boolean): Promise<void> => {
  if (!userId) throw new Error('Usuario requerido');
  return authRepository.toggleUserActive(userId, isActive);
};

export const getActiveUsersCountUseCase = async (): Promise<number> => {
  return authRepository.getActiveUsersCount();
};

export const completeOnboardingUseCase = async (userId: string): Promise<void> => {
  await authRepository.completeOnboarding(userId);
};

export const resetOnboardingUseCase = async (userId: string): Promise<void> => {
  await authRepository.resetOnboarding(userId);
};