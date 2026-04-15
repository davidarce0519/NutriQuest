import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { getSuggestionHistoryUseCase } from '../../../domain/usecases/suggestion';
import { Suggestion } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#f5f5f0';
const WHITE = '#ffffff';

type Filter = 'todas' | 'aceptada' | 'descartada';

export const HistoryScreen = () => {
  const user = useAuthStore((s) => s.user);
  const [history, setHistory] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('todas');

  useEffect(() => {
    if (!user) return;
    getSuggestionHistoryUseCase(user.id, 50)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [user]);

  const accepted = history.filter(s => s.response === 'aceptada').length;
  const discarded = history.filter(s => s.response === 'descartada').length;
  const pct = history.length > 0 ? Math.round((accepted / history.length) * 100) : 0;

  const filtered = filter === 'todas'
    ? history
    : history.filter(s => s.response === filter);

  const renderItem = ({ item, index }: { item: Suggestion; index: number }) => (
    <View style={s.item}>
      {/* Acento lateral */}
      <View style={[s.itemAccent, {
        backgroundColor:
          item.response === 'aceptada' ? GREEN :
            item.response === 'descartada' ? '#cbd5e1' : '#fbbf24',
      }]} />

      <View style={s.itemContent}>
        <View style={s.itemTop}>
          <Text style={s.itemName} numberOfLines={1}>{item.food.name}</Text>
          <View style={[s.badge, {
            backgroundColor:
              item.response === 'aceptada' ? '#f0fdf4' :
                item.response === 'descartada' ? '#f8fafc' : '#fffbeb',
          }]}>
            <Text style={[s.badgeText, {
              color:
                item.response === 'aceptada' ? '#16a34a' :
                  item.response === 'descartada' ? '#64748b' : '#d97706',
            }]}>
              {item.response === 'aceptada' ? '✓ Aceptada' :
                item.response === 'descartada' ? '✕ Descartada' : '⏳ Pendiente'}
            </Text>
          </View>
        </View>

        <View style={s.itemBottom}>
          <Text style={s.itemDate}>
            {new Date(item.suggestedAt).toLocaleDateString('es-CO', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          {item.food.prepTimeMinutes && (
            <Text style={s.itemMeta}>⏱ {item.food.prepTimeMinutes} min</Text>
          )}
          {item.isExamPeriod && (
            <Text style={s.examTag}>📚 Parciales</Text>
          )}
          {item.feedback && (
            <Text style={s.feedbackTag}>
              {item.feedback === 'me_gusta' ? '👍' :
                item.feedback === 'no_me_gusta' ? '👎' : '🤷'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) return (
    <View style={s.container}>
      <View style={s.topStrip} />
      <ActivityIndicator color={WHITE} size="large" style={{ marginTop: 100 }} />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.topStrip} />

      <SafeAreaView style={s.safe}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerSub}>Tu registro de decisiones</Text>
          <Text style={s.headerTitle}>Historial 📊</Text>
        </View>

        {/* Resumen HU_6.1 */}
        <View style={s.summaryCard}>
          <View style={s.summaryLeft}>
            <Text style={s.summaryPct}>{pct}%</Text>
            <Text style={s.summaryPctLabel}>aceptación</Text>
            <View style={s.summaryBarBg}>
              <View style={[s.summaryBarFill, { width: `${pct}%` as any }]} />
            </View>
          </View>

          <View style={s.summaryDivider} />

          <View style={s.summaryRight}>
            <View style={s.summaryStatRow}>
              <Text style={s.summaryDot}>●</Text>
              <Text style={s.summaryStatLabel}>Total</Text>
              <Text style={s.summaryStatValue}>{history.length}</Text>
            </View>
            <View style={s.summaryStatRow}>
              <Text style={[s.summaryDot, { color: '#22c55e' }]}>●</Text>
              <Text style={s.summaryStatLabel}>Aceptadas</Text>
              <Text style={[s.summaryStatValue, { color: '#16a34a' }]}>{accepted}</Text>
            </View>
            <View style={s.summaryStatRow}>
              <Text style={[s.summaryDot, { color: '#cbd5e1' }]}>●</Text>
              <Text style={s.summaryStatLabel}>Descartadas</Text>
              <Text style={[s.summaryStatValue, { color: '#94a3b8' }]}>{discarded}</Text>
            </View>
          </View>
        </View>

        {/* Mensaje reflexivo HU_6.3 */}
        <View style={s.reflectionCard}>
          <Text style={s.reflectionText}>
            📝 Este historial es una herramienta de reflexión, no una evaluación de tu comportamiento.
          </Text>
        </View>

        {/* Filtros */}
        <View style={s.filtersRow}>
          {(['todas', 'aceptada', 'descartada'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'todas' ? 'Todas' : f === 'aceptada' ? '✓ Aceptadas' : '✕ Descartadas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista */}
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🌱</Text>
              <Text style={s.emptyTitle}>Sin registros aún</Text>
              <Text style={s.emptySub}>Ve a Sugerencia para empezar tu historial.</Text>
            </View>
          }
        />

      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 180,
    backgroundColor: GREEN,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSub: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: WHITE },

  // Resumen
  summaryCard: {
    backgroundColor: WHITE,
    marginHorizontal: 18,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  summaryLeft: { flex: 1.2, gap: 4 },
  summaryPct: { fontSize: 42, fontWeight: '900', color: GREEN_DARK, lineHeight: 46 },
  summaryPctLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  summaryBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 4 },
  summaryBarFill: { height: '100%', backgroundColor: GREEN, borderRadius: BorderRadius.full },
  summaryDivider: { width: 1, height: 70, backgroundColor: '#e2e8f0' },
  summaryRight: { flex: 1, gap: 8 },
  summaryStatRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryDot: { fontSize: 10, color: '#475569' },
  summaryStatLabel: { flex: 1, fontSize: 12, color: '#64748b' },
  summaryStatValue: { fontSize: 16, fontWeight: '900', color: GREEN_DARK },

  // Reflexión
  reflectionCard: {
    marginHorizontal: 18,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    elevation: 2,
  },
  reflectionText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', lineHeight: 18 },

  // Filtros
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 10,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: BorderRadius.full,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  filterBtnActive: { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  filterText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  filterTextActive: { color: WHITE },

  // Lista
  list: { paddingHorizontal: 18, paddingBottom: 30, gap: 10 },
  item: {
    backgroundColor: WHITE,
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  itemAccent: { width: 5 },
  itemContent: { flex: 1, padding: 14, gap: 6 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 15, fontWeight: '800', color: GREEN_DARK, flex: 1 },
  badge: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  itemDate: { fontSize: 12, color: '#94a3b8' },
  itemMeta: { fontSize: 11, color: '#94a3b8' },
  examTag: { fontSize: 11, color: '#d97706', fontWeight: '600' },
  feedbackTag: { fontSize: 14 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#475569' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
});