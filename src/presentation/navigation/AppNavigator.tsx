import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore }               from '../../infrastructure/stores/authStore';
import { useNotificationStore }       from '../../infrastructure/stores/notificationStore';
import { ThemeProvider }              from '../../infrastructure/theme/ThemeContext';
import { setupNotificationListeners } from '../../infrastructure/notifications/notificationService';
import { AuthNavigator }              from './AuthNavigator';
import { StudentNavigator }           from './StudentNavigator';
import { NutritionistNavigator }      from './NutritionistNavigator';
import { AdminNavigator }             from './AdminNavigator';
import { OnboardingScreen }           from '../screens/onboarding/OnboardingScreen';
import {
  getNotificationSettingsUseCase,
  initializeNotificationsUseCase,
  resumeNotificationsUseCase,
  checkAndResumeIfExpiredUseCase,
} from '../../domain/usecases/notifications';

const Stack = createNativeStackNavigator();

type NavRef = NavigationContainerRef<Record<string, object | undefined>>;

const AppStack = ({ navigationRef }: { navigationRef: React.RefObject<NavRef | null> }) => {
  const user        = useAuthStore((s) => s.user);
  const { settings: notifSettings, setSettings, updateSettings } = useNotificationStore();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const initialize = async () => {
      try {
        const settings = await getNotificationSettingsUseCase(user.id);
        if (cancelled) return;
        setSettings(settings);

        if (checkAndResumeIfExpiredUseCase(settings)) {
          const updated = await resumeNotificationsUseCase(
            user.id,
            settings.notificationHour,
            settings.expoNotificationId,
          ).catch(() => null);
          if (updated && !cancelled) updateSettings(updated);
          return;
        }

        await initializeNotificationsUseCase(user.id, settings).catch(() => {});
      } catch {
        // Silencioso — las notificaciones no deben bloquear el login
      }
    };

    initialize();

    const cleanup = setupNotificationListeners(
      navigationRef as React.RefObject<{ navigate: (screen: string) => void }>,
    );

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user?.id]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth"         component={AuthNavigator} />
      ) : !user.onboardingCompleted ? (
        <Stack.Screen name="Onboarding"   component={OnboardingScreen} />
      ) : user.role === 'estudiante' ? (
        <Stack.Screen name="Student"      component={StudentNavigator} />
      ) : user.role === 'nutricionista' ? (
        <Stack.Screen name="Nutritionist" component={NutritionistNavigator} />
      ) : (
        <Stack.Screen name="Admin"        component={AdminNavigator} />
      )}
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const navigationRef = useRef<NavRef | null>(null);

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <AppStack navigationRef={navigationRef} />
      </NavigationContainer>
    </ThemeProvider>
  );
};
