import { notificationSettingsRepository } from '../../../data/repositories/notificationSettingsRepository';
import {
  registerForPushNotificationsAsync,
  scheduleDailySuggestionNotification,
  cancelAllNotifications,
  checkAndResumeNotifications,
} from '../../../infrastructure/notifications/notificationService';
import { NotificationSettings } from '../../models';

export const getNotificationSettingsUseCase = async (
  userId: string,
): Promise<NotificationSettings> => {
  return notificationSettingsRepository.getSettings(userId);
};

export const updateDarkModeUseCase = async (
  userId: string,
  darkModeAuto: boolean,
  darkModeManual: boolean,
): Promise<NotificationSettings> => {
  return notificationSettingsRepository.updateSettings(userId, {
    darkModeAuto,
    darkModeManual,
  });
};

export const updateNotificationsEnabledUseCase = async (
  userId: string,
  enabled: boolean,
): Promise<NotificationSettings> => {
  return notificationSettingsRepository.updateSettings(userId, {
    notificationsEnabled: enabled,
  });
};

export const pauseNotificationsUseCase = async (
  userId: string,
  until?: Date,
): Promise<NotificationSettings> => {
  await cancelAllNotifications();
  return notificationSettingsRepository.updateSettings(userId, {
    notificationsPaused: true,
    notificationsPausedUntil: until?.toISOString() ?? null,
  });
};

export const resumeNotificationsUseCase = async (
  userId: string,
  notificationHour: number,
  currentExpoId?: string | null,
): Promise<NotificationSettings> => {
  const newId = await scheduleDailySuggestionNotification(notificationHour, currentExpoId);
  return notificationSettingsRepository.updateSettings(userId, {
    notificationsPaused: false,
    notificationsPausedUntil: null,
    expoNotificationId: newId,
  });
};

export const initializeNotificationsUseCase = async (
  userId: string,
  settings: NotificationSettings,
): Promise<string | null> => {
  const token = await registerForPushNotificationsAsync();

  if (token && token !== settings.pushToken) {
    await notificationSettingsRepository.savePushToken(userId, token);
  }

  if (settings.notificationsEnabled && !settings.notificationsPaused) {
    const newId = await scheduleDailySuggestionNotification(
      settings.notificationHour,
      settings.expoNotificationId,
    );
    await notificationSettingsRepository.saveExpoNotificationId(userId, newId);
  }

  return token;
};

export const updateNotificationHourUseCase = async (
  userId: string,
  hour: number,
  currentExpoId?: string | null,
): Promise<NotificationSettings> => {
  const newId = await scheduleDailySuggestionNotification(hour, currentExpoId);
  return notificationSettingsRepository.updateSettings(userId, {
    notificationHour: hour,
    expoNotificationId: newId,
  });
};

export const checkAndResumeIfExpiredUseCase = (settings: NotificationSettings): boolean => {
  return checkAndResumeNotifications(settings);
};

// Evalúa si el modo oscuro debe estar activo ahora mismo
// basándose en los settings del usuario. No importa de infrastructure.
export const isDarkModeActiveUseCase = (settings: NotificationSettings): boolean => {
  if (settings.darkModeManual) return true;
  if (settings.darkModeAuto) {
    const hour = new Date().getHours();
    const { darkModeStartHour: start, darkModeEndHour: end } = settings;
    // Rango nocturno (ej. 19 → 6): cruza la medianoche
    if (start > end) return hour >= start || hour < end;
    return hour >= start && hour < end;
  }
  return false;
};
