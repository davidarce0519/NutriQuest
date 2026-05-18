import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme }      from '../../../infrastructure/theme/ThemeContext';
import { BorderRadius }  from '../../../infrastructure/theme';
import { StudentStackParams } from '../../navigation/StudentNavigator';

type FoodDetailRouteProp = RouteProp<StudentStackParams, 'DetalleAlimento'>;

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const ENERGY_LABELS = ['', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];

const TIMING: Record<number, string> = {
  5: '☀️ Ideal antes de clases o períodos de estudio intenso',
  4: '🌤 Perfecto para el desayuno o media mañana',
  3: '🌥 Buen snack a media tarde o entre clases',
  2: '🌙 Ideal en la noche o cuando quieres algo ligero',
  1: '😴 Perfecto para relajarte después de un día largo',
};

export const FoodDetailScreen = () => {
  const { isDark }  = useTheme();
  const { top }     = useSafeAreaInsets();
  const navigation  = useNavigation<NativeStackNavigationProp<StudentStackParams>>();
  const route       = useRoute<FoodDetailRouteProp>();
  const { food }    = route.params;

  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg        = isDark ? '#1e293b' : '#ffffff';
  const inputBg       = isDark ? '#334155' : '#f8fafc';
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : '#1a6b0a';
  const greenDark     = isDark ? '#16a34a' : '#042901';
  const greenLight    = isDark ? '#4ade80' : '#c1d9b7';

  const eColor   = food.energyLevel ? ENERGY_COLORS[food.energyLevel] : '#94a3b8';
  const eLabel   = food.energyLevel ? ENERGY_LABELS[food.energyLevel] : null;
  const timing   = food.energyLevel ? TIMING[food.energyLevel] : null;

  const macros = ([
    { label: 'Calorías',      value: food.caloriesKcal, unit: 'kcal', icon: '🔥' },
    { label: 'Proteína',      value: food.proteinG,     unit: 'g',    icon: '💪' },
    { label: 'Carbos',        value: food.carbsG,       unit: 'g',    icon: '⚡' },
    { label: 'Grasas',        value: food.fatG,         unit: 'g',    icon: '🫒' },
  ] as Array<{ label: string; value: number | undefined; unit: string; icon: string }>)
    .filter(m => m.value !== undefined && m.value !== null);

  const ingredients: string[] = food.ingredientsSummary?.includes(',')
    ? food.ingredientsSummary.split(',').map(i => i.trim()).filter(Boolean)
    : [];

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Hero imagen ── */}
        <View style={s.hero}>
          {food.imageUrl ? (
            <Image source={{ uri: food.imageUrl }} style={s.heroImage} resizeMode="cover" />
          ) : (
            <View style={[s.heroFallback, { backgroundColor: green + '15' }]}>
              <Text style={s.heroFallbackEmoji}>🥗</Text>
            </View>
          )}

          {/* Gradiente oscuro inferior */}
          <View style={s.heroGradient} />

          {/* Nombre sobre la imagen */}
          <Text style={s.heroName} numberOfLines={2}>{food.name}</Text>

          {/* Badges arriba derecha */}
          <View style={s.heroBadgesWrap}>
            {food.prepTimeMinutes !== undefined && (
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>
                  {food.prepTimeMinutes === 0 ? '⚡ Sin prep' : `⏱ ${food.prepTimeMinutes} min`}
                </Text>
              </View>
            )}
            {eLabel && (
              <View style={[s.heroBadge, { backgroundColor: eColor + 'cc' }]}>
                <Text style={s.heroBadgeText}>⚡ Energía {food.energyLevel}/5</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Contenido ── */}
        <View style={[s.content, { backgroundColor: bg }]}>

          {/* 1. Características — chips horizontales */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsRow}
          >
            {food.prepTimeMinutes !== undefined && (
              <View style={[s.chip, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[s.chipText, { color: textSecondary }]}>
                  ⏱ {food.prepTimeMinutes === 0 ? 'Sin prep' : `${food.prepTimeMinutes} min`}
                </Text>
              </View>
            )}
            {eLabel && (
              <View style={[s.chip, { backgroundColor: eColor + '20', borderColor: eColor + '44' }]}>
                <Text style={[s.chipText, { color: eColor }]}>⚡ {eLabel}</Text>
              </View>
            )}
            {food.isQuick && (
              <View style={[s.chip, { backgroundColor: isDark ? '#14532d' : '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={[s.chipText, { color: '#16a34a' }]}>💪 Snack rápido</Text>
              </View>
            )}
            {food.suitableDietTypes && food.suitableDietTypes.length > 0 && (
              <View style={[s.chip, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[s.chipText, { color: textSecondary }]}>
                  🥗 {food.suitableDietTypes[0]}
                </Text>
              </View>
            )}
            {food.validatorName && (
              <View style={[s.chip, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={[s.chipText, { color: '#16a34a' }]}>✅ {food.validatorName}</Text>
              </View>
            )}
          </ScrollView>

          {/* 2. ¿Por qué este alimento? */}
          {food.nutritionalBenefits && (
            <View style={[s.benefitsCard, { borderColor: green + '44', backgroundColor: green + '0d' }]}>
              <Text style={[s.sectionLabel, { color: green }]}>💡 ¿Por qué este alimento?</Text>
              <Text style={[s.bodyText, { color: textPrimary }]}>{food.nutritionalBenefits}</Text>
            </View>
          )}

          {/* 3. Ingredientes */}
          {food.ingredientsSummary && (
            <View style={[s.card, { backgroundColor: inputBg, borderColor: border }]}>
              <Text style={[s.sectionLabel, { color: textMuted }]}>🛒 Ingredientes</Text>
              {ingredients.length > 0 ? (
                ingredients.map((ing, i) => (
                  <Text key={i} style={[s.bulletItem, { color: textPrimary }]}>• {ing}</Text>
                ))
              ) : (
                <Text style={[s.bodyText, { color: textSecondary }]}>{food.ingredientsSummary}</Text>
              )}
            </View>
          )}

          {/* 4. Información nutricional */}
          <View>
            <Text style={[s.sectionLabel, { color: textMuted, marginBottom: 8 }]}>
              📊 Información nutricional
            </Text>
            {macros.length > 0 ? (
              <View style={s.macroGrid}>
                {macros.map(m => (
                  <View key={m.label} style={[s.macroCell, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={s.macroCellIcon}>{m.icon}</Text>
                    <Text style={[s.macroCellValue, { color: textPrimary }]}>{m.value}</Text>
                    <Text style={[s.macroCellUnit, { color: textMuted }]}>{m.unit}</Text>
                    <Text style={[s.macroCellLabel, { color: textSecondary }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={[s.bodyText, { color: textMuted }]}>
                  Información nutricional no disponible
                </Text>
              </View>
            )}
          </View>

          {/* 5. Mejor momento para consumirlo */}
          {timing && (
            <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.sectionLabel, { color: textMuted }]}>⏰ Mejor momento para consumirlo</Text>
              <Text style={[s.bodyText, { color: textPrimary }]}>{timing}</Text>
            </View>
          )}

          {/* 6. Descripción */}
          {food.description && (
            <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.sectionLabel, { color: textMuted }]}>📝 Descripción</Text>
              <Text style={[s.bodyText, { color: textSecondary }]}>{food.description}</Text>
            </View>
          )}

          {/* Aviso legal */}
          <View style={[s.disclaimerBox, { backgroundColor: isDark ? '#1c1200' : '#fefce8', borderColor: '#fbbf24' }]}>
            <Text style={[s.disclaimerText, { color: isDark ? '#fde68a' : '#92400e' }]}>
              ⚠️ Carácter educativo · No reemplaza consulta profesional
            </Text>
          </View>

          <View style={{ height: 32 }} />
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

  // Hero
  hero: { position: 'relative', height: 280 },
  heroImage: { width: '100%', height: 280 },
  heroFallback: {
    width: '100%', height: 280,
    alignItems: 'center', justifyContent: 'center',
  },
  heroFallbackEmoji: { fontSize: 80 },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroName: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    fontSize: 26, fontWeight: '900', color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroBadgesWrap: {
    position: 'absolute', top: 14, right: 14, gap: 6, alignItems: 'flex-end',
  },
  heroBadge: {
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  heroBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  // Contenido
  content: { padding: 18, gap: 14, paddingTop: 16 },

  // Chips horizontales
  chipsRow: { gap: 8, paddingBottom: 2 },
  chip: {
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  // Beneficios (card verde)
  benefitsCard: {
    borderRadius: 16, borderLeftWidth: 3, borderWidth: 1,
    padding: 14, gap: 8,
  },

  // Card genérica
  card: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 8,
  },

  sectionLabel: {
    fontSize: 12, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  bodyText:   { fontSize: 14, lineHeight: 22 },
  bulletItem: { fontSize: 14, lineHeight: 24 },

  // Macros
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  macroCell: {
    width: '47%', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  macroCellIcon:  { fontSize: 22 },
  macroCellValue: { fontSize: 22, fontWeight: '900' },
  macroCellUnit:  { fontSize: 11 },
  macroCellLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Disclaimer
  disclaimerBox: {
    borderRadius: 12, borderLeftWidth: 3, borderWidth: 1, padding: 12,
  },
  disclaimerText: { fontSize: 11, textAlign: 'center', fontWeight: '600' },

  // Botón volver
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#ffffff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
});
