import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UsersScreen }     from '../screens/admin/UsersScreen';
import { AnalyticsScreen } from '../screens/admin/AnalyticsScreen';
import { useTheme } from '../../infrastructure/theme/ThemeContext';

export type AdminTabParams = {
  Usuarios:  undefined;
  Analytics: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParams>();

export const AdminNavigator = () => {
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
      <Tab.Screen name="Usuarios"  component={UsersScreen}     options={{ tabBarLabel: 'Usuarios' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
    </Tab.Navigator>
  );
};
