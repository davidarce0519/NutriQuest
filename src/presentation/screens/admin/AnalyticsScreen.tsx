import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { getSystemAnalyticsUseCase } from '../../../domain/usecases/admin';

const GREEN = '#1a6b0a';
const WHITE = '#ffffff';

const MEDAL_COLORS = ['#fbbf24', '#94a3b8', '#d97706'];
const MEDAL_LABELS = ['🥇', '🥈', '🥉'];

interface Analytics {
  roleCounts:       Record<string, number>;
  suggestionStats:  { total: number; accepted: number; acceptanceRate: number };
  activeFoods:      number;
  mostSuggested:    { foodName: string; count: number } | null;
  recentActivity:   { suggestionsLast7Days: number; suggestionsLast30Days: number; newUsersLast30Days: number };
  topFoods:         Array<{ foodName: string; count: number; acceptanceRate: number }>;
  validatedFoods:   number;
  unvalidatedFoods: number;
}

const acceptanceInterpretation = (rate: number): string => {
  if (rate >= 80) return '¡Excelente! Las sugerencias son muy bien recibidas.';
  if (rate >= 60) return 'Buena recepción. Hay oportunidad de mejora.';
  if (rate >= 40) return 'Aceptación moderada. Revisar perfil de estudiantes.';
  return 'Aceptación baja. Considerar ajustar el algoritmo.';
};

export const AnalyticsScreen = () => {
  const { isDark } = useTheme();

  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg        = isDark ? '#1e293b' : '#ffffff';
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : GREEN;
  const inputBg       = isDark ? '#334155' : '#f8fafc';

  const [analytics, setAnalytics]   = useState<Analytics | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt]   = useState<Date | null>(null);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await getSystemAnalyticsUseCase();
      setAnalytics(data as Analytics);
      setUpdatedAt(new Date());
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const roleCards = [
    { label: 'Estudiantes',    value: analytics?.roleCounts['estudiante']    ?? 0, icon: '🎓', color: '#16a34a' },
    { label: 'Nutricionistas', value: analytics?.roleCounts['nutricionista'] ?? 0, icon: '🥼', color: '#0284c7' },
    { label: 'Admins',         value: analytics?.roleCounts['superadmin']    ?? 0, icon: '👑', color: '#7c3aed' },
  ];

  const rate = analytics?.suggestionStats.acceptanceRate ?? 0;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>

      {/* Header verde redondeado */}
      <View style={[s.topStrip, { backgroundColor: green }]}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerInner}>
            <View>
              <Text style={s.headerSub}>Superadmin</Text>
              <Text style={s.headerTitle}>Analytics 📊</Text>
            </View>
            <TouchableOpacity
              style={s.refreshBtn}
              onPress={() => loadAnalytics(true)}
              disabled={refreshing}
              activeOpacity={0.7}
            >
              {refreshing
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={s.refreshIcon}>🔄</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <ActivityIndicator color={green} size="large" style={{ marginTop: 100 }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Usuarios por rol ── */}
          <Text style={[s.sectionTitle, { color: textMuted }]}>Usuarios por rol</Text>
          <View style={s.roleRow}>
            {roleCards.map(card => (
              <View key={card.label} style={[s.roleCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={s.roleIcon}>{card.icon}</Text>
                <Text style={[s.roleValue, { color: card.color }]}>{card.value}</Text>
                <Text style={[s.roleLabel, { color: textMuted }]}>{card.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Sugerencias ── */}
          <Text style={[s.sectionTitle, { color: textMuted }]}>Sugerencias</Text>
          <View style={[s.bigCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={s.bigCardRow}>
              <View style={s.bigStat}>
                <Text style={s.bigStatIcon}>📨</Text>
                <Text style={[s.bigStatValue, { color: green }]}>
                  {analytics?.suggestionStats.total ?? 0}
                </Text>
                <Text style={[s.bigStatLabel, { color: textMuted }]}>Generadas</Text>
              </View>
              <View style={[s.bigStatDivider, { backgroundColor: border }]} />
              <View style={s.bigStat}>
                <Text style={s.bigStatIcon}>✅</Text>
                <Text style={[s.bigStatValue, { color: '#16a34a' }]}>
                  {analytics?.suggestionStats.accepted ?? 0}
                </Text>
                <Text style={[s.bigStatLabel, { color: textMuted }]}>Aceptadas</Text>
              </View>
              <View style={[s.bigStatDivider, { backgroundColor: border }]} />
              <View style={s.bigStat}>
                <Text style={s.bigStatIcon}>📈</Text>
                <Text style={[s.bigStatValue, { color: '#0284c7' }]}>{rate}%</Text>
                <Text style={[s.bigStatLabel, { color: textMuted }]}>Aceptación</Text>
              </View>
            </View>

            {/* Barra de aceptación */}
            <View style={[s.barTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <View style={[
                s.barFill,
                {
                  width: `${Math.min(rate, 100)}%` as `${number}%`,
                  backgroundColor: rate >= 60 ? '#22c55e' : rate >= 40 ? '#eab308' : '#ef4444',
                },
              ]} />
            </View>
            <Text style={[s.barInterpret, { color: textSecondary }]}>
              {acceptanceInterpretation(rate)}
            </Text>
          </View>

          {/* ── Actividad reciente ── */}
          {analytics?.recentActivity && (
            <>
              <Text style={[s.sectionTitle, { color: textMuted }]}>Actividad reciente</Text>
              <View style={[s.activityCard, { backgroundColor: cardBg, borderColor: border }]}>
                {[
                  {
                    icon: '📅',
                    label: 'Sugerencias (últimos 7 días)',
                    value: analytics.recentActivity.suggestionsLast7Days,
                    color: '#0284c7',
                  },
                  {
                    icon: '📆',
                    label: 'Sugerencias (últimos 30 días)',
                    value: analytics.recentActivity.suggestionsLast30Days,
                    color: green,
                  },
                  {
                    icon: '👤',
                    label: 'Nuevos usuarios (30 días)',
                    value: analytics.recentActivity.newUsersLast30Days,
                    color: '#7c3aed',
                  },
                ].map((item, i, arr) => (
                  <View key={item.label}>
                    <View style={s.activityRow}>
                      <Text style={s.activityIcon}>{item.icon}</Text>
                      <Text style={[s.activityLabel, { color: textSecondary }]}>{item.label}</Text>
                      <Text style={[s.activityValue, { color: item.color }]}>{item.value}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={[s.activityDivider, { backgroundColor: border }]} />
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Top 3 alimentos ── */}
          {analytics?.topFoods && analytics.topFoods.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { color: textMuted }]}>Top 3 alimentos más sugeridos</Text>
              <View style={[s.topFoodsCard, { backgroundColor: cardBg, borderColor: border }]}>
                {analytics.topFoods.map((food, i) => (
                  <View key={food.foodName}>
                    <View style={s.topFoodRow}>
                      <View style={[s.medalCircle, { backgroundColor: MEDAL_COLORS[i] + '22' }]}>
                        <Text style={s.medalText}>{MEDAL_LABELS[i]}</Text>
                      </View>
                      <View style={s.topFoodInfo}>
                        <Text style={[s.topFoodName, { color: textPrimary }]} numberOfLines={1}>
                          {food.foodName}
                        </Text>
                        <Text style={[s.topFoodMeta, { color: textSecondary }]}>
                          {food.count} sugerencias · {food.acceptanceRate}% aceptación
                        </Text>
                        {/* Mini barra de aceptación */}
                        <View style={[s.topFoodBarTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                          <View style={[
                            s.topFoodBarFill,
                            {
                              width: `${Math.min(food.acceptanceRate, 100)}%` as `${number}%`,
                              backgroundColor: MEDAL_COLORS[i],
                            },
                          ]} />
                        </View>
                      </View>
                    </View>
                    {i < analytics.topFoods.length - 1 && (
                      <View style={[s.activityDivider, { backgroundColor: border }]} />
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Catálogo ── */}
          <Text style={[s.sectionTitle, { color: textMuted }]}>Catálogo de alimentos</Text>
          <View style={[s.catalogCard, { backgroundColor: cardBg, borderColor: border }]}>
            {[
              { label: 'Activos',       value: analytics?.activeFoods      ?? 0, color: green,     icon: '🟢' },
              { label: 'Validados',     value: analytics?.validatedFoods   ?? 0, color: '#0284c7', icon: '✅' },
              { label: 'Sin validar',   value: analytics?.unvalidatedFoods ?? 0, color: '#eab308', icon: '⏳' },
            ].map((item, i, arr) => (
              <View key={item.label} style={[s.catalogItem, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: border }]}>
                <Text style={s.catalogItemIcon}>{item.icon}</Text>
                <Text style={[s.catalogItemValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[s.catalogItemLabel, { color: textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Timestamp */}
          {updatedAt && (
            <Text style={[s.updatedAt, { color: textMuted }]}>
              Actualizado: {updatedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              {' · '}{updatedAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </Text>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topStrip: {
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    paddingHorizontal: 20, paddingBottom: 18,
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  headerInner: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingTop: 10,
  },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: WHITE, fontSize: 28, fontWeight: '900' },
  refreshBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshIcon: { fontSize: 18 },

  scroll:       { padding: 18, paddingTop: 24, gap: 10, paddingBottom: 50 },
  sectionTitle: {
    fontSize: 12, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8,
  },

  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 14,
    alignItems: 'center', gap: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  roleIcon:  { fontSize: 22 },
  roleValue: { fontSize: 28, fontWeight: '900' },
  roleLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  bigCard: {
    borderRadius: 20, borderWidth: 1, padding: 18, gap: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  bigCardRow:     { flexDirection: 'row', alignItems: 'center' },
  bigStat:        { flex: 1, alignItems: 'center', gap: 4 },
  bigStatDivider: { width: 1, height: 60 },
  bigStatIcon:    { fontSize: 20 },
  bigStatValue:   { fontSize: 28, fontWeight: '900' },
  bigStatLabel:   { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill:  { height: 10, borderRadius: 5 },
  barInterpret: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  activityCard: {
    borderRadius: 20, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  activityIcon:    { fontSize: 18, flexShrink: 0 },
  activityLabel:   { flex: 1, fontSize: 13, fontWeight: '600' },
  activityValue:   { fontSize: 22, fontWeight: '900' },
  activityDivider: { height: 1, marginHorizontal: 16 },

  topFoodsCard: {
    borderRadius: 20, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    overflow: 'hidden',
  },
  topFoodRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  medalCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  medalText:      { fontSize: 22 },
  topFoodInfo:    { flex: 1, gap: 4 },
  topFoodName:    { fontSize: 14, fontWeight: '800' },
  topFoodMeta:    { fontSize: 11, fontWeight: '600' },
  topFoodBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  topFoodBarFill:  { height: 6, borderRadius: 3 },

  catalogCard: {
    borderRadius: 20, borderWidth: 1, flexDirection: 'row',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    overflow: 'hidden',
  },
  catalogItem: {
    flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4,
  },
  catalogItemIcon:  { fontSize: 20 },
  catalogItemValue: { fontSize: 26, fontWeight: '900' },
  catalogItemLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  updatedAt: {
    fontSize: 11, fontWeight: '500',
    textAlign: 'center', marginTop: 4,
  },
});
