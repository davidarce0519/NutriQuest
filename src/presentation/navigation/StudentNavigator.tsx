import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen }       from '../screens/student/HomeScreen';
import { SuggestionScreen } from '../screens/student/SuggestionScreen';
import { ProgressScreen }   from '../screens/student/ProgressScreen';
import { HistoryScreen }    from '../screens/student/HistoryScreen';
import { ProfileScreen }    from '../screens/student/ProfileScreen';

export type StudentTabParams = {
  Inicio:     undefined;
  Sugerencia: undefined;
  Progreso:   undefined;
  Historial:  undefined;
  Perfil:     undefined;
};

const Tab = createBottomTabNavigator<StudentTabParams>();

const TABS = [
  { name: 'Inicio',     icon: '🏠', label: 'Inicio' },
  { name: 'Sugerencia', icon: '🍎', label: 'Sugerencia' },
  { name: 'Progreso',   icon: '🌱', label: 'Progreso' },
  { name: 'Historial',  icon: '📊', label: 'Historial' },
  { name: 'Perfil',     icon: '👤', label: 'Perfil' },
];

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';
const BG         = '#f5f5f0';

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      s.wrapper,
      { paddingBottom: Math.max(insets.bottom, 8) }
    ]}>
      <View style={s.bar}>
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
              <View style={[s.indicator, isFocused && s.indicatorActive]} />
              <View style={[s.iconWrap, isFocused && s.iconWrapActive]}>
                <Text style={{ fontSize: isFocused ? 22 : 20 }}>
                  {tab.icon}
                </Text>
              </View>
              <Text style={[s.label, isFocused && s.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const StudentNavigator = () => (
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

const s = StyleSheet.create({
  wrapper: {
    backgroundColor:   BG,
    paddingHorizontal: 16,
    paddingTop:        8,
    borderTopWidth:    1,
    borderTopColor:    '#e2e8e0',
  },
  bar: {
    flexDirection:     'row',
    backgroundColor:   '#ffffff',
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
  indicatorActive:  { backgroundColor: GREEN },
  iconWrap: {
    width:           42,
    height:          42,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive:   { backgroundColor: GREEN + '18' },
  label:            { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
  labelActive:      { color: GREEN_DARK, fontWeight: '800' },
});