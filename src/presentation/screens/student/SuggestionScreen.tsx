import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swiper from 'react-native-deck-swiper';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import {
  generateMultipleSuggestionsUseCase,
  respondSuggestionUseCase,
  feedbackSuggestionUseCase,
} from '../../../domain/usecases/suggestion';
import { Suggestion } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';

const { width: W, height: H } = Dimensions.get('window');

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#f5f5f0';
const WHITE = '#ffffff';

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const ENERGY_LABELS = ['', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];
const GOAL_LABELS: Record<string, string> = {
  mejorar_energia: '⚡ Energía',
  mejorar_concentracion: '🧠 Concentración',
  mantener_peso: '⚖️ Mantener peso',
  bienestar_general: '🌿 Bienestar',
  perder_peso: '📉 Perder peso',
  ganar_masa: '💪 Ganar masa',
};

// Altura del footer fija
const FOOTER_H = 110;

export const SuggestionScreen = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useHealthStore((s) => s.profile);
  const insets = useSafeAreaInsets();

  const swiperRef = useRef<any>(null);

  const [cards, setCards] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [allGone, setAllGone] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<Suggestion | null>(null);
  const [remaining, setRemaining] = useState(0);

  const loadCards = async () => {
    if (!user) return;
    if (!profile?.weightKg) {
      Alert.alert('Perfil incompleto', 'Completa tu peso y talla en la tab Perfil.');
      return;
    }
    try {
      setLoading(true);
      setAllGone(false);
      setShowFeedback(false);
      // Una sola llamada que genera 3 distintas en secuencia
      const results = await generateMultipleSuggestionsUseCase(
        user.id, profile, false, 3
      );
      setCards(results);
      setRemaining(results.length);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipedRight = async (index: number) => {
    const s = cards[index];
    if (!s) return;
    setRemaining(r => r - 1);
    try {
      await respondSuggestionUseCase(s.id, 'aceptada');
      setLastSuggestion(s);
      setShowFeedback(true);
    } catch { }
  };

  const handleSwipedLeft = async (index: number) => {
    const s = cards[index];
    if (!s) return;
    setRemaining(r => r - 1);
    try { await respondSuggestionUseCase(s.id, 'descartada'); } catch { }
  };

  const handleSwipedAll = () => setAllGone(true);

  const handleFeedback = async (feedback: 'me_gusta' | 'no_me_gusta' | 'no_aplica') => {
    if (!lastSuggestion) return;
    try {
      await feedbackSuggestionUseCase(lastSuggestion.id, feedback);
      setShowFeedback(false);
    } catch { }
  };

  // ── CARD ──────────────────────────────────────────
  const renderCard = (suggestion: Suggestion) => {
    if (!suggestion) return null;
    const eColor = suggestion.food.energyLevel
      ? ENERGY_COLORS[suggestion.food.energyLevel]
      : '#94a3b8';
    const eLabel = suggestion.food.energyLevel
      ? ENERGY_LABELS[suggestion.food.energyLevel]
      : '';

    return (
      <View style={s.card}>
        {/* Imagen */}
        <View style={s.imageWrap}>
          {suggestion.food.imageUrl ? (
            <Image
              source={{ uri: suggestion.food.imageUrl }}
              style={s.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={s.imageFallback}>
              <Text style={s.imageFallbackEmoji}>🥗</Text>
            </View>
          )}

          {/* Gradient overlay bottom */}
          <View style={s.imageGradient} />

          {/* Nombre sobre la imagen */}
          <View style={s.imageBottomInfo}>
            <Text style={s.imageTitle}>{suggestion.food.name}</Text>
            <View style={s.imageMetaRow}>
              {suggestion.food.prepTimeMinutes !== undefined && (
                <View style={s.metaChip}>
                  <Text style={s.metaChipText}>
                    ⏱ {suggestion.food.prepTimeMinutes === 0
                      ? 'Sin prep' : `${suggestion.food.prepTimeMinutes} min`}
                  </Text>
                </View>
              )}
              {suggestion.food.energyLevel && (
                <View style={[s.metaChip, { backgroundColor: eColor }]}>
                  <Text style={s.metaChipText}>{eLabel}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Cuerpo scrolleable */}
        <ScrollView
          style={s.cardScroll}
          contentContainerStyle={s.cardScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Mensaje emocional */}
          {suggestion.emotionalMessage && (
            <View style={s.emotionalRow}>
              <Text style={s.emotionalIcon}>💬</Text>
              <Text style={s.emotionalText}>{suggestion.emotionalMessage}</Text>
            </View>
          )}

          {/* Barra energía */}
          {suggestion.food.energyLevel && (
            <View style={s.energyRow}>
              <Text style={s.energyRowLabel}>Energía</Text>
              <View style={s.energyBarBg}>
                <View style={[
                  s.energyBarFill,
                  {
                    width: `${(suggestion.food.energyLevel / 5) * 100}%` as any,
                    backgroundColor: eColor,
                  }
                ]} />
              </View>
              <Text style={[s.energyRowValue, { color: eColor }]}>{eLabel}</Text>
            </View>
          )}

          {/* Ingredientes */}
          {suggestion.food.ingredientsSummary && (
            <View style={s.infoRow}>
              <Text style={s.infoRowIcon}>🛒</Text>
              <Text style={s.infoRowText}>{suggestion.food.ingredientsSummary}</Text>
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
                { val: suggestion.food.caloriesKcal, unit: 'kcal', icon: '🔥', show: !!suggestion.food.caloriesKcal },
                { val: `${suggestion.food.proteinG}g`, unit: 'prot', icon: '💪', show: !!suggestion.food.proteinG },
                { val: `${suggestion.food.carbsG}g`, unit: 'carbs', icon: '⚡', show: !!suggestion.food.carbsG },
                { val: `${suggestion.food.fatG}g`, unit: 'gras', icon: '🫒', show: !!suggestion.food.fatG },
              ].filter(m => m.show).map(m => (
                <View key={m.unit} style={s.macroPill}>
                  <Text style={s.macroIcon}>{m.icon}</Text>
                  <Text style={s.macroVal}>{m.val}</Text>
                  <Text style={s.macroUnit}>{m.unit}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Sello */}
          {suggestion.food.validatorName && (
            <View style={s.seal}>
              <Text style={s.sealText}>✅ Validado por {suggestion.food.validatorName}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Altura disponible para el swiper (pantalla - header - footer - safearea)
  const HEADER_H = 80;
  const CARD_AREA_H = H - HEADER_H - FOOTER_H - insets.top - insets.bottom - 16;

  return (
    <View style={s.container}>
      <View style={s.topStrip} />

      <SafeAreaView style={s.safe}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerSub}>Tu momento de cuidarte</Text>
            <Text style={s.headerTitle}>Sugerencias 🍎</Text>
          </View>
          {profile?.nutritionalGoal && (
            <View style={s.goalBadge}>
              <Text style={s.goalBadgeText}>
                {GOAL_LABELS[profile.nutritionalGoal]}
              </Text>
            </View>
          )}
        </View>

        {/* ── ÁREA CENTRAL ── */}
        <View style={[s.centerArea, { height: CARD_AREA_H }]}>

          {/* Inicial */}
          {cards.length === 0 && !loading && (
            <View style={s.stateCard}>
              <View style={s.stateCircle}>
                <Text style={s.stateEmoji}>🥗</Text>
              </View>
              <Text style={s.stateTitle}>¿Qué comemos hoy?</Text>
              <Text style={s.stateSub}>
                Desliza derecha para aceptar,{'\n'}izquierda para descartar.
              </Text>
              <TouchableOpacity style={s.startBtn} onPress={loadCards} activeOpacity={0.88}>
                <Text style={s.startBtnText}>Empezar →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={s.stateCard}>
              <ActivityIndicator color={GREEN} size="large" />
              <Text style={s.loadingText}>Preparando tus sugerencias...</Text>
              <Text style={s.loadingSub}>Aplicando tus preferencias y alergias</Text>
            </View>
          )}

          {/* Swiper */}
          {cards.length > 0 && !allGone && !loading && !showFeedback && (
            <>
              {/* Contador */}
              <View style={s.counterRow}>
                {cards.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      s.counterDot,
                      { backgroundColor: i < remaining ? GREEN : '#e2e8f0' }
                    ]}
                  />
                ))}
              </View>

              <Swiper
                ref={swiperRef}
                cards={cards}
                renderCard={renderCard}
                onSwipedRight={handleSwipedRight}
                onSwipedLeft={handleSwipedLeft}
                onSwipedAll={handleSwipedAll}
                backgroundColor="transparent"
                stackSize={2}
                stackScale={6}
                stackSeparation={12}
                animateCardOpacity
                disableTopSwipe
                disableBottomSwipe
                cardVerticalMargin={0}
                cardHorizontalMargin={0}
                overlayLabels={{
                  left: {
                    title: '✕',
                    style: {
                      label: {
                        backgroundColor: '#ef4444',
                        color: WHITE,
                        fontSize: 48,
                        fontWeight: '900',
                        borderRadius: 16,
                        padding: 12,
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        marginTop: 30,
                        marginRight: 20,
                      },
                    },
                  },
                  right: {
                    title: '✓',
                    style: {
                      label: {
                        backgroundColor: GREEN,
                        color: WHITE,
                        fontSize: 48,
                        fontWeight: '900',
                        borderRadius: 16,
                        padding: 12,
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginTop: 30,
                        marginLeft: 20,
                      },
                    },
                  },
                }}
              />
            </>
          )}

          {/* Feedback */}
          {showFeedback && lastSuggestion && (
            <View style={s.stateCard}>
              <Text style={s.stateEmoji}>🎉</Text>
              <Text style={s.stateTitle}>¡Excelente decisión!</Text>
              <Text style={s.stateSub}>
                {lastSuggestion.food.name} registrado en tu progreso
              </Text>
              <Text style={s.feedbackAsk}>¿Cómo calificarías esta sugerencia?</Text>
              <View style={s.feedbackRow}>
                {[
                  { key: 'me_gusta', emoji: '👍', label: 'Me gustó' },
                  { key: 'no_me_gusta', emoji: '👎', label: 'No me gustó' },
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

          {/* Se acabaron */}
          {allGone && !showFeedback && (
            <View style={s.stateCard}>
              <Text style={s.stateEmoji}>✨</Text>
              <Text style={s.stateTitle}>¡Ya viste todas!</Text>
              <Text style={s.stateSub}>¿Quieres ver más opciones?</Text>
              <TouchableOpacity style={s.startBtn} onPress={loadCards} activeOpacity={0.88}>
                <Text style={s.startBtnText}>Más sugerencias →</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        {/* ── FOOTER ESTÁTICO ── */}
        {cards.length > 0 && !allGone && !showFeedback && !loading && (
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              style={s.acceptBtn}
              onPress={() => swiperRef.current?.swipeRight()}
              activeOpacity={0.85}
            >
              <Text style={s.acceptBtnIcon}>✓</Text>
              <Text style={s.acceptBtnText}>Aceptar</Text>
            </TouchableOpacity>

            <View style={s.footerCenter}>
              <Text style={s.footerHintTop}>desliza</Text>
              <Text style={s.footerHintBottom}>← ó →</Text>
            </View>

            <TouchableOpacity
              style={s.discardBtn}
              onPress={() => swiperRef.current?.swipeLeft()}
              activeOpacity={0.85}
            >
              <Text style={s.discardBtnIcon}>✕</Text>
              <Text style={s.discardBtnText}>Descartar</Text>
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 160, backgroundColor: GREEN,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    height: 80,
  },
  headerSub: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: WHITE },
  goalBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalBadgeText: { fontSize: 11, fontWeight: '700', color: WHITE },

  // Área central
  centerArea: { flex: 1, paddingHorizontal: 14 },

  // Estados (vacío, loading, feedback, done)
  stateCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  stateCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: GREEN + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  stateEmoji: { fontSize: 48 },
  stateTitle: { fontSize: 22, fontWeight: '900', color: GREEN_DARK, textAlign: 'center' },
  stateSub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 },
  startBtn: {
    backgroundColor: GREEN_DARK,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 4,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  legalBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    width: '100%',
  },
  legalText: { fontSize: 11, color: '#92400e' },
  loadingText: { fontSize: 16, fontWeight: '700', color: GREEN_DARK },
  loadingSub: { fontSize: 13, color: '#64748b' },

  // Contador de cards
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    flex: 1,
  },
  imageWrap: { position: 'relative' },
  foodImage: { width: '100%', height: 200 },
  imageFallback: {
    width: '100%', height: 140,
    backgroundColor: GREEN + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  imageFallbackEmoji: { fontSize: 56 },
  imageGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageBottomInfo: {
    position: 'absolute',
    bottom: 12, left: 14, right: 14,
  },
  imageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: WHITE,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  imageMetaRow: { flexDirection: 'row', gap: 8 },
  metaChip: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: { color: WHITE, fontSize: 11, fontWeight: '700' },

  cardScroll: { flex: 1 },
  cardScrollContent: { padding: 14, gap: 10 },

  emotionalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: GREEN + '0d',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  emotionalIcon: { fontSize: 14 },
  emotionalText: { flex: 1, fontSize: 12, color: '#475569', fontStyle: 'italic', lineHeight: 17 },

  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyRowLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', width: 50 },
  energyBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  energyBarFill: { height: '100%', borderRadius: BorderRadius.full },
  energyRowValue: { fontSize: 11, fontWeight: '700', width: 55, textAlign: 'right' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoRowIcon: { fontSize: 14, marginTop: 1 },
  infoRowText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },

  benefitsBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, gap: 5 },
  benefitsLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 },
  benefitsText: { fontSize: 13, color: '#334155', lineHeight: 19 },

  macrosRow: { flexDirection: 'row', gap: 6 },
  macroPill: {
    flex: 1, backgroundColor: '#f8fafc',
    borderRadius: 12, padding: 8,
    alignItems: 'center', gap: 1,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  macroIcon: { fontSize: 13 },
  macroVal: { fontSize: 13, fontWeight: '900', color: GREEN_DARK },
  macroUnit: { fontSize: 9, color: '#94a3b8' },

  seal: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  sealText: { fontSize: 11, color: '#15803d', fontWeight: '600' },

  // ── FOOTER ESTÁTICO ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  discardBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff1f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  discardBtnIcon: { fontSize: 24, color: '#ef4444', fontWeight: '900', lineHeight: 28 },
  discardBtnText: { fontSize: 10, color: '#ef4444', fontWeight: '700' },

  footerCenter: { alignItems: 'center', gap: 2 },
  footerHintTop: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  footerHintBottom: { fontSize: 18, color: '#cbd5e1', fontWeight: '700' },

  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    elevation: 4,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptBtnIcon: { fontSize: 24, color: WHITE, fontWeight: '900', lineHeight: 28 },
  acceptBtnText: { fontSize: 10, color: WHITE, fontWeight: '700' },

  // Feedback
  feedbackAsk: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textAlign: 'center' },
  feedbackRow: { flexDirection: 'row', gap: 10, width: '100%' },
  feedbackBtn: {
    flex: 1, backgroundColor: '#f8fafc',
    borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  feedbackEmoji: { fontSize: 22 },
  feedbackBtnText: { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },
});