import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../../infrastructure/theme';

export const AnalyticsScreen = () => (
  <SafeAreaView style={s.container}>
    <View style={s.inner}>
      <Text style={s.title}>Analytics</Text>
      <Text style={s.sub}>Métricas globales — próximamente</Text>
    </View>
  </SafeAreaView>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  inner:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  title:     { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center' },
  sub:       { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
