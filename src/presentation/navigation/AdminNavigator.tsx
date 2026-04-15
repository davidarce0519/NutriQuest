import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { AnalyticsScreen } from '../screens/admin/AnalyticsScreen';
import { Colors } from '../../infrastructure/theme';

export type AdminTabParams = {
  Usuarios: undefined;
  Analytics: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParams>();

export const AdminNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155', paddingBottom: 5 },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#64748b',
    }}
  >
    <Tab.Screen name="Usuarios" component={UsersScreen} options={{ tabBarLabel: 'Usuarios' }} />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
  </Tab.Navigator>
);