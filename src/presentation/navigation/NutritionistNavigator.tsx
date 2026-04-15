import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FoodCatalogScreen } from '../screens/nutritionist/FoodCatalogScreen';
import { StudentListScreen } from '../screens/nutritionist/StudentListScreen';
import { Colors } from '../../infrastructure/theme';

export type NutritionistTabParams = {
  Catalogo:    undefined;
  Estudiantes: undefined;
};

const Tab = createBottomTabNavigator<NutritionistTabParams>();

export const NutritionistNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown:             false,
      tabBarStyle:             { backgroundColor: Colors.bgCard, borderTopColor: Colors.border, paddingBottom: 5 },
      tabBarActiveTintColor:   Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
    }}
  >
    <Tab.Screen name="Catalogo"    component={FoodCatalogScreen} options={{ tabBarLabel: 'Catálogo' }} />
    <Tab.Screen name="Estudiantes" component={StudentListScreen} options={{ tabBarLabel: 'Estudiantes' }} />
  </Tab.Navigator>
);
