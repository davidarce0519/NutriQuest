import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { completeOnboardingUseCase } from '../../../domain/usecases/auth';
import { StudentAvatar } from '../../components/StudentAvatar';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';
const BG         = '#f5f5f0';
const WHITE      = '#ffffff';

const LEAF_X:        readonly number[] = [30, 60, 120, 160, 200, 260];
const LEAF_Y:        readonly number[] = [40, 80,  30,  70,  50,  90];
const LEAF_DURATION: readonly number[] = [2000, 2400, 1800, 2200, 2600, 2100];

interface SlideData {
  id: string;
  dark: boolean;
  title: string;
  subtitle?: string;
  description: string;
  btnLabel?: string;
}

const STUDENT_SLIDES: SlideData[] = [
  {
    id: 'welcome',
    dark: true,
    title: 'Bienvenido a NutriQuest',
    subtitle: 'Tu guía nutricional universitaria',
    description: 'Toma mejores decisiones alimentarias y cuida tu bienestar mientras estudias.',
  },
  {
    id: 'swipe',
    dark: false,
    title: 'Desliza para decidir',
    description: 'Recibe sugerencias personalizadas. Desliza derecha para aceptar ✓, izquierda para descartar ✕',
  },
  {
    id: 'avatar',
    dark: false,
    title: 'Tu avatar evoluciona contigo',
    description: 'Cada decisión saludable hace crecer tu avatar. De 🌱 Semilla a 🌲 Bosque.',
  },
  {
    id: 'profile',
    dark: true,
    title: 'Completa tu perfil',
    description: 'Para sugerencias más precisas necesitamos tu peso, talla y objetivo nutricional.',
    btnLabel: '¡Empezar!',
  },
];

const NUTRITIONIST_SLIDES: SlideData[] = [
  {
    id: 'welcome',
    dark: true,
    title: 'Bienvenido, Nutricionista',
    subtitle: 'Plataforma de gestión nutricional',
    description: 'Gestiona el catálogo de alimentos y valida sugerencias para los estudiantes.',
  },
  {
    id: 'catalog',
    dark: false,
    title: 'Gestiona el catálogo',
    description: 'Crea, edita y valida alimentos. Tu sello ✅ garantiza la calidad de las sugerencias.',
  },
  {
    id: 'validation',
    dark: true,
    title: 'Tu validación importa',
    description: 'Los alimentos validados por ti tienen prioridad en las sugerencias a estudiantes.',
    btnLabel: '¡Comenzar!',
  },
];

export const OnboardingScreen = () => {
  const { user, setUser } = useAuthStore();
  const { isDark } = useTheme();

  const slides = user?.role === 'nutricionista' ? NUTRITIONIST_SLIDES : STUDENT_SLIDES;

  const [currentIndex, setCurrentIndex]       = useState(0);
  const [nextIndex, setNextIndex]             = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Transition ─────────────────────────────────────────────
  const slideOutAnim = useRef(new Animated.Value(0)).current;
  const slideInAnim  = useRef(new Animated.Value(SCREEN_W)).current;
  const textFadeAnim = useRef(new Animated.Value(1)).current;

  // ── Slide 1 — floating leaves ──────────────────────────────
  const floatAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;

  // ── Slide 2 — swipe demo ───────────────────────────────────
  const cardTiltAnim      = useRef(new Animated.Value(0)).current;
  const leftArrowOpacity  = useRef(new Animated.Value(1)).current;
  const rightArrowOpacity = useRef(new Animated.Value(0)).current;

  // ── Slide 3 — avatar progress ──────────────────────────────
  const avatarProgressAnim = useRef(new Animated.Value(0)).current;

  // ── Slide 4 — profile cards ────────────────────────────────
  const card1Anim  = useRef(new Animated.Value(0)).current;
  const card2Anim  = useRef(new Animated.Value(0)).current;
  const card3Anim  = useRef(new Animated.Value(0)).current;
  const card1XAnim = useRef(new Animated.Value(-20)).current;
  const card2XAnim = useRef(new Animated.Value(-20)).current;
  const card3XAnim = useRef(new Animated.Value(-20)).current;

  // ── Nutritionist catalog ───────────────────────────────────
  const catalogAnims = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0))
  ).current;

  // ── Nutritionist validation ────────────────────────────────
  const validatePulse = useRef(new Animated.Value(1)).current;

  // ── Loop tracker ───────────────────────────────────────────
  const running = useRef<Animated.CompositeAnimation[]>([]);

  const stopAll = () => {
    running.current.forEach(a => a.stop());
    running.current = [];
  };

  // ── Start animations per slide ─────────────────────────────
  useEffect(() => {
    stopAll();
    const id = slides[currentIndex]?.id;

    if (id === 'welcome') {
      const loops = floatAnims.map((anim, i) => {
        anim.setValue(0);
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: -12, duration: LEAF_DURATION[i], easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0,   duration: LEAF_DURATION[i], easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        );
        loop.start();
        return loop;
      });
      running.current.push(...loops);
    }

    if (id === 'swipe') {
      cardTiltAnim.setValue(0);
      leftArrowOpacity.setValue(1);
      rightArrowOpacity.setValue(0);

      const tilt = Animated.loop(
        Animated.sequence([
          Animated.timing(cardTiltAnim, { toValue: -3, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(cardTiltAnim, { toValue: 0,  duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(cardTiltAnim, { toValue: 3,  duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(cardTiltAnim, { toValue: 0,  duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      tilt.start();

      const arrows = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(leftArrowOpacity,  { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(rightArrowOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
          Animated.delay(600),
          Animated.parallel([
            Animated.timing(rightArrowOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(leftArrowOpacity,  { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
          Animated.delay(600),
        ])
      );
      arrows.start();
      running.current.push(tilt, arrows);
    }

    if (id === 'avatar') {
      avatarProgressAnim.setValue(0);
      Animated.timing(avatarProgressAnim, {
        toValue: 75,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }

    if (id === 'profile') {
      [card1Anim, card2Anim, card3Anim].forEach(a => a.setValue(0));
      [card1XAnim, card2XAnim, card3XAnim].forEach(a => a.setValue(-20));
      Animated.sequence([
        Animated.parallel([
          Animated.timing(card1Anim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(card1XAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(card2Anim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(card2XAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(card3Anim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(card3XAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    }

    if (id === 'catalog') {
      catalogAnims.forEach((anim, i) => {
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 300, delay: i * 150, useNativeDriver: true }).start();
      });
    }

    if (id === 'validation') {
      validatePulse.setValue(1);
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(validatePulse, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(validatePulse, { toValue: 1.0,  duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      running.current.push(pulse);
    }

    return stopAll;
  }, [currentIndex]);

  // ── Interpolations ─────────────────────────────────────────
  const cardTiltInterp = cardTiltAnim.interpolate({
    inputRange: [-3, 0, 3],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  const progressWidthInterp = avatarProgressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // ── Logic ──────────────────────────────────────────────────
  const handleComplete = async () => {
    if (!user) return;
    try {
      await completeOnboardingUseCase(user.id);
    } catch {
      // Continuar aunque falle el servidor
    }
    setUser({ ...user, onboardingCompleted: true });
  };

  const handleNext = () => {
    if (isTransitioning) return;
    const next = currentIndex + 1;
    if (next >= slides.length) return;

    setIsTransitioning(true);
    setNextIndex(next);
    slideOutAnim.setValue(0);
    slideInAnim.setValue(SCREEN_W);

    Animated.timing(textFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      Animated.parallel([
        Animated.timing(slideOutAnim, { toValue: -SCREEN_W, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(slideInAnim,  { toValue: 0,         duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(next);
        setNextIndex(null);
        setIsTransitioning(false);
        slideOutAnim.setValue(0);
        slideInAnim.setValue(SCREEN_W);
        Animated.timing(textFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    });
  };

  // ── Visual zone renderer ───────────────────────────────────
  const renderVisual = (idx: number): React.ReactNode => {
    const slide = slides[idx];
    if (!slide) return null;
    const { id, dark } = slide;
    const border    = isDark ? '#334155' : '#e2e8f0';
    const green     = isDark ? '#22c55e' : GREEN;
    const lightCard = isDark ? '#1e293b' : WHITE;
    const zoneBg    = dark ? GREEN_DARK : (isDark ? '#0f172a' : BG);

    switch (id) {

      case 'welcome':
        return (
          <View style={[s.visualZone, { backgroundColor: zoneBg }]}>
            <Image
              source={require('../../../../assets/logo1.0.png')}
              style={s.logo}
              resizeMode="contain"
            />
            {LEAF_X.map((x, i) => (
              <Animated.View
                key={i}
                style={[s.leaf, { left: x, top: LEAF_Y[i], transform: [{ translateY: floatAnims[i] }] }]}
              >
                <Text style={s.leafEmoji}>🌿</Text>
              </Animated.View>
            ))}
          </View>
        );

      case 'swipe': {
        const cardBack = isDark ? '#334155' : '#e2e8f0';
        return (
          <View style={[s.visualZone, { backgroundColor: zoneBg }]}>
            <View style={s.swipeDemo}>
              <View style={[s.demoCard, s.demoCardBack, { backgroundColor: cardBack }]}>
                <Text style={[s.demoCardBackText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Ensalada mediterránea
                </Text>
              </View>
              <Animated.View
                style={[s.demoCard, { backgroundColor: green, transform: [{ rotate: cardTiltInterp }] }]}
              >
                <Text style={s.demoCardTitle}>🥗 Bowl de quinoa</Text>
                <Text style={s.demoCardSub}>⏱ 10 min · 320 kcal</Text>
              </Animated.View>
              <View style={s.arrowRow}>
                <Animated.View style={{ opacity: leftArrowOpacity }}>
                  <Text style={s.arrowLeft}>← Descartar</Text>
                </Animated.View>
                <Animated.View style={{ opacity: rightArrowOpacity }}>
                  <Text style={s.arrowRight}>Aceptar →</Text>
                </Animated.View>
              </View>
            </View>
          </View>
        );
      }

      case 'avatar': {
        const chipLabels = ['🌱', '🌿', '🌳', '🌲'];
        const activeChip = 2;
        return (
          <View style={[s.visualZone, { backgroundColor: zoneBg }]}>
            <StudentAvatar size={140} animated={true} currentLevel={2} streakDays={7} />
            <View style={[s.progressBarBg, { backgroundColor: border }]}>
              <Animated.View style={[s.progressBarFill, { width: progressWidthInterp, backgroundColor: green }]} />
            </View>
            <View style={s.levelChips}>
              {chipLabels.map((label, i) => (
                <View
                  key={i}
                  style={[
                    s.levelChip,
                    {
                      backgroundColor: i === activeChip ? green + '20' : border,
                      borderColor:     i === activeChip ? green : 'transparent',
                      borderWidth:     i === activeChip ? 1.5 : 0,
                    },
                  ]}
                >
                  <Text style={[s.levelChipText, { color: i === activeChip ? green : (isDark ? '#94a3b8' : '#64748b') }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      }

      case 'profile':
        return (
          <View style={[s.visualZone, { backgroundColor: zoneBg }]}>
            {[
              { anim: card1Anim, xAnim: card1XAnim, emoji: '⚖️', label: 'Peso y talla' },
              { anim: card2Anim, xAnim: card2XAnim, emoji: '🎯', label: 'Objetivo nutricional' },
              { anim: card3Anim, xAnim: card3XAnim, emoji: '🏃', label: 'Nivel de actividad' },
            ].map((item, i) => (
              <Animated.View
                key={i}
                style={[s.profileCard, { opacity: item.anim, transform: [{ translateX: item.xAnim }] }]}
              >
                <Text style={s.profileCardEmoji}>{item.emoji}</Text>
                <Text style={s.profileCardLabel}>{item.label}</Text>
              </Animated.View>
            ))}
          </View>
        );

      case 'catalog': {
        const foods = [
          { emoji: '🥗', name: 'Ensalada', badge: '✅' },
          { emoji: '🥑', name: 'Guacamole', badge: null },
          { emoji: '🍌', name: 'Batido', badge: null },
          { emoji: '🥦', name: 'Brócoli', badge: '⏳' },
        ] as const;
        return (
          <View style={[s.visualZone, { backgroundColor: zoneBg }]}>
            <View style={s.catalogGrid}>
              {foods.map((food, i) => (
                <Animated.View
                  key={i}
                  style={[s.catalogCard, { backgroundColor: lightCard, opacity: catalogAnims[i] }]}
                >
                  {food.badge !== null && (
                    <View style={s.catalogBadge}>
                      <Text style={s.catalogBadgeText}>{food.badge}</Text>
                    </View>
                  )}
                  <Text style={s.catalogEmoji}>{food.emoji}</Text>
                  <Text style={[s.catalogName, { color: isDark ? '#f1f5f9' : '#334155' }]}>
                    {food.name}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        );
      }

      case 'validation':
        return (
          <View style={[s.visualZone, { backgroundColor: zoneBg }]}>
            <View style={[s.validationCard, { backgroundColor: green }]}>
              <Text style={s.validationTitle}>🥗 Ensalada proteica</Text>
              <Animated.View style={[s.validateBtn, { transform: [{ scale: validatePulse }] }]}>
                <Text style={[s.validateBtnText, { color: green }]}>✅ Validar</Text>
              </Animated.View>
            </View>
          </View>
        );

      default:
        return <View style={[s.visualZone, { backgroundColor: zoneBg }]} />;
    }
  };

  // ── Theme colors ───────────────────────────────────────────
  const cs        = slides[currentIndex];
  const darkSlide = cs?.dark ?? false;
  const bg        = darkSlide ? GREEN_DARK : (isDark ? '#0f172a' : BG);
  const titleCol  = darkSlide ? WHITE : (isDark ? '#f1f5f9' : '#1a1a2e');
  const descCol   = darkSlide ? 'rgba(255,255,255,0.65)' : (isDark ? '#94a3b8' : '#64748b');
  const subCol    = darkSlide ? 'rgba(255,255,255,0.8)' : (isDark ? '#22c55e' : GREEN);
  const dotActive = darkSlide ? WHITE : (isDark ? '#22c55e' : GREEN);
  const dotInact  = darkSlide ? 'rgba(255,255,255,0.3)' : 'rgba(26,107,10,0.25)';
  const nextBtnBg = darkSlide ? GREEN : (isDark ? '#16a34a' : GREEN_DARK);
  const skipCol   = darkSlide ? 'rgba(255,255,255,0.5)' : (isDark ? '#475569' : '#94a3b8');
  const progBg    = darkSlide ? 'rgba(255,255,255,0.2)' : (isDark ? '#334155' : '#e2e8f0');
  const progFill  = darkSlide ? WHITE : (isDark ? '#22c55e' : GREEN);
  const progFillW = ((currentIndex + 1) / slides.length) * (SCREEN_W - 48);

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <SafeAreaView style={s.safeArea}>

        {/* ── Progress bar ──────────────────────────────── */}
        <View style={[s.topProgBg, { backgroundColor: progBg }]}>
          <View style={[s.topProgFill, { width: progFillW, backgroundColor: progFill }]} />
        </View>

        {/* ── Skip ──────────────────────────────────────── */}
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity
            style={s.skipBtn}
            onPress={handleComplete}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[s.skipText, { color: skipCol }]}>Saltar</Text>
          </TouchableOpacity>
        )}

        {/* ── Visual area ───────────────────────────────── */}
        <View style={s.visualArea}>
          <Animated.View style={[s.slideLayer, { transform: [{ translateX: slideOutAnim }] }]}>
            {renderVisual(currentIndex)}
          </Animated.View>
          {nextIndex !== null && (
            <Animated.View style={[s.slideLayer, { transform: [{ translateX: slideInAnim }] }]}>
              {renderVisual(nextIndex)}
            </Animated.View>
          )}
        </View>

        {/* ── Text zone ─────────────────────────────────── */}
        <Animated.View style={[s.textZone, { opacity: textFadeAnim }]}>
          <Text style={[s.slideTitle, { color: titleCol }]}>{cs?.title}</Text>
          {cs?.subtitle ? (
            <Text style={[s.slideSubtitle, { color: subCol }]}>{cs.subtitle}</Text>
          ) : null}
          <Text style={[s.slideDesc, { color: descCol }]}>{cs?.description}</Text>
        </Animated.View>

        {/* ── Bottom bar ────────────────────────────────── */}
        <View style={s.bottomBar}>
          <View style={s.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[s.dot, {
                  backgroundColor: i === currentIndex ? dotActive : dotInact,
                  width: i === currentIndex ? 28 : 8,
                }]}
              />
            ))}
          </View>

          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: nextBtnBg }]}
              onPress={handleNext}
              disabled={isTransitioning}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>Siguiente →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.startBtn}
              onPress={handleComplete}
              activeOpacity={0.85}
            >
              <Text style={s.startBtnText}>{cs?.btnLabel ?? '¡Empezar!'}</Text>
            </TouchableOpacity>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea:  { flex: 1 },

  // Progress bar
  topProgBg:   { height: 3, marginHorizontal: 24, marginTop: 8, borderRadius: 2, overflow: 'hidden' },
  topProgFill: { height: '100%', borderRadius: 2 },

  // Skip
  skipBtn:  { position: 'absolute', top: 18, right: 18, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6 },
  skipText: { fontSize: 14, fontWeight: '600' },

  // Layout zones
  visualArea: { flex: 3, overflow: 'hidden' },
  slideLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  visualZone: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  textZone: {
    flex: 2,
    paddingHorizontal: 32,
    paddingTop: 18,
    alignItems: 'center',
    gap: 8,
  },

  // Text
  slideTitle:    { fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32 },
  slideSubtitle: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  slideDesc:     { fontSize: 15, textAlign: 'center', lineHeight: 24, maxWidth: 300 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 20,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:  { height: 8, borderRadius: 4 },
  nextBtn: {
    borderRadius: 999, paddingHorizontal: 24, paddingVertical: 13,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8,
  },
  nextBtnText: { color: WHITE, fontSize: 15, fontWeight: '800' },
  startBtn: {
    borderRadius: 999, paddingHorizontal: 32, paddingVertical: 14,
    backgroundColor: GREEN, elevation: 6,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
  startBtnText: { color: WHITE, fontSize: 16, fontWeight: '900' },

  // ── Slide 1 — welcome ────────────────────────────────────
  logo:      { width: 140, height: 70 },
  leaf:      { position: 'absolute' },
  leafEmoji: { fontSize: 24 },

  // ── Slide 2 — swipe ──────────────────────────────────────
  swipeDemo: { alignItems: 'center' },
  demoCard: {
    width: 220, height: 100, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, gap: 4,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  demoCardBack: {
    transform: [{ rotate: '-6deg' }],
    marginBottom: -60,
    elevation: 2,
  },
  demoCardTitle:   { color: WHITE, fontSize: 15, fontWeight: '700' },
  demoCardSub:     { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  demoCardBackText:{ fontSize: 13, fontWeight: '600' },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240, marginTop: 18,
  },
  arrowLeft:  { fontSize: 15, fontWeight: '800', color: '#ef4444' },
  arrowRight: { fontSize: 15, fontWeight: '800', color: '#22c55e' },

  // ── Slide 3 — avatar ─────────────────────────────────────
  progressBarBg:   { width: 200, height: 10, borderRadius: 5, marginTop: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  levelChips:      { flexDirection: 'row', gap: 8, marginTop: 12 },
  levelChip:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  levelChipText:   { fontSize: 14, fontWeight: '700' },

  // ── Slide 4 — profile ────────────────────────────────────
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, padding: 14, width: 260, marginVertical: 4,
  },
  profileCardEmoji: { fontSize: 22 },
  profileCardLabel: { color: WHITE, fontSize: 15, fontWeight: '600' },

  // ── Nutritionist catalog ─────────────────────────────────
  catalogGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, justifyContent: 'center', padding: 16,
  },
  catalogCard: {
    width: 110, height: 70, borderRadius: 12,
    padding: 10, alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  catalogBadge:     { position: 'absolute', top: 4, right: 4 },
  catalogBadgeText: { fontSize: 14 },
  catalogEmoji:     { fontSize: 22 },
  catalogName:      { fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  // ── Nutritionist validation ───────────────────────────────
  validationCard: {
    width: 200, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 12,
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10,
  },
  validationTitle: { color: WHITE, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  validateBtn: {
    backgroundColor: WHITE,
    borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10,
  },
  validateBtnText: { fontSize: 15, fontWeight: '800' },
});
