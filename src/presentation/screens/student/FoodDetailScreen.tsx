import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { BorderRadius } from '../../../infrastructure/theme';
import { StudentStackParams } from '../../navigation/StudentNavigator';

type FoodDetailRouteProp = RouteProp<StudentStackParams, 'DetalleAlimento'>;

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const ENERGY_LABELS = ['', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];

const getConsumptionTime = (energyLevel?: number): string | null => {
  if (!energyLevel) return null;
  if (energyLevel >= 4) return 'Antes de clases o períodos de estudio intenso';
  if (energyLevel >= 2) return 'A media tarde o como snack entre clases';
  return 'En la noche o cuando quieras algo ligero';
};

export const FoodDetailScreen = () => {
  const { isDark } = useTheme();
  const { top }    = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParams>>();
  const route      = useRoute<FoodDetailRouteProp>();
  const { food }   = route.params;

  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg        = isDark ? '#1e293b' : '#ffffff';
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : '#1a6b0a';
  const inputBg       = isDark ? '#334155' : '#f8fafc';

  const eColor = food.energyLevel ? ENERGY_COLORS[food.energyLevel] : '#94a3b8';
  const eLabel = food.energyLevel ? ENERGY_LABELS[food.energyLevel] : '';
  const consumptionTime = getConsumptionTime(food.energyLevel);

  const macros = [
    { label: 'Calorías',      value: food.caloriesKcal, unit: 'kcal', icon: '🔥' },
    { label: 'Proteína',      value: food.proteinG,     unit: 'g',    icon: '💪' },
    { label: 'Carbohidratos', value: food.carbsG,       unit: 'g',    icon: '⚡' },
    { label: 'Grasas',        value: food.fatG,         unit: 'g',    icon: '🫒' },
  ].filter(m => m.value !== undefined && m.value !== null);

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Hero imagen ── */}
        <View style={s.hero}>
          {food.imageUrl ? (
            <Image
              source={{ uri: food.imageUrl }}
              style={s.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[s.heroFallback, { backgroundColor: green + '18' }]}>
              <Text style={s.heroFallbackEmoji}>🥗</Text>
            </View>
          )}
          <View style={s.heroGradient} />
          <Text style={s.heroName} numberOfLines={2}>{food.name}</Text>
        </View>

        {/* ── Contenido ── */}
        <View style={[s.content, { backgroundColor: bg }]}>

          {/* 1. Métricas rápidas */}
          <View style={[s.card, { backgroundColor: cardBg }]}>
            <View style={s.metricsRow}>
              {food.prepTimeMinutes !== undefined && (
                <View style={[s.metricBlock, { borderColor: border }]}>
                  <Text style={s.metricIcon}>⏱</Text>
                  <Text style={[s.metricValue, { color: textPrimary }]}>
                    {food.prepTimeMinutes === 0 ? 'Sin prep' : `${food.prepTimeMinutes} min`}
                  </Text>
                  <Text style={[s.metricLabel, { color: textMuted }]}>Preparación</Text>
                </View>
              )}
              {food.energyLevel !== undefined && (
                <View style={[s.metricBlock, { borderColor: border }]}>
                  <View style={[s.energyBarBg, { backgroundColor: border }]}>
                    <View style={[s.energyBarFill, {
                      width: `${(food.energyLevel / 5) * 100}%` as any,
                      backgroundColor: eColor,
                    }]} />
                  </View>
                  <Text style={[s.metricValue, { color: eColor }]}>{eLabel}</Text>
                  <Text style={[s.metricLabel, { color: textMuted }]}>Energía</Text>
                </View>
              )}
              {food.validatorName && (
                <View style={[s.metricBlock, { borderColor: border }]}>
                  <Text style={s.metricIcon}>✅</Text>
                  <Text style={[s.metricValue, { color: green, fontSize: 11 }]}>Validado</Text>
                  <Text style={[s.metricLabel, { color: textMuted }]} numberOfLines={1}>
                    {food.validatorName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 2. Ingredientes */}
          {food.ingredientsSummary && (
            <View style={[s.card, { backgroundColor: cardBg }]}>
              <Text style={[s.cardTitle, { color: textMuted }]}>🛒 Ingredientes</Text>
              <Text style={[s.cardBody, { color: textSecondary }]}>{food.ingredientsSummary}</Text>
            </View>
          )}

          {/* 3. ¿Por qué este alimento? */}
          {food.nutritionalBenefits && (
            <View style={[s.card, { backgroundColor: cardBg }]}>
              <Text style={[s.cardTitle, { color: textMuted }]}>💡 ¿Por qué este alimento?</Text>
              <Text style={[s.cardBody, { color: textSecondary }]}>{food.nutritionalBenefits}</Text>
            </View>
          )}

          {/* 4. Información nutricional */}
          {macros.length > 0 && (
            <View style={[s.card, { backgroundColor: cardBg }]}>
              <Text style={[s.cardTitle, { color: textMuted }]}>📊 Información nutricional</Text>
              <View style={s.macroGrid}>
                {macros.map(m => (
                  <View key={m.label} style={[s.macroCell, { backgroundColor: inputBg, borderColor: border }]}>
                    <Text style={s.macroCellIcon}>{m.icon}</Text>
                    <Text style={[s.macroCellValue, { color: textPrimary }]}>{m.value}</Text>
                    <Text style={[s.macroCellUnit, { color: textMuted }]}>{m.unit}</Text>
                    <Text style={[s.macroCellLabel, { color: textSecondary }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 5. ¿Cuándo consumirlo? */}
          {consumptionTime && (
            <View style={[s.card, { backgroundColor: cardBg, borderLeftColor: eColor, borderLeftWidth: 4 }]}>
              <Text style={[s.cardTitle, { color: textMuted }]}>⏰ ¿Cuándo consumirlo?</Text>
              <Text style={[s.cardBody, { color: textSecondary }]}>{consumptionTime}</Text>
            </View>
          )}

          <View style={s.bottomPad} />
        </View>
      </ScrollView>

      {/* Botón volver — absoluto sobre la imagen */}
      <TouchableOpacity
        style={[s.backBtn, { top: top + 12 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={s.backBtnText}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },

  hero:     { position: 'relative', height: 280 },
  heroImage: { width: '100%', height: 280 },
  heroFallback: {
    width: '100%', height: 280,
    alignItems: 'center', justifyContent: 'center',
  },
  heroFallbackEmoji: { fontSize: 80 },
  heroGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  heroName: {
    position: 'absolute',
    bottom: 24, left: 20, right: 20,
    fontSize: 28, fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  content: { padding: 16, gap: 12 },

  card: {
    borderRadius: 20, padding: 16, gap: 10,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 12, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  cardBody: { fontSize: 14, lineHeight: 22 },

  metricsRow: { flexDirection: 'row', gap: 10 },
  metricBlock: {
    flex: 1, alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  metricIcon:  { fontSize: 22 },
  metricValue: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  metricLabel: { fontSize: 10, textAlign: 'center' },
  energyBarBg: {
    height: 6, borderRadius: BorderRadius.full,
    overflow: 'hidden', width: '100%',
  },
  energyBarFill: { height: '100%', borderRadius: BorderRadius.full },

  macroGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  macroCell: {
    width: '47%', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  macroCellIcon:  { fontSize: 22 },
  macroCellValue: { fontSize: 22, fontWeight: '900' },
  macroCellUnit:  { fontSize: 11 },
  macroCellLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#ffffff', fontSize: 20, fontWeight: '700', lineHeight: 24 },

  bottomPad: { height: 24 },
});
