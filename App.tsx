import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native'; // Importamos el hook nativo
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'; // Importamos temas de navegación
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { useAuthStore } from './src/infrastructure/stores/authStore';
import { authRepository } from './src/data/repositories/authRepository';

// --- IMPORT CORRECTO SEGÚN TU ESTRUCTURA ---
import { ThemeProvider } from './src/infrastructure/theme/ThemeContext';

const queryClient = new QueryClient();

export default function App() {
  const { setUser, setHydrated } = useAuthStore();
  
  // 1. Detectamos el esquema de colores del sistema
  const colorScheme = useColorScheme();

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
      {/* 
          Pasamos el colorScheme al ThemeProvider si tu contexto lo requiere, 
          pero lo más importante es que el NavigationContainer reciba el tema.
      */}
      <ThemeProvider>
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}