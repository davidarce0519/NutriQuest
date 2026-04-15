import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore }          from '../../infrastructure/stores/authStore';
import { AuthNavigator }         from './AuthNavigator';
import { StudentNavigator }      from './StudentNavigator';
import { NutritionistNavigator } from './NutritionistNavigator';
import { AdminNavigator }        from './AdminNavigator';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth"         component={AuthNavigator} />
        ) : user.role === 'estudiante' ? (
          <Stack.Screen name="Student"      component={StudentNavigator} />
        ) : user.role === 'nutricionista' ? (
          <Stack.Screen name="Nutritionist" component={NutritionistNavigator} />
        ) : (
          <Stack.Screen name="Admin"        component={AdminNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
