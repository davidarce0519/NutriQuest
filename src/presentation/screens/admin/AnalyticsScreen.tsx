import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';

export const AnalyticsScreen = () => {
  const { isDark } = useTheme();
  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <SafeAreaView style={[s.container, { backgroundColor: bg }]}>
      <View style={s.inner}>
        <Text style={[s.title, { color: textPrimary }]}>Analytics</Text>
        <Text style={[s.sub, { color: textSecondary }]}>Métricas globales — próximamente</Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  inner:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title:     { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub:       { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});
