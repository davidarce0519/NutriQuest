import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../infrastructure/theme/ThemeContext';
import { Food } from '../../domain/models';
import { HomeScreen }         from '../screens/student/HomeScreen';
import { SuggestionScreen }   from '../screens/student/SuggestionScreen';
import { ProgressScreen }     from '../screens/student/ProgressScreen';
import { HistoryScreen }      from '../screens/student/HistoryScreen';
import { ProfileScreen }      from '../screens/student/ProfileScreen';
import { FoodDetailScreen }   from '../screens/student/FoodDetailScreen';

export type StudentStackParams = {
  StudentTabs:     undefined;
  DetalleAlimento: { food: Food; suggestionId?: string };
};

export type StudentTabParams = {
  Inicio:     undefined;
  Sugerencia: undefined;
  Progreso:   undefined;
  Historial:  undefined;
  Perfil:     undefined;
};

const Stack = createNativeStackNavigator<StudentStackParams>();
const Tab   = createBottomTabNavigator<StudentTabParams>();

const TABS = [
  { name: 'Inicio',     icon: '🏠', label: 'Inicio' },
  { name: 'Sugerencia', icon: '🍎', label: 'Sugerencia' },
  { name: 'Progreso',   icon: '🌱', label: 'Progreso' },
  { name: 'Historial',  icon: '📊', label: 'Historial' },
  { name: 'Perfil',     icon: '👤', label: 'Perfil' },
];

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const bg        = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg    = isDark ? '#1e293b' : '#ffffff';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const green     = isDark ? '#22c55e' : '#1a6b0a';
  const greenDark = isDark ? '#16a34a' : '#042901';
  const greenLight= isDark ? '#4ade80' : '#c1d9b7';
  const textMuted = isDark ? '#475569' : '#94a3b8';

  return (
    <View style={[
      s.wrapper,
      {
        backgroundColor: bg,
        borderTopColor:  border,
        paddingBottom:   Math.max(insets.bottom, 8),
      },
    ]}>
      <View style={[s.bar, { backgroundColor: cardBg }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find(t => t.name === route.name)!;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={s.tabBtn}
              activeOpacity={0.7}
            >
              <View style={[
                s.indicator,
                isFocused && { backgroundColor: green },
              ]} />
              <View style={[
                s.iconWrap,
                isFocused && { backgroundColor: isDark ? green + '33' : green + '18' },
              ]}>
                <Text style={{ fontSize: isFocused ? 22 : 20 }}>
                  {tab.icon}
                </Text>
              </View>
              <Text style={[
                s.label,
                { color: textMuted },
                isFocused && { color: isDark ? greenLight : greenDark, fontWeight: '800' },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const StudentTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Inicio"     component={HomeScreen} />
    <Tab.Screen name="Sugerencia" component={SuggestionScreen} />
    <Tab.Screen name="Progreso"   component={ProgressScreen} />
    <Tab.Screen name="Historial"  component={HistoryScreen} />
    <Tab.Screen name="Perfil"     component={ProfileScreen} />
  </Tab.Navigator>
);

export const StudentNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="StudentTabs"     component={StudentTabs} />
    <Stack.Screen name="DetalleAlimento" component={FoodDetailScreen} />
  </Stack.Navigator>
);

const s = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop:        8,
    borderTopWidth:    1,
  },
  bar: {
    flexDirection:     'row',
    borderRadius:      20,
    paddingVertical:   6,
    paddingHorizontal: 4,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.06,
    shadowRadius:      12,
    elevation:         6,
  },
  tabBtn: {
    flex:       1,
    alignItems: 'center',
    gap:        2,
    paddingTop: 2,
  },
  indicator: {
    width:           20,
    height:          3,
    borderRadius:    2,
    backgroundColor: 'transparent',
    marginBottom:    4,
  },
  iconWrap: {
    width:           42,
    height:          42,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'transparent',
  },
  label: { fontSize: 10, fontWeight: '600' },
});
