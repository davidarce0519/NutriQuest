import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { useAuthStore } from './src/infrastructure/stores/authStore';
import { authRepository } from './src/data/repositories/authRepository';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, setHydrated } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = authRepository.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const profile = await authRepository.getProfile(session.user.id);
            setUser(profile);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setHydrated(true);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
