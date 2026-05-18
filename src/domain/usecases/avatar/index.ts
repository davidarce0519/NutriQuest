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

export const getUnseenLevelUpsUseCase = async (userId: string) => {
  return avatarRepository.getUnseenLevelUps(userId);
};

export const markLevelUpSeenUseCase = async (levelHistoryId: string) => {
  return avatarRepository.markLevelUpSeen(levelHistoryId);
};
