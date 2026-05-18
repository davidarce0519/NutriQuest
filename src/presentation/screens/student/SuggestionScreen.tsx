import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Swiper from 'react-native-deck-swiper';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import {
  generateMultipleSuggestionsUseCase,
  respondSuggestionUseCase,
  feedbackSuggestionUseCase,
  getUserRestrictionsUseCase,
} from '../../../domain/usecases/suggestion';
import { Suggestion } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { StudentStackParams } from '../../navigation/StudentNavigator';

const { width: W, height: H } = Dimensions.get('window');

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const ENERGY_LABELS = ['', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];
const GOAL_LABELS: Record<string, string> = {
  mejorar_energia:       '⚡ Energía',
  mejorar_concentracion: '🧠 Concentración',
  mantener_peso:         '⚖️ Mantener peso',
  bienestar_general:     '🌿 Bienestar',
  perder_peso:           '📉 Perder peso',
  ganar_masa:            '💪 Ganar masa',
};
const DIET_LABELS: Record<string, string> = {
  omnivora:     'Omnívora',
  vegetariana:  'Vegetariana',
  vegana:       'Vegana',
  flexitariana: 'Flexitariana',
  otra:         'Otra',
};

const FOOTER_H = 110;

const PARTICLE_XS = [
  W * 0.1, W * 0.28, W * 0.47, W * 0.65, W * 0.83,
];

// ── Partícula de aceptación ──────────────────────────────────────────────────
interface ParticleProps {
  x: number;
  delay: number;
}

const AcceptParticle = ({ x, delay }: ParticleProps) => {
  const translateYAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacityAnim,    { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.delay(350),
          Animated.timing(opacityAnim,    { toValue: 0, duration: 450, useNativeDriver: true }),
        ]),
        Animated.timing(translateYAnim, { toValue: 220, duration: 900, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        s.particle,
        {
          position:  'absolute',
          left:      x,
          top:       0,
          opacity:   opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      🌿
    </Animated.Text>
  );
};

// ── Dot animado ──────────────────────────────────────────────────────────────
interface DotProps {
  isActive: boolean;
  green: string;
  border: string;
}

const AnimatedDot = ({ isActive, green, border }: DotProps) => {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const wasActive  = useRef(isActive);

  useEffect(() => {
    if (wasActive.current && !isActive) {
      Animated.spring(scaleAnim, {
        toValue:   0.1,
        useNativeDriver: true,
        mass:      0.5,
        stiffness: 300,
        damping:   15,
      }).start();
    } else if (!wasActive.current && isActive) {
      scaleAnim.setValue(1);
    }
    wasActive.current = isActive;
  }, [isActive]);

  return (
    <Animated.View
      style={[
        s.counterDot,
        { backgroundColor: isActive ? green : border },
        { transform: [{ scale: scaleAnim }] },
      ]}
    />
  );
};

// ── Pantalla principal ───────────────────────────────────────────────────────
export const SuggestionScreen = () => {
  const { isDark } = useTheme();
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

  const navigation = useNavigation<NativeStackNavigationProp<StudentStackParams>>();
  const user    = useAuthStore((s) => s.user);
  const profile = useHealthStore((s) => s.profile);
  const insets  = useSafeAreaInsets();

  const swiperRef = useRef<any>(null);

  const [cards, setCards]                   = useState<Suggestion[]>([]);
  const [loading, setLoading]               = useState(false);
  const [allGone, setAllGone]               = useState(false);
  const [showFeedback, setShowFeedback]     = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<Suggestion | null>(null);
  const [remaining, setRemaining]           = useState(0);
  const [restrictions, setRestrictions]     = useState<string[]>([]);
  const [seenFoods, setSeenFoods]           = useState<string[]>([]);
  const [showAcceptEffect, setShowAcceptEffect] = useState(false);

  // ── Animated values ────────────────────────────────────────────
  const acceptScaleAnim        = useRef(new Animated.Value(1)).current;
  const feedbackEmojiScaleAnim = useRef(new Animated.Value(0)).current;
  const stateCardOpacity       = useRef(new Animated.Value(0)).current;
  const stateCardY             = useRef(new Animated.Value(60)).current;
  const feedbackBtn0Scale      = useRef(new Animated.Value(0)).current;
  const feedbackBtn1Scale      = useRef(new Animated.Value(0)).current;
  const feedbackBtn2Scale      = useRef(new Animated.Value(0)).current;

  // Pulse continuo del botón aceptar
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(acceptScaleAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(acceptScaleAnim, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Bounce + stagger al aparecer el feedback
  useEffect(() => {
    if (showFeedback) {
      feedbackEmojiScaleAnim.setValue(0);
      Animated.spring(feedbackEmojiScaleAnim, {
        toValue: 1.0,
        useNativeDriver: true,
        mass: 0.6,
        stiffness: 200,
        damping: 10,
      }).start();

      feedbackBtn0Scale.setValue(0);
      feedbackBtn1Scale.setValue(0);
      feedbackBtn2Scale.setValue(0);
      Animated.stagger(150, [
        Animated.spring(feedbackBtn0Scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(feedbackBtn1Scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(feedbackBtn2Scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [showFeedback]);

  // Slide-in de tarjetas de estado
  const activeCard =
    loading            ? 'loading'  :
    showFeedback       ? 'feedback' :
    allGone            ? 'allGone'  :
    cards.length === 0 ? 'initial'  :
    'none';

  useEffect(() => {
    if (activeCard !== 'none') {
      stateCardOpacity.setValue(0);
      stateCardY.setValue(60);
      Animated.parallel([
        Animated.timing(stateCardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(stateCardY, {
          toValue: 0, useNativeDriver: true,
          mass: 0.8, stiffness: 150, damping: 15,
        }),
      ]).start();
    }
  }, [activeCard]);

  useEffect(() => {
    if (!user) return;
    getUserRestrictionsUseCase(user.id)
      .then(setRestrictions)
      .catch(() => {});
  }, [user]);

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
      setSeenFoods([]);
      const results = await generateMultipleSuggestionsUseCase(user.id, profile, false, 3);
      setCards(results);
      setRemaining(results.length);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipedRight = async (index: number) => {
    const sg = cards[index];
    if (!sg) return;
    setRemaining(r => r - 1);
    setSeenFoods(prev => [...prev, sg.food.name]);
    setShowAcceptEffect(true);
    setTimeout(() => setShowAcceptEffect(false), 1200);
    try {
      await respondSuggestionUseCase(sg.id, 'aceptada');
      setLastSuggestion(sg);
      setShowFeedback(true);
    } catch { }
  };

  const handleSwipedLeft = async (index: number) => {
    const sg = cards[index];
    if (!sg) return;
    setRemaining(r => r - 1);
    setSeenFoods(prev => [...prev, sg.food.name]);
    try { await respondSuggestionUseCase(sg.id, 'descartada'); } catch { }
  };

  const handleSwipedAll = () => setAllGone(true);

  const handleFeedback = async (feedback: 'me_gusta' | 'no_me_gusta' | 'no_aplica') => {
    if (!lastSuggestion) return;
    try {
      await feedbackSuggestionUseCase(lastSuggestion.id, feedback);
      setShowFeedback(false);
    } catch { }
  };

  // ── CARD ──────────────────────────────────────────────────────
  const renderCard = (suggestion: Suggestion) => {
    if (!suggestion) return null;
    const eColor = suggestion.food.energyLevel
      ? ENERGY_COLORS[suggestion.food.energyLevel] : '#94a3b8';
    const eLabel = suggestion.food.energyLevel
      ? ENERGY_LABELS[suggestion.food.energyLevel] : '';
    const hasDetail = !!(suggestion.food.nutritionalBenefits || suggestion.food.ingredientsSummary);

    return (
      <View style={[s.card, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.4 : 0.12 }]}>
        <View style={s.imageWrap}>
          {suggestion.food.imageUrl ? (
            <Image source={{ uri: suggestion.food.imageUrl }} style={s.foodImage} resizeMode="cover" />
          ) : (
            <View style={[s.imageFallback, { backgroundColor: green + '12' }]}>
              <Text style={s.imageFallbackEmoji}>🥗</Text>
            </View>
          )}
          <View style={s.imageGradient} />
          <View style={s.imageBottomInfo}>
            <Text style={s.imageTitle}>{suggestion.food.name}</Text>
          </View>
        </View>

        <ScrollView
          style={s.cardScroll}
          contentContainerStyle={s.cardScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {suggestion.emotionalMessage && (
            <View style={[s.emotionalRow, { backgroundColor: green + '0d', borderLeftColor: green }]}>
              <Text style={s.emotionalIcon}>💬</Text>
              <Text style={[s.emotionalText, { color: textSecondary }]}>
                {suggestion.emotionalMessage}
              </Text>
            </View>
          )}

          <View style={s.prepChips}>
            {suggestion.food.prepTimeMinutes === 0 && (
              <View style={[s.prepChip, { backgroundColor: green + '18', borderColor: green + '44' }]}>
                <Text style={[s.prepChipText, { color: green }]}>✓ Sin preparación</Text>
              </View>
            )}
            {suggestion.food.prepTimeMinutes !== undefined &&
             suggestion.food.prepTimeMinutes > 0 &&
             suggestion.food.prepTimeMinutes <= 5 && (
              <View style={[s.prepChip, { backgroundColor: green + '18', borderColor: green + '44' }]}>
                <Text style={[s.prepChipText, { color: green }]}>✓ Listo en 5 min</Text>
              </View>
            )}
            {suggestion.food.isQuick && suggestion.food.prepTimeMinutes !== 0 && (
              <View style={[s.prepChip, { backgroundColor: green + '18', borderColor: green + '44' }]}>
                <Text style={[s.prepChipText, { color: green }]}>⚡ Snack rápido</Text>
              </View>
            )}
            {suggestion.food.energyLevel && (
              <View style={[s.prepChip, { backgroundColor: eColor + '20', borderColor: eColor + '44' }]}>
                <Text style={[s.prepChipText, { color: eColor }]}>⚡ {eLabel}</Text>
              </View>
            )}
          </View>

          {suggestion.food.energyLevel && (
            <View style={s.energyRow}>
              <Text style={[s.energyRowLabel, { color: textMuted }]}>Energía</Text>
              <View style={[s.energyBarBg, { backgroundColor: border }]}>
                <View style={[
                  s.energyBarFill,
                  { width: `${(suggestion.food.energyLevel / 5) * 100}%` as any, backgroundColor: eColor },
                ]} />
              </View>
            </View>
          )}

          {suggestion.food.ingredientsSummary && (
            <View style={s.infoRow}>
              <Text style={s.infoRowIcon}>🛒</Text>
              <Text style={[s.infoRowText, { color: textSecondary }]}>
                {suggestion.food.ingredientsSummary}
              </Text>
            </View>
          )}

          {suggestion.food.nutritionalBenefits && (
            <View style={[s.benefitsBox, { backgroundColor: inputBg }]}>
              <Text style={[s.benefitsLabel, { color: textSecondary }]}>¿Por qué este alimento?</Text>
              <Text style={[s.benefitsText, { color: textPrimary }]}>
                {suggestion.food.nutritionalBenefits}
              </Text>
            </View>
          )}

          {(suggestion.food.caloriesKcal || suggestion.food.proteinG) && (
            <View style={s.macrosRow}>
              {[
                { val: suggestion.food.caloriesKcal, unit: 'kcal', icon: '🔥', show: !!suggestion.food.caloriesKcal },
                { val: `${suggestion.food.proteinG}g`, unit: 'prot', icon: '💪', show: !!suggestion.food.proteinG },
                { val: `${suggestion.food.carbsG}g`,   unit: 'carbs', icon: '⚡', show: !!suggestion.food.carbsG },
                { val: `${suggestion.food.fatG}g`,     unit: 'gras',  icon: '🫒', show: !!suggestion.food.fatG },
              ].filter(m => m.show).map(m => (
                <View key={m.unit} style={[s.macroPill, { backgroundColor: inputBg, borderColor: border }]}>
                  <Text style={s.macroIcon}>{m.icon}</Text>
                  <Text style={[s.macroVal, { color: textPrimary }]}>{m.val}</Text>
                  <Text style={[s.macroUnit, { color: textMuted }]}>{m.unit}</Text>
                </View>
              ))}
            </View>
          )}

          {suggestion.food.validatorName && (
            <View style={[s.seal, {
              backgroundColor: isDark ? green + '20' : '#f0fdf4',
              borderColor: isDark ? green + '40' : '#bbf7d0',
            }]}>
              <Text style={[s.sealText, { color: green }]}>
                ✅ Validado por {suggestion.food.validatorName}
              </Text>
            </View>
          )}

          {hasDetail && (
            <TouchableOpacity
              style={[s.detailBtn, { borderColor: green, backgroundColor: green + '10' }]}
              onPress={() => navigation.navigate('DetalleAlimento', { food: suggestion.food })}
              activeOpacity={0.8}
            >
              <Text style={[s.detailBtnText, { color: green }]}>Ver receta completa →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  const HEADER_H    = 80;
  const CARD_AREA_H = H - HEADER_H - FOOTER_H - insets.top - insets.bottom - 16;

  const stateCardAnimStyle = {
    opacity:   stateCardOpacity,
    transform: [{ translateY: stateCardY }],
  };

  const feedbackBtnScales = [feedbackBtn0Scale, feedbackBtn1Scale, feedbackBtn2Scale];

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />

      <SafeAreaView style={s.safe}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={[s.headerSub, { color: greenLight }]}>Tu momento de cuidarte</Text>
            <Text style={s.headerTitle}>Sugerencias 🍎</Text>
          </View>
          {profile?.nutritionalGoal && (
            <View style={s.goalBadge}>
              <Text style={s.goalBadgeText}>{GOAL_LABELS[profile.nutritionalGoal]}</Text>
            </View>
          )}
        </View>

        {/* ── ÁREA CENTRAL ── */}
        <View style={[s.centerArea, { height: CARD_AREA_H }]}>

          {/* Estado inicial */}
          {cards.length === 0 && !loading && (
            <Animated.View
              style={[s.stateCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.35 : 0.08 }, stateCardAnimStyle]}
            >
              <View style={[s.stateCircle, { backgroundColor: green + '12' }]}>
                <Text style={s.stateEmoji}>🥗</Text>
              </View>
              <Text style={[s.stateTitle, { color: textPrimary }]}>¿Qué comemos hoy?</Text>
              {profile?.dietType && (
                <Text style={[s.dietTypeText, { color: textMuted }]}>
                  Dieta: {DIET_LABELS[profile.dietType] ?? profile.dietType}
                </Text>
              )}
              <Text style={[s.stateSub, { color: textSecondary }]}>
                Desliza derecha para aceptar,{'\n'}izquierda para descartar.
              </Text>
              {restrictions.length > 0 && (
                <View style={s.restrictionChips}>
                  {restrictions.slice(0, 4).map((r, i) => (
                    <View key={i} style={[s.restrictionChip, { backgroundColor: inputBg, borderColor: border }]}>
                      <Text style={[s.restrictionChipText, { color: textSecondary }]}>🚫 {r}</Text>
                    </View>
                  ))}
                  {restrictions.length > 4 && (
                    <Text style={[s.restrictionMore, { color: textMuted }]}>+{restrictions.length - 4} más</Text>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={[s.startBtn, { backgroundColor: isDark ? green : greenDark }]}
                onPress={loadCards}
                activeOpacity={0.88}
              >
                <Text style={[s.startBtnText, { color: isDark ? '#0f172a' : '#ffffff' }]}>
                  Empezar →
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Loading */}
          {loading && (
            <Animated.View
              style={[s.stateCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.35 : 0.08 }, stateCardAnimStyle]}
            >
              <ActivityIndicator color={green} size="large" />
              <Text style={[s.loadingText, { color: textPrimary }]}>
                Preparando tus sugerencias...
              </Text>
              <Text style={[s.loadingSub, { color: textSecondary }]}>
                Aplicando tus preferencias y alergias
              </Text>
            </Animated.View>
          )}

          {/* Swiper */}
          {cards.length > 0 && !allGone && !loading && !showFeedback && (
            <>
              <View style={s.counterRow}>
                {cards.map((_, i) => (
                  <AnimatedDot
                    key={i}
                    isActive={i < remaining}
                    green={green}
                    border={border}
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
                        color: '#ffffff',
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
                        backgroundColor: green,
                        color: '#ffffff',
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

          {/* Feedback — emoji con bounce + botones escalonados */}
          {showFeedback && lastSuggestion && (
            <Animated.View
              style={[s.stateCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.35 : 0.08 }, stateCardAnimStyle]}
            >
              <Animated.Text style={[s.stateEmoji, { transform: [{ scale: feedbackEmojiScaleAnim }] }]}>
                🎉
              </Animated.Text>
              <Text style={[s.stateTitle, { color: textPrimary }]}>¡Excelente decisión!</Text>
              {lastSuggestion.food.imageUrl ? (
                <Image
                  source={{ uri: lastSuggestion.food.imageUrl }}
                  style={s.feedbackFoodImage}
                />
              ) : (
                <View style={[s.feedbackFoodImageFallback, { backgroundColor: green + '18' }]}>
                  <Text style={{ fontSize: 28 }}>🥗</Text>
                </View>
              )}
              <Text style={[s.stateSub, { color: textSecondary }]}>
                {lastSuggestion.food.name}
              </Text>
              {(lastSuggestion.food.caloriesKcal || lastSuggestion.food.proteinG) && (
                <Text style={[s.feedbackMacros, { color: textMuted }]}>
                  {lastSuggestion.food.caloriesKcal ? `🔥 ${lastSuggestion.food.caloriesKcal} kcal` : ''}
                  {lastSuggestion.food.caloriesKcal && lastSuggestion.food.proteinG ? ' · ' : ''}
                  {lastSuggestion.food.proteinG ? `💪 ${lastSuggestion.food.proteinG}g prot` : ''}
                </Text>
              )}
              <Text style={[s.feedbackAsk, { color: textMuted }]}>
                ¿Cómo calificarías esta sugerencia?
              </Text>
              <View style={s.feedbackRow}>
                {([
                  { key: 'me_gusta',    emoji: '👍', label: 'Me gustó' },
                  { key: 'no_me_gusta', emoji: '👎', label: 'No me gustó' },
                  { key: 'no_aplica',   emoji: '🤷', label: 'No aplica' },
                ] as const).map((f, i) => (
                  <Animated.View
                    key={f.key}
                    style={{ flex: 1, transform: [{ scale: feedbackBtnScales[i] }] }}
                  >
                    <TouchableOpacity
                      style={[s.feedbackBtn, { backgroundColor: inputBg, borderColor: border }]}
                      onPress={() => handleFeedback(f.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.feedbackEmoji}>{f.emoji}</Text>
                      <Text style={[s.feedbackBtnText, { color: textSecondary }]}>{f.label}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Se acabaron */}
          {allGone && !showFeedback && (
            <Animated.View
              style={[s.stateCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.35 : 0.08 }, stateCardAnimStyle]}
            >
              <Text style={s.stateEmoji}>✨</Text>
              <Text style={[s.stateTitle, { color: textPrimary }]}>¡Ya viste todas!</Text>
              <Text style={[s.stateSub, { color: textSecondary }]}>¿Quieres ver más opciones?</Text>
              {seenFoods.length > 0 && (
                <View style={s.seenFoodsWrap}>
                  <Text style={[s.seenFoodsLabel, { color: textMuted }]}>Viste:</Text>
                  <View style={s.seenChips}>
                    {seenFoods.map((name, i) => (
                      <View key={i} style={[s.seenChip, { backgroundColor: inputBg, borderColor: border }]}>
                        <Text style={[s.seenChipText, { color: textSecondary }]}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={[s.startBtn, { backgroundColor: isDark ? green : greenDark }]}
                onPress={loadCards}
                activeOpacity={0.88}
              >
                <Text style={[s.startBtnText, { color: isDark ? '#0f172a' : '#ffffff' }]}>
                  Más sugerencias →
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </View>

        {/* ── FOOTER ── */}
        {cards.length > 0 && !allGone && !showFeedback && !loading && (
          <View style={[
            s.footer,
            {
              backgroundColor: cardBg,
              borderTopColor:  border,
              paddingBottom:   Math.max(insets.bottom, 12),
            },
          ]}>
            <Animated.View style={{ transform: [{ scale: acceptScaleAnim }] }}>
              <TouchableOpacity
                style={[s.acceptBtn, { backgroundColor: green }]}
                onPress={() => swiperRef.current?.swipeRight()}
                activeOpacity={0.85}
              >
                <Text style={s.acceptBtnIcon}>✓</Text>
                <Text style={s.acceptBtnText}>Aceptar</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={s.footerCenter}>
              <Text style={[s.footerHintTop, { color: textMuted }]}>desliza</Text>
              <Text style={[s.footerHintBottom, { color: border }]}>← ó →</Text>
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

      {/* ── OVERLAY PARTÍCULAS al aceptar ── */}
      {showAcceptEffect && (
        <View style={s.acceptOverlay} pointerEvents="none">
          {PARTICLE_XS.map((x, i) => (
            <AcceptParticle key={i} x={x} delay={i * 90} />
          ))}
        </View>
      )}

    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 160,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    height: 80,
  },
  headerSub:   { fontSize: 12, fontWeight: '600' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  goalBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalBadgeText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },

  centerArea: { flex: 1, paddingHorizontal: 14 },

  stateCard: {
    flex: 1,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
  },
  stateCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  stateEmoji:   { fontSize: 48 },
  stateTitle:   { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  stateSub:     { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  dietTypeText: { fontSize: 12, fontWeight: '600' },

  restrictionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  restrictionChip: {
    borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  restrictionChipText: { fontSize: 11, fontWeight: '600' },
  restrictionMore:     { fontSize: 11 },

  startBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: '800' },
  loadingText:  { fontSize: 16, fontWeight: '700' },
  loadingSub:   { fontSize: 13 },

  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  counterDot: { width: 8, height: 8, borderRadius: 4 },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    flex: 1,
  },
  imageWrap:     { position: 'relative' },
  foodImage:     { width: '100%', height: 200 },
  imageFallback: {
    width: '100%', height: 140,
    alignItems: 'center', justifyContent: 'center',
  },
  imageFallbackEmoji: { fontSize: 56 },
  imageGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageBottomInfo: { position: 'absolute', bottom: 12, left: 14, right: 14 },
  imageTitle: {
    fontSize: 22, fontWeight: '900', color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  cardScroll:        { flex: 1 },
  cardScrollContent: { padding: 14, gap: 10 },

  emotionalRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, padding: 10, borderLeftWidth: 3,
  },
  emotionalIcon: { fontSize: 14 },
  emotionalText: { flex: 1, fontSize: 12, fontStyle: 'italic', lineHeight: 17 },

  prepChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prepChip:     { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  prepChipText: { fontSize: 11, fontWeight: '700' },

  energyRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyRowLabel: { fontSize: 11, fontWeight: '600', width: 50 },
  energyBarBg: {
    flex: 1, height: 6, borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  energyBarFill: { height: '100%', borderRadius: BorderRadius.full },

  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoRowIcon: { fontSize: 14, marginTop: 1 },
  infoRowText: { flex: 1, fontSize: 12, lineHeight: 18 },

  benefitsBox:   { borderRadius: 12, padding: 12, gap: 5 },
  benefitsLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  benefitsText:  { fontSize: 13, lineHeight: 19 },

  macrosRow: { flexDirection: 'row', gap: 6 },
  macroPill: {
    flex: 1, borderRadius: 12, padding: 8,
    alignItems: 'center', gap: 1, borderWidth: 1,
  },
  macroIcon: { fontSize: 13 },
  macroVal:  { fontSize: 13, fontWeight: '900' },
  macroUnit: { fontSize: 9 },

  seal:     { borderRadius: 10, padding: 8, borderWidth: 1 },
  sealText: { fontSize: 11, fontWeight: '600' },

  detailBtn: {
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    paddingVertical: 10, alignItems: 'center',
    marginTop: 2,
  },
  detailBtnText: { fontSize: 13, fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  discardBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff1f2', borderWidth: 2, borderColor: '#fca5a5',
    alignItems: 'center', justifyContent: 'center', gap: 1,
    elevation: 3, shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6,
  },
  discardBtnIcon: { fontSize: 24, color: '#ef4444', fontWeight: '900', lineHeight: 28 },
  discardBtnText: { fontSize: 10, color: '#ef4444', fontWeight: '700' },

  footerCenter:     { alignItems: 'center', gap: 2 },
  footerHintTop:    { fontSize: 11, fontWeight: '600' },
  footerHintBottom: { fontSize: 18, fontWeight: '700' },

  acceptBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', gap: 1,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  acceptBtnIcon: { fontSize: 24, color: '#ffffff', fontWeight: '900', lineHeight: 28 },
  acceptBtnText: { fontSize: 10, color: '#ffffff', fontWeight: '700' },

  feedbackFoodImage: { width: 60, height: 60, borderRadius: 12 },
  feedbackFoodImageFallback: {
    width: 60, height: 60, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  feedbackMacros: { fontSize: 13, fontWeight: '700' },
  feedbackAsk:    { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  feedbackRow:    { flexDirection: 'row', gap: 10, width: '100%' },
  feedbackBtn: {
    borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  feedbackEmoji:   { fontSize: 22 },
  feedbackBtnText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  seenFoodsWrap:  { gap: 6, alignItems: 'center', width: '100%' },
  seenFoodsLabel: { fontSize: 11, fontWeight: '700' },
  seenChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  seenChip:       { borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  seenChipText:   { fontSize: 12, fontWeight: '600' },

  acceptOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  particle: { fontSize: 28 },
});
