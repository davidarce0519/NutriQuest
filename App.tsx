import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { AppNavigator }         from './src/presentation/navigation/AppNavigator';
import { useAuthStore }         from './src/infrastructure/stores/authStore';
import { useNotificationStore } from './src/infrastructure/stores/notificationStore';
import { authRepository }       from './src/data/repositories/authRepository';
import { getNotificationSettingsUseCase } from './src/domain/usecases/notifications';

export default function App() {
  const { setUser, setHydrated }  = useAuthStore();
  const { setSettings, clear: clearSettings } = useNotificationStore();

  useEffect(() => {
    const { data: { subscription } } = authRepository.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const profile = await authRepository.getProfile(session.user.id);
            setUser(profile);
            // Cargar settings de notificaciones junto con el perfil
            try {
              const settings = await getNotificationSettingsUseCase(session.user.id);
              setSettings(settings);
            } catch {
              // no crítico — ThemeContext y ProfileScreen usan defaults
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
          clearSettings();
        }
        setHydrated(true);
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  return <AppNavigator />;
}
