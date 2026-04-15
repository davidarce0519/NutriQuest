import { avatarRepository } from '../../../data/repositories/avatarRepository';

export const getProgressUseCase = async (userId: string) => {
  return avatarRepository.getProgress(userId);
};

export const getAvatarLevelsUseCase = async () => {
  return avatarRepository.getLevels();
};

export const getLevelHistoryUseCase = async (userId: string) => {
  return avatarRepository.getLevelHistory(userId);
};
