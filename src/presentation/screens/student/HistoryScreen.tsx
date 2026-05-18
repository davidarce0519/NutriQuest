import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import {
  getSuggestionHistoryUseCase,
  getWeeklySummaryUseCase,
  getTopAcceptedFoodsUseCase,
} from '../../../domain/usecases/suggestion';
import { Suggestion, Food } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { StudentStackParams } from '../../navigation/StudentNavigator';

type Filter = 'todas' | 'aceptada' | 'descartada';

type WeeklySummary = {
  days: { day: string; accepted: number; discarded: number; total: number }[];
  totalAccepted: number;
  totalDiscarded: number;
  total: number;
  acceptanceRate: number;
};

type TopFood = { food: Food; count: number };

// Índice del día actual en la semana (0=Lun, 6=Dom)
const todayIndex = (() => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
})();

export const HistoryScreen = () => {
  const { isDark } = useTheme();
  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg        = isDark ? '#1e293b' : '#ffffff';
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : '#1a6b0a';
  const greenDark     = isDark ? '#16a34a' : '#042901';
  const greenLight    = isDark ? '#4ade80' : '#c1d9b7';

  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParams>>();
  const user = useAuthStore((s) => s.user);
  const [history, setHistory]             = useState<Suggestion[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<Filter>('todas');
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [topFoods, setTopFoods]           = useState<TopFood[]>([]);

  useEffect(() => {
    if (!user) return;
    getSuggestionHistoryUseCase(user.id, 50)
      .then(setHistory)
      .finally(() => setLoading(false));
    getWeeklySummaryUseCase(user.id)
      .then(setWeeklySummary)
      .catch(() => {});
    getTopAcceptedFoodsUseCase(user.id)
      .then(setTopFoods)
      .catch(() => {});
  }, [user]);

  const accepted  = history.filter(s => s.response === 'aceptada').length;
  const discarded = history.filter(s => s.response === 'descartada').length;
  const pct = history.length > 0 ? Math.round((accepted / history.length) * 100) : 0;

  const filtered = filter === 'todas'
    ? history
    : history.filter(s => s.response === filter);

  const weeklyReflection = !weeklySummary || weeklySummary.total === 0
    ? 'Acepta tu primera sugerencia para ver tu resumen semanal'
    : weeklySummary.acceptanceRate >= 70
    ? '¡Has tenido una semana increíble! Tu cuerpo lo nota 🌿'
    : weeklySummary.acceptanceRate >= 40
    ? 'Vas bien. Cada decisión suma, sin importar el tamaño 🌱'
    : 'Está bien. Mañana es una nueva oportunidad 💚';

  const maxAccepted = weeklySummary
    ? Math.max(...weeklySummary.days.map(d => d.accepted), 1)
    : 1;

  const emptyDays = Array(7).fill(null).map((_, i) => ({
    day: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
    accepted: 0, discarded: 0, total: 0,
  }));

  // ── Render item historial ──
  const renderItem = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={[s.item, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.3 : 0.06 }]}
      onPress={() => navigation.navigate('DetalleAlimento', { food: item.food, suggestionId: item.id })}
      activeOpacity={0.85}
    >
      <View style={[s.itemAccent, {
        backgroundColor:
          item.response === 'aceptada'   ? green :
          item.response === 'descartada' ? (isDark ? '#475569' : '#cbd5e1') : '#fbbf24',
      }]} />
      <View style={s.itemContent}>
        <View style={s.itemTop}>
          <Text style={[s.itemName, { color: textPrimary }]} numberOfLines={1}>
            {item.food.name}
          </Text>
          <View style={[s.badge, {
            backgroundColor:
              item.response === 'aceptada'   ? (isDark ? '#052e16' : '#f0fdf4') :
              item.response === 'descartada' ? (isDark ? '#1e293b' : '#f8fafc') :
              (isDark ? '#1c1200' : '#fffbeb'),
          }]}>
            <Text style={[s.badgeText, {
              color:
                item.response === 'aceptada'   ? '#22c55e' :
                item.response === 'descartada' ? textSecondary : '#d97706',
            }]}>
              {item.response === 'aceptada'    ? '✓ Aceptada' :
               item.response === 'descartada' ? '✕ Descartada' : '⏳ Pendiente'}
            </Text>
          </View>
        </View>
        <View style={s.itemBottom}>
          <Text style={[s.itemDate, { color: textMuted }]}>
            {new Date(item.suggestedAt).toLocaleDateString('es-CO', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          {item.food.prepTimeMinutes !== undefined && item.food.prepTimeMinutes > 0 && (
            <Text style={[s.itemMeta, { color: textMuted }]}>
              ⏱ {item.food.prepTimeMinutes} min
            </Text>
          )}
          {item.isExamPeriod && <Text style={s.examTag}>📚 Parciales</Text>}
          {item.feedback && (
            <Text style={s.feedbackTag}>
              {item.feedback === 'me_gusta' ? '👍' :
               item.feedback === 'no_me_gusta' ? '👎' : '🤷'}
            </Text>
          )}
          <Text style={[s.chevron, { color: textMuted }]}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Header del FlatList ──
  const ListHeader = (
    <View style={s.listHeader}>

      {/* Resumen global */}
      <View style={[s.summaryCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
        <View style={s.summaryLeft}>
          <Text style={[s.summaryPct, { color: textPrimary }]}>{pct}%</Text>
          <Text style={[s.summaryPctLabel, { color: textMuted }]}>aceptación total</Text>
          <View style={[s.summaryBarBg, { backgroundColor: border }]}>
            <View style={[s.summaryBarFill, { width: `${pct}%` as any, backgroundColor: green }]} />
          </View>
        </View>
        <View style={[s.summaryDivider, { backgroundColor: border }]} />
        <View style={s.summaryRight}>
          <View style={s.summaryStatRow}>
            <Text style={[s.summaryDot, { color: textMuted }]}>●</Text>
            <Text style={[s.summaryStatLabel, { color: textSecondary }]}>Total</Text>
            <Text style={[s.summaryStatValue, { color: textPrimary }]}>{history.length}</Text>
          </View>
          <View style={s.summaryStatRow}>
            <Text style={[s.summaryDot, { color: '#22c55e' }]}>●</Text>
            <Text style={[s.summaryStatLabel, { color: textSecondary }]}>Aceptadas</Text>
            <Text style={[s.summaryStatValue, { color: '#22c55e' }]}>{accepted}</Text>
          </View>
          <View style={s.summaryStatRow}>
            <Text style={[s.summaryDot, { color: textMuted }]}>●</Text>
            <Text style={[s.summaryStatLabel, { color: textSecondary }]}>Descartadas</Text>
            <Text style={[s.summaryStatValue, { color: textMuted }]}>{discarded}</Text>
          </View>
        </View>
      </View>

      {/* Esta semana — sección */}
      <Text style={[s.sectionLabel, { color: textMuted }]}>📊 Esta semana</Text>
      <View style={[s.weeklyCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.3 : 0.06 }]}>

        {/* 3 métricas */}
        <View style={s.weeklyMetrics}>
          <View style={s.weeklyMetricBlock}>
            <Text style={[s.weeklyMetricValue, { color: textPrimary }]}>
              {weeklySummary?.total ?? 0}
            </Text>
            <Text style={[s.weeklyMetricLabel, { color: textMuted }]}>sugerencias</Text>
          </View>
          <View style={[s.weeklyMetricDivider, { backgroundColor: border }]} />
          <View style={s.weeklyMetricBlock}>
            <Text style={[s.weeklyMetricValue, { color: '#22c55e' }]}>
              {weeklySummary?.totalAccepted ?? 0}
            </Text>
            <Text style={[s.weeklyMetricLabel, { color: textMuted }]}>aceptadas</Text>
          </View>
          <View style={[s.weeklyMetricDivider, { backgroundColor: border }]} />
          <View style={s.weeklyMetricBlock}>
            <Text style={[s.weeklyMetricValue, { color: green }]}>
              {weeklySummary?.acceptanceRate ?? 0}%
            </Text>
            <Text style={[s.weeklyMetricLabel, { color: textMuted }]}>aceptación</Text>
          </View>
        </View>

        {/* Gráfica de barras */}
        <View style={s.chartContainer}>
          {(weeklySummary?.days ?? emptyDays).map((day, i) => {
            const isToday = i === todayIndex;
            const barH = day.accepted > 0
              ? Math.max((day.accepted / maxAccepted) * 80, 8)
              : 4;
            return (
              <View key={i} style={s.barColumn}>
                <View style={s.barWrapper}>
                  <View style={[s.bar, {
                    height: barH,
                    backgroundColor: isToday ? green : green + '88',
                    opacity: day.accepted === 0 ? 0.35 : 1,
                  }]} />
                </View>
                <Text style={[s.barLabel, {
                  color: isToday ? green : textMuted,
                  fontWeight: isToday ? '900' : '600',
                }]}>
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Reflexión dinámica */}
      <View style={[s.reflectionCard, { backgroundColor: cardBg, borderLeftColor: green }]}>
        <Text style={[s.reflectionText, { color: textSecondary }]}>
          💬 {weeklyReflection}
        </Text>
      </View>

      {/* Filtros */}
      <View style={s.filtersRow}>
        {(['todas', 'aceptada', 'descartada'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              s.filterBtn,
              { backgroundColor: cardBg, borderColor: border },
              filter === f && { backgroundColor: greenDark, borderColor: greenDark },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[
              s.filterText, { color: textMuted },
              filter === f && { color: '#ffffff' },
            ]}>
              {f === 'todas' ? 'Todas' : f === 'aceptada' ? '✓ Aceptadas' : '✕ Descartadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Footer: Top alimentos ──
  const ListFooter = topFoods.length > 0 ? (
    <View style={[s.topFoodsCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.3 : 0.06 }]}>
      <Text style={[s.sectionLabel, { color: textMuted, marginBottom: 4 }]}>⭐ Tus favoritos</Text>
      <Text style={[s.topFoodsIntro, { color: textMuted }]}>Basado en tus últimas decisiones</Text>
      <View style={s.topFoodsList}>
        {topFoods.map((item, i) => (
          <View key={i} style={[s.topFoodRow, { borderTopWidth: i > 0 ? 1 : 0, borderColor: border }]}>
            {item.food.imageUrl ? (
              <Image source={{ uri: item.food.imageUrl }} style={s.topFoodImage} />
            ) : (
              <View style={[s.topFoodAvatar, { backgroundColor: green + '20' }]}>
                <Text style={[s.topFoodLetter, { color: green }]}>
                  {item.food.name[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[s.topFoodName, { color: textPrimary }]} numberOfLines={1}>
              {item.food.name}
            </Text>
            <View style={[s.topFoodCountPill, { backgroundColor: green + '18' }]}>
              <Text style={[s.topFoodCountText, { color: green }]}>
                {item.count}× aceptado
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  ) : null;

  if (loading) return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />
      <ActivityIndicator color="#ffffff" size="large" style={{ marginTop: 100 }} />
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />

      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={[s.headerSub, { color: greenLight }]}>Tu registro de decisiones</Text>
          <Text style={s.headerTitle}>Historial 📊</Text>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🌱</Text>
              <Text style={[s.emptyTitle, { color: textSecondary }]}>Sin registros aún</Text>
              <Text style={[s.emptySub, { color: textMuted }]}>
                Ve a Sugerencia para empezar tu historial.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 180,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },

  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8 },
  headerSub:   { fontSize: 12, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#ffffff' },

  list:       { paddingHorizontal: 18, paddingBottom: 30, gap: 10 },
  listHeader: { gap: 12, paddingTop: 4, paddingBottom: 4 },

  summaryCard: {
    borderRadius: 24, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  summaryLeft:      { flex: 1.2, gap: 4 },
  summaryPct:       { fontSize: 42, fontWeight: '900', lineHeight: 46 },
  summaryPctLabel:  { fontSize: 12, fontWeight: '600' },
  summaryBarBg: {
    height: 6, borderRadius: BorderRadius.full,
    overflow: 'hidden', marginTop: 4,
  },
  summaryBarFill:   { height: '100%', borderRadius: BorderRadius.full },
  summaryDivider:   { width: 1, height: 70 },
  summaryRight:     { flex: 1, gap: 8 },
  summaryStatRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryDot:       { fontSize: 10 },
  summaryStatLabel: { flex: 1, fontSize: 12 },
  summaryStatValue: { fontSize: 16, fontWeight: '900' },

  sectionLabel: {
    fontSize: 12, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  weeklyCard: {
    borderRadius: 20, padding: 16, gap: 14,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  weeklyMetrics:       { flexDirection: 'row', alignItems: 'center' },
  weeklyMetricBlock:   { flex: 1, alignItems: 'center', gap: 3 },
  weeklyMetricValue:   { fontSize: 24, fontWeight: '900' },
  weeklyMetricLabel: {
    fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  weeklyMetricDivider: { width: 1, height: 36 },

  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn:  { flex: 1, alignItems: 'center', gap: 6 },
  barWrapper: { height: 80, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar:        { width: '72%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barLabel:   { fontSize: 11 },

  reflectionCard: {
    borderRadius: 14, padding: 14, borderLeftWidth: 3,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  reflectionText: { fontSize: 13, lineHeight: 19 },

  filtersRow:  { flexDirection: 'row', gap: 8 },
  filterBtn: {
    flex: 1, borderRadius: BorderRadius.full,
    paddingVertical: 9, alignItems: 'center',
    borderWidth: 1.5, elevation: 2,
  },
  filterText: { fontSize: 11, fontWeight: '700' },

  item: {
    borderRadius: 18, flexDirection: 'row',
    overflow: 'hidden', elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  itemAccent:  { width: 5 },
  itemContent: { flex: 1, padding: 14, gap: 6 },
  itemTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 8,
  },
  itemName:    { fontSize: 15, fontWeight: '800', flex: 1 },
  badge:       { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { fontSize: 11, fontWeight: '700' },
  itemBottom:  { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  itemDate:    { fontSize: 12 },
  itemMeta:    { fontSize: 11 },
  examTag:     { fontSize: 11, color: '#d97706', fontWeight: '600' },
  feedbackTag: { fontSize: 14 },
  chevron:     { fontSize: 18, fontWeight: '700', marginLeft: 'auto' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub:   { fontSize: 13, textAlign: 'center' },

  topFoodsCard: {
    borderRadius: 20, padding: 16, marginTop: 6,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
  },
  topFoodsIntro: { fontSize: 12, marginBottom: 12 },
  topFoodsList:  { gap: 0 },
  topFoodRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10,
  },
  topFoodImage: {
    width: 40, height: 40, borderRadius: 20,
  },
  topFoodAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  topFoodLetter:    { fontSize: 18, fontWeight: '900' },
  topFoodName:      { flex: 1, fontSize: 14, fontWeight: '700' },
  topFoodCountPill: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  topFoodCountText: { fontSize: 11, fontWeight: '700' },
});
