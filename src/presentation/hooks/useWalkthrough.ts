import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalkthroughStore } from '../../infrastructure/stores/walkthroughStore';

export interface WalkthroughStep {
  id: string;
  screen: 'Inicio' | 'Sugerencia' | 'Progreso' | 'Historial' | 'Perfil';
  title: string;
  description: string;
  icon: string;
  position: 'top' | 'bottom';
  refKey: string;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'home_hero',
    screen: 'Inicio',
    title: 'Tu sugerencia del día',
    description: 'Aquí aparece tu recomendación nutricional personalizada. Tócala para ver detalles y decidir.',
    icon: '🥗',
    position: 'bottom',
    refKey: 'heroCard',
  },
  {
    id: 'home_progress',
    screen: 'Inicio',
    title: 'Tu progreso y racha',
    description: 'Aquí ves tu avatar evolucionando y los días consecutivos de buenas decisiones.',
    icon: '🏆',
    position: 'bottom',
    refKey: 'progressRow',
  },
  {
    id: 'home_quick',
    screen: 'Inicio',
    title: 'Accesos rápidos',
    description: 'Accede al Juego AR, tu historial y perfil con un solo toque.',
    icon: '⚡',
    position: 'bottom',
    refKey: 'quickGrid',
  },
  {
    id: 'suggestion_intro',
    screen: 'Sugerencia',
    title: 'Tab de Sugerencias',
    description: 'Aquí recibes hasta 3 sugerencias personalizadas por sesión.',
    icon: '🃏',
    position: 'bottom',
    refKey: 'centerArea',
  },
  {
    id: 'progress_avatar',
    screen: 'Progreso',
    title: 'Tu avatar',
    description: 'Tu personaje cambia según tu IMC y hábitos. ¡Cuídate y verás cómo evoluciona!',
    icon: '🌱',
    position: 'bottom',
    refKey: 'avatarCard',
  },
  {
    id: 'progress_stats',
    screen: 'Progreso',
    title: 'Tus estadísticas',
    description: 'Decisiones saludables, días de racha y nivel actual. Todo en un vistazo.',
    icon: '📊',
    position: 'bottom',
    refKey: 'statsRow',
  },
  {
    id: 'history_summary',
    screen: 'Historial',
    title: 'Tu resumen',
    description: 'Porcentaje de aceptación total y gráfica semanal de tus decisiones.',
    icon: '📈',
    position: 'bottom',
    refKey: 'summaryCard',
  },
  {
    id: 'history_list',
    screen: 'Historial',
    title: 'Historial detallado',
    description: 'Cada sugerencia que recibiste. Toca cualquiera para ver la receta completa.',
    icon: '📋',
    position: 'top',
    refKey: 'filterRow',
  },
  {
    id: 'profile_biometrics',
    screen: 'Perfil',
    title: 'Tus datos de salud',
    description: 'Peso, talla y objetivo nutricional. Mantenlos actualizados para mejores sugerencias.',
    icon: '⚖️',
    position: 'bottom',
    refKey: 'biometricsCard',
  },
  {
    id: 'profile_config',
    screen: 'Perfil',
    title: 'Configuración',
    description: 'Modo oscuro, notificaciones y más. Todo personalizable según tus preferencias.',
    icon: '⚙️',
    position: 'top',
    refKey: 'configCard',
  },
];

export const useWalkthrough = () => {
  const { stepIndex, setActive, setStepIndex, setMeasure } = useWalkthroughStore();

  const startWalkthrough = useCallback(() => {
    setStepIndex(0);
    setMeasure(null);
    setActive(true);
  }, [setActive, setStepIndex, setMeasure]);

  const skipWalkthrough = useCallback(async () => {
    setActive(false);
    setMeasure(null);
    await AsyncStorage.setItem('home_walkthrough_done', 'true').catch(() => {});
  }, [setActive, setMeasure]);

  const nextStep = useCallback((navigation: any) => {
    const next = stepIndex + 1;
    if (next >= WALKTHROUGH_STEPS.length) {
      skipWalkthrough();
      return;
    }
    const currentScreen = WALKTHROUGH_STEPS[stepIndex].screen;
    const nextScreen    = WALKTHROUGH_STEPS[next].screen;
    setMeasure(null);
    setStepIndex(next);
    if (nextScreen !== currentScreen) {
      navigation.navigate(nextScreen);
    }
  }, [stepIndex, skipWalkthrough, setMeasure, setStepIndex]);

  return { startWalkthrough, skipWalkthrough, nextStep };
};
