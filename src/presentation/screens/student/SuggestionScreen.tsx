import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import {
  generateSuggestionUseCase,
  respondSuggestionUseCase,
  feedbackSuggestionUseCase,
} from '../../../domain/usecases/suggestion';
import { Suggestion } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#f5f5f0';
const WHITE = '#ffffff';

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export const SuggestionScreen = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useHealthStore((s) => s.profile);

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [responded, setResponded] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleGenerate = async () => {
    if (!user || !profile) {
      Alert.alert('Perfil incompleto', 'Completa tu perfil de salud en la tab Perfil primero.');
      return;
    }
    try {
      setLoading(true);
      setResponded(false);
      setAccepted(false);
      const s = await generateSuggestionUseCase(user.id, profile, false);
      setSuggestion(s);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (response: 'aceptada' | 'descartada') => {
    if (!suggestion) return;
    try {
      await respondSuggestionUseCase(suggestion.id, response);
      setResponded(true);
      setAccepted(response === 'aceptada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleFeedback = async (feedback: 'me_gusta' | 'no_me_gusta' | 'no_aplica') => {
    if (!suggestion) return;
    try {
      await feedbackSuggestionUseCase(suggestion.id, feedback);
      setSuggestion(null);
      setResponded(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={s.container}>
      {/* Franja verde superior igual que Home */}
      <View style={s.topStrip} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerSub}>Tu momento de cuidarte</Text>
              <Text style={s.headerTitle}>Sugerencia 🍎</Text>
            </View>
          </View>

          {/* Aviso legal */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              ⚠️ Contenido educativo · No reemplaza consulta profesional
            </Text>
          </View>

          {!suggestion ? (
            /* ── ESTADO VACÍO ── */
            <View style={s.emptyCard}>
              <View style={s.emptyCircle}>
                <Text style={s.emptyEmoji}>🥗</Text>
              </View>
              <Text style={s.emptyTitle}>¿Qué comemos hoy?</Text>
              <Text style={s.emptySub}>
                Te recomendaremos un alimento personalizado según tu perfil y objetivo nutricional.
              </Text>
              <TouchableOpacity
                style={s.generateBtn}
                onPress={handleGenerate}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color={WHITE} />
                  : <Text style={s.generateBtnText}>Obtener sugerencia →</Text>
                }
              </TouchableOpacity>
            </View>

          ) : (
            /* ── CARD SUGERENCIA ── */
            <View style={s.card}>

              {/* Imagen */}
              {suggestion.food.imageUrl && (
                <Image
                  source={{ uri: suggestion.food.imageUrl }}
                  style={s.foodImage}
                  resizeMode="cover"
                />
              )}

              <View style={s.cardBody}>

                {/* Mensaje emocional */}
                {suggestion.emotionalMessage && (
                  <View style={s.emotionalRow}>
                    <Text style={s.emotionalIcon}>💬</Text>
                    <Text style={s.emotionalText}>{suggestion.emotionalMessage}</Text>
                  </View>
                )}

                {/* Nombre + tiempo */}
                <View style={s.foodHeader}>
                  <Text style={s.foodName}>{suggestion.food.name}</Text>
                  {suggestion.food.prepTimeMinutes && (
                    <View style={s.timePill}>
                      <Text style={s.timePillText}>⏱ {suggestion.food.prepTimeMinutes} min</Text>
                    </View>
                  )}
                </View>

                {/* Nivel energético */}
                {suggestion.food.energyLevel && (
                  <View style={s.energyRow}>
                    <Text style={s.energyLabel}>Energía aportada</Text>
                    <View style={s.energyDots}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={[
                          s.dot,
                          {
                            backgroundColor: i <= suggestion.food.energyLevel!
                              ? ENERGY_COLORS[suggestion.food.energyLevel!]
                              : '#e2e8f0',
                            width: i <= suggestion.food.energyLevel! ? 16 : 10,
                            height: i <= suggestion.food.energyLevel! ? 16 : 10,
                          }
                        ]} />
                      ))}
                    </View>
                  </View>
                )}

                {/* Beneficios */}
                {suggestion.food.nutritionalBenefits && (
                  <View style={s.benefitsBox}>
                    <Text style={s.benefitsLabel}>¿Por qué este alimento?</Text>
                    <Text style={s.benefitsText}>{suggestion.food.nutritionalBenefits}</Text>
                  </View>
                )}

                {/* Macros */}
                {(suggestion.food.caloriesKcal || suggestion.food.proteinG) && (
                  <View style={s.macrosRow}>
                    {[
                      { val: suggestion.food.caloriesKcal, unit: 'kcal', show: !!suggestion.food.caloriesKcal },
                      { val: `${suggestion.food.proteinG}g`, unit: 'proteína', show: !!suggestion.food.proteinG },
                      { val: `${suggestion.food.carbsG}g`, unit: 'carbos', show: !!suggestion.food.carbsG },
                      { val: `${suggestion.food.fatG}g`, unit: 'grasas', show: !!suggestion.food.fatG },
                    ].filter(m => m.show).map((m) => (
                      <View key={m.unit} style={s.macroPill}>
                        <Text style={s.macroVal}>{m.val}</Text>
                        <Text style={s.macroUnit}>{m.unit}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Sello validación */}
                {suggestion.food.validatorName && (
                  <View style={s.seal}>
                    <Text style={s.sealText}>
                      ✅ Validado por {suggestion.food.validatorName}
                    </Text>
                  </View>
                )}

                {/* Acciones */}
                {!responded ? (
                  <View style={s.actionsRow}>
                    <TouchableOpacity
                      style={s.acceptBtn}
                      onPress={() => handleRespond('aceptada')}
                      activeOpacity={0.85}
                    >
                      <Text style={s.acceptBtnText}>✓  Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.discardBtn}
                      onPress={() => handleRespond('descartada')}
                      activeOpacity={0.85}
                    >
                      <Text style={s.discardBtnText}>✕  Descartar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.feedbackSection}>
                    <View style={[
                      s.responseBadge,
                      { backgroundColor: accepted ? '#f0fdf4' : '#f8fafc' }
                    ]}>
                      <Text style={[
                        s.responseBadgeText,
                        { color: accepted ? '#16a34a' : '#64748b' }
                      ]}>
                        {accepted ? '✓ Sugerencia aceptada' : '✕ Sugerencia descartada'}
                      </Text>
                    </View>

                    <Text style={s.feedbackTitle}>¿Qué te pareció?</Text>
                    <View style={s.feedbackRow}>
                      {[
                        { key: 'me_gusta', emoji: '👍', label: 'Me gusta' },
                        { key: 'no_me_gusta', emoji: '👎', label: 'No me gusta' },
                        { key: 'no_aplica', emoji: '🤷', label: 'No aplica' },
                      ].map(f => (
                        <TouchableOpacity
                          key={f.key}
                          style={s.feedbackBtn}
                          onPress={() => handleFeedback(f.key as any)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.feedbackEmoji}>{f.emoji}</Text>
                          <Text style={s.feedbackBtnText}>{f.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Otra sugerencia */}
                <TouchableOpacity style={s.anotherBtn} onPress={handleGenerate}>
                  <Text style={s.anotherBtnText}>↻  Otra sugerencia</Text>
                </TouchableOpacity>

              </View>
            </View>
          )}

        </ScrollView>
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
  scroll: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },

  // Header
  header: { paddingTop: 8, paddingBottom: 4 },
  headerSub: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: WHITE },

  // Disclaimer
  disclaimer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  disclaimerText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // Empty state
  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GREEN + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: GREEN_DARK, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  generateBtn: {
    backgroundColor: GREEN_DARK,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 4,
    elevation: 3,
  },
  generateBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },

  // Card sugerencia
  card: {
    backgroundColor: WHITE,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  foodImage: { width: '100%', height: 220 },
  cardBody: { padding: 20, gap: 14 },

  // Emocional
  emotionalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: GREEN + '10',
    borderRadius: 14,
    padding: 12,
  },
  emotionalIcon: { fontSize: 18 },
  emotionalText: { flex: 1, fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 18 },

  // Nombre
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: 24, fontWeight: '900', color: GREEN_DARK, flex: 1 },
  timePill: { backgroundColor: GREEN + '15', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 5 },
  timePillText: { fontSize: 12, fontWeight: '700', color: GREEN },

  // Energía
  energyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  energyLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  energyDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { borderRadius: BorderRadius.full },

  // Beneficios
  benefitsBox: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14 },
  benefitsLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  benefitsText: { fontSize: 14, color: '#334155', lineHeight: 20 },

  // Macros
  macrosRow: { flexDirection: 'row', gap: 8 },
  macroPill: {
    flex: 1,
    backgroundColor: GREEN + '10',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  macroVal: { fontSize: 16, fontWeight: '900', color: GREEN_DARK },
  macroUnit: { fontSize: 10, color: '#64748b', marginTop: 2 },

  // Sello
  seal: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 },
  sealText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },

  // Acciones
  actionsRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
  },
  acceptBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  discardBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  discardBtnText: { color: '#64748b', fontSize: 16, fontWeight: '700' },

  // Feedback
  feedbackSection: { gap: 12 },
  responseBadge: { borderRadius: 12, padding: 12, alignItems: 'center' },
  responseBadgeText: { fontSize: 14, fontWeight: '700' },
  feedbackTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textAlign: 'center' },
  feedbackRow: { flexDirection: 'row', gap: 8 },
  feedbackBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedbackEmoji: { fontSize: 22 },
  feedbackBtnText: { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  // Otra sugerencia
  anotherBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GREEN + '30',
    backgroundColor: GREEN + '08',
  },
  anotherBtnText: { color: GREEN, fontSize: 14, fontWeight: '700' },
});