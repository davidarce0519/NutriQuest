import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NotificationSettings } from '../../domain/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const BODIES = [
  '¿Ya pensaste en qué comer hoy? Tenemos una sugerencia para ti 🌿',
  'Tu momento de cuidarte llegó. Revisa tu sugerencia del día 💚',
  'Pequeñas decisiones, grandes hábitos. ¿Qué comemos hoy? 🥗',
  'Tu cuerpo te lo agradecerá. Mira tu sugerencia personalizada ⚡',
  'NutriQuest tiene algo especial para ti hoy 🌱',
];

const getRandomNotificationBody = (): string =>
  BODIES[Math.floor(Math.random() * BODIES.length)];

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sugerencias', {
      name: 'Sugerencias NutriQuest',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a6b0a',
    });
  }

  type ExtraConfig = { eas?: { projectId?: string } };
  const projectId: string =
    (Constants.expoConfig?.extra as ExtraConfig | undefined)?.eas?.projectId ??
    'nutriquest';

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
};

export const scheduleDailySuggestionNotification = async (
  hour: number,
  existingId?: string | null,
): Promise<string> => {
  if (existingId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch { /* already cancelled */ }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍎 NutriQuest — Sugerencia para ti',
      body: getRandomNotificationBody(),
      data: { screen: 'Sugerencia' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });

  return id;
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const setupNotificationListeners = (
  navigationRef: React.RefObject<{ navigate: (screen: string) => void }>,
): (() => void) => {
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen as string | undefined;
    if (screen === 'Sugerencia') {
      navigationRef.current?.navigate('Sugerencia');
    }
  });

  return () => {
    responseSub.remove();
  };
};

export const checkAndResumeNotifications = (settings: NotificationSettings): boolean => {
  if (!settings.notificationsPaused || !settings.notificationsPausedUntil) return false;
  return new Date() >= new Date(settings.notificationsPausedUntil);
};
