import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FoodCatalogScreen } from '../screens/nutritionist/FoodCatalogScreen';
import { StudentListScreen } from '../screens/nutritionist/StudentListScreen';
import { useTheme } from '../../infrastructure/theme/ThemeContext';

export type NutritionistTabParams = {
  Catalogo:    undefined;
  Estudiantes: undefined;
};

const Tab = createBottomTabNavigator<NutritionistTabParams>();

export const NutritionistNavigator = () => {
  const { isDark } = useTheme();
  const cardBg    = isDark ? '#1e293b' : '#ffffff';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const green     = isDark ? '#22c55e' : '#1a6b0a';
  const textMuted = isDark ? '#475569' : '#94a3b8';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             { backgroundColor: cardBg, borderTopColor: border, paddingBottom: 5 },
        tabBarActiveTintColor:   green,
        tabBarInactiveTintColor: textMuted,
      }}
    >
      <Tab.Screen name="Catalogo"    component={FoodCatalogScreen} options={{ tabBarLabel: 'Catálogo' }} />
      <Tab.Screen name="Estudiantes" component={StudentListScreen} options={{ tabBarLabel: 'Estudiantes' }} />
    </Tab.Navigator>
  );
};
