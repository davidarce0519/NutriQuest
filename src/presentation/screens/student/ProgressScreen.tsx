import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import {
  getProgressUseCase,
  getAvatarLevelsUseCase,
  getUnseenLevelUpsUseCase,
  markLevelUpSeenUseCase,
} from '../../../domain/usecases/avatar';
import { AvatarProgress, AvatarLevel } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';

const AVATAR_EMOJIS = ['', '🌱', '🌿', '🌳', '🌲', '🏔️'];

const LEVEL_MESSAGES: Record<number, string> = {
  1: 'Has dado el primer paso. ¡Bienvenido a NutriQuest!',
  2: 'Tu constancia está dando frutos. ¡Sigue así!',
  3: 'Te has convertido en un referente de buenos hábitos.',
  4: 'Eres un árbol fuerte. Tu disciplina es inspiradora.',
};

export const ProgressScreen = () => {
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

  const user = useAuthStore((s) => s.user);
  const [progress, setProgress]             = useState<AvatarProgress | null>(null);
  const [levels, setLevels]                 = useState<AvatarLevel[]>([]);
  const [loading, setLoading]               = useState(true);
  const [displayDecisions, setDisplayDecisions] = useState(0);
  const [levelUpModal, setLevelUpModal]     = useState(false);
  const [unseenLevelUp, setUnseenLevelUp]   = useState<{ id: string; level: number } | null>(null);

  // ── Animated.Values ───────────────────────────────────
  const avatarScaleAnim     = useRef(new Animated.Value(0.5)).current;
  const avatarRotAnim       = useRef(new Animated.Value(-5)).current;
  const progressWidthAnim   = useRef(new Animated.Value(0)).current;  // 0–100

  const modalCardYAnim      = useRef(new Animated.Value(80)).current;
  const modalCardOpAnim     = useRef(new Animated.Value(0)).current;
  const modalEmojiScaleAnim = useRef(new Animated.Value(0)).current;
  const modalBadgeOpAnim    = useRef(new Animated.Value(0)).current;
  const modalMsgOpAnim      = useRef(new Animated.Value(0)).current;
  const modalBtnOpAnim      = useRef(new Animated.Value(0)).current;

  // Ref para detener el loop del emoji sin perder referencia al stop
  const emojiPulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Carga de datos ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    Promise.all([getProgressUseCase(user.id), getAvatarLevelsUseCase()])
      .then(([p, l]) => {
        setProgress(p);
        setLevels(l);

        // Avatar: escala spring + rotación
        Animated.spring(avatarScaleAnim, {
          toValue: 1.0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }).start();
        Animated.sequence([
          Animated.timing(avatarRotAnim, {
            toValue: 5, duration: 300,
            easing: Easing.out(Easing.quad), useNativeDriver: true,
          }),
          Animated.timing(avatarRotAnim, {
            toValue: 0, duration: 250,
            easing: Easing.out(Easing.quad), useNativeDriver: true,
          }),
        ]).start();

        // Barra de progreso (useNativeDriver: false — width no soporta native)
        const currentLv = l.find(lv => lv.level === p.currentLevel);
        const nextLv    = l.find(lv => lv.level === p.currentLevel + 1);
        const pct = nextLv && currentLv
          ? Math.min(
              ((p.totalHealthyDecisions - currentLv.minDecisions) /
               (nextLv.minDecisions - currentLv.minDecisions)) * 100,
              100,
            )
          : 100;
        progressWidthAnim.setValue(0);
        Animated.timing(progressWidthAnim, {
          toValue: pct,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();

        // Contador JS
        const target = p.totalHealthyDecisions;
        if (target > 0) {
          const steps    = 24;
          const stepTime = 1000 / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            if (step >= steps) {
              setDisplayDecisions(target);
              clearInterval(timer);
            } else {
              setDisplayDecisions(Math.round((step / steps) * target));
            }
          }, stepTime);
        }
      })
      .finally(() => setLoading(false));

    getUnseenLevelUpsUseCase(user.id)
      .then(unseen => {
        if (unseen.length > 0) {
          setUnseenLevelUp(unseen[0]);
          setLevelUpModal(true);
        }
      })
      .catch(() => {});
  }, [user]);

  // ── Animaciones del modal ──────────────────────────────
  useEffect(() => {
    if (levelUpModal) {
      // Reset
      modalCardYAnim.setValue(80);
      modalCardOpAnim.setValue(0);
      modalEmojiScaleAnim.setValue(0);
      modalBadgeOpAnim.setValue(0);
      modalMsgOpAnim.setValue(0);
      modalBtnOpAnim.setValue(0);

      // Card entra
      Animated.parallel([
        Animated.spring(modalCardYAnim, {
          toValue: 0, friction: 8, tension: 65, useNativeDriver: true,
        }),
        Animated.timing(modalCardOpAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();

      // Emoji: bounce in y luego pulse continuo
      Animated.spring(modalEmojiScaleAnim, {
        toValue: 1.0, friction: 5, tension: 150, useNativeDriver: true,
      }).start(() => {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(modalEmojiScaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
            Animated.timing(modalEmojiScaleAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
          ]),
        );
        emojiPulseRef.current = pulse;
        pulse.start();
      });

      // Badge, mensaje y botón con delay escalonado
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(modalBadgeOpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(modalMsgOpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(modalBtnOpAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      emojiPulseRef.current?.stop();
      emojiPulseRef.current = null;
    }

    return () => {
      emojiPulseRef.current?.stop();
    };
  }, [levelUpModal]);

  const handleCloseLevelUpModal = async () => {
    if (unseenLevelUp) {
      await markLevelUpSeenUseCase(unseenLevelUp.id).catch(() => {});
    }
    setLevelUpModal(false);
    setUnseenLevelUp(null);
  };

  // ── Computed ───────────────────────────────────────────
  const currentLevel    = levels.find((l) => l.level === progress?.currentLevel);
  const nextLevel       = levels.find((l) => l.level === (progress?.currentLevel ?? 0) + 1);
  const decisionsToNext = nextLevel
    ? nextLevel.minDecisions - (progress?.totalHealthyDecisions ?? 0)
    : 0;

  const levelUpLevel = unseenLevelUp?.level ?? 1;
  const levelUpEmoji = AVATAR_EMOJIS[levelUpLevel] ?? '🌱';
  const levelUpName  = levels.find(l => l.level === levelUpLevel)?.label ?? `Nivel ${levelUpLevel}`;
  const levelUpMsg   = LEVEL_MESSAGES[levelUpLevel] ?? '¡Sigue así!';

  // Interpolaciones de estilos
  const avatarRotInterp = avatarRotAnim.interpolate({
    inputRange: [-5, 0, 5],
    outputRange: ['-5deg', '0deg', '5deg'],
  });
  const progressWidthInterp = progressWidthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (loading)
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={[s.topStrip, { backgroundColor: green }]} />
        <ActivityIndicator color="#ffffff" size="large" style={{ marginTop: 100 }} />
      </View>
    );

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Text style={[s.headerSub, { color: greenLight }]}>Tu camino de autocuidado</Text>
            <Text style={s.headerTitle}>Progreso 🏆</Text>
          </View>

          {/* Hero avatar */}
          <View style={[s.avatarCard, { backgroundColor: cardBg, shadowOpacity: isDark ? 0.35 : 0.1 }]}>
            <Animated.Text
              style={[s.avatarEmoji, {
                transform: [
                  { scale: avatarScaleAnim },
                  { rotate: avatarRotInterp },
                ],
              }]}
            >
              {AVATAR_EMOJIS[progress?.currentLevel ?? 1]}
            </Animated.Text>

            <View style={s.avatarInfo}>
              <View style={[s.avatarBadge, { backgroundColor: green + '20' }]}>
                <Text style={[s.avatarBadgeText, { color: green }]}>
                  Nivel {progress?.currentLevel ?? 1}
                </Text>
              </View>
              <Text style={[s.avatarLevel, { color: textPrimary }]}>
                {currentLevel?.label ?? 'Semilla'}
              </Text>
              <Text style={[s.avatarDesc, { color: textSecondary }]}>
                {currentLevel?.description}
              </Text>
            </View>

            {/* Barra de progreso animada */}
            {nextLevel && (
              <View style={s.progressSection}>
                <View style={s.progressLabelRow}>
                  <Text style={[s.progressLabelLeft,  { color: textSecondary }]}>{currentLevel?.label}</Text>
                  <Text style={[s.progressLabelRight, { color: green }]}>{nextLevel.label}</Text>
                </View>
                <View style={[s.progressBarBg, { backgroundColor: border }]}>
                  <Animated.View
                    style={[s.progressBarFill, { backgroundColor: green, width: progressWidthInterp as any }]}
                  />
                </View>
                <Text style={[s.progressHint, { color: textSecondary }]}>
                  {decisionsToNext > 0
                    ? `${decisionsToNext} decisiones más para "${nextLevel.label}"`
                    : '¡Lista para el siguiente nivel!'}
                </Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={[s.statCard, s.statCardDark, { backgroundColor: greenDark }]}>
              <Text style={s.statIconLg}>🥗</Text>
              <Text style={s.statValueLight}>{displayDecisions}</Text>
              <Text style={s.statLabelLight}>Decisiones{'\n'}saludables</Text>
            </View>
            <View style={s.statsCol}>
              <View style={[s.statCard, { flex: 1, backgroundColor: cardBg, shadowOpacity: isDark ? 0.3 : 0.08 }]}>
                <Text style={s.statIconSm}>🔥</Text>
                <Text style={[s.statValueDark, { color: textPrimary }]}>
                  {progress?.activeStreakDays ?? 0}
                </Text>
                <Text style={[s.statLabelDark, { color: textSecondary }]}>días de racha</Text>
              </View>
              <View style={[s.statCard, { flex: 1, backgroundColor: green }]}>
                <Text style={s.statIconSm}>⭐</Text>
                <Text style={s.statValueLight}>Nivel {progress?.currentLevel ?? 1}</Text>
                <Text style={s.statLabelLight}>actual</Text>
              </View>
            </View>
          </View>

          {/* Niveles */}
          <Text style={[s.sectionLabel, { color: textMuted }]}>Niveles del avatar</Text>
          {levels.map((level) => {
            const unlocked  = (progress?.totalHealthyDecisions ?? 0) >= level.minDecisions;
            const isCurrent = level.level === progress?.currentLevel;
            return (
              <View key={level.level} style={[
                s.levelRow,
                { backgroundColor: cardBg, shadowOpacity: isDark ? 0.25 : 0.05 },
                isCurrent && { borderWidth: 2, borderColor: green },
              ]}>
                <View style={[s.levelCircle, { backgroundColor: unlocked ? green : border }]}>
                  <Text style={s.levelEmoji}>{AVATAR_EMOJIS[level.level]}</Text>
                </View>
                <View style={s.levelInfo}>
                  <Text style={[s.levelName, { color: textPrimary }, isCurrent && { color: green, fontWeight: '900' }]}>
                    {level.label}
                  </Text>
                  <Text style={[s.levelReq, { color: textMuted }]}>
                    Desde {level.minDecisions} decisiones
                  </Text>
                  {isCurrent && (
                    <Text style={[s.levelCurrent, { color: green }]}>← Nivel actual</Text>
                  )}
                </View>
                <Text style={s.levelCheck}>{unlocked ? '✅' : '🔒'}</Text>
              </View>
            );
          })}

          {/* Mensaje */}
          <View style={[s.messageCard, { backgroundColor: cardBg, borderLeftColor: green }]}>
            <Text style={s.messageEmoji}>💡</Text>
            <Text style={[s.messageText, { color: textSecondary }]}>
              Cada decisión que tomas suma a tu progreso. Tu avatar nunca retrocede — cada paso cuenta.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* MODAL SUBIDA DE NIVEL */}
      <Modal visible={levelUpModal} transparent animationType="fade" onRequestClose={handleCloseLevelUpModal}>
        <View style={s.modalOverlay}>
          <Animated.View style={[
            s.modalCard,
            { backgroundColor: cardBg },
            { transform: [{ translateY: modalCardYAnim }], opacity: modalCardOpAnim },
          ]}>
            <Animated.Text style={[s.modalEmoji, { transform: [{ scale: modalEmojiScaleAnim }] }]}>
              {levelUpEmoji}
            </Animated.Text>
            <Text style={[s.modalTitle, { color: textPrimary }]}>¡Subiste de nivel!</Text>
            <Animated.View style={[s.modalBadge, { backgroundColor: green + '20', opacity: modalBadgeOpAnim }]}>
              <Text style={[s.modalBadgeText, { color: green }]}>{levelUpName}</Text>
            </Animated.View>
            <Animated.Text style={[s.modalMessage, { color: textSecondary, opacity: modalMsgOpAnim }]}>
              {levelUpMsg}
            </Animated.Text>
            <Animated.View style={{ opacity: modalBtnOpAnim }}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: green }]}
                onPress={handleCloseLevelUpModal}
                activeOpacity={0.85}
              >
                <Text style={s.modalBtnText}>¡Genial!</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
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
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },

  header:      { paddingTop: 8, paddingBottom: 4 },
  headerSub:   { fontSize: 12, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#ffffff' },

  avatarCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
  },
  avatarEmoji:     { fontSize: 80 },
  avatarInfo:      { alignItems: 'center', gap: 4 },
  avatarBadge:     { borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 5 },
  avatarBadgeText: { fontSize: 12, fontWeight: '700' },
  avatarLevel:     { fontSize: 26, fontWeight: '900' },
  avatarDesc:      { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  progressSection:    { width: '100%', gap: 6, marginTop: 4 },
  progressLabelRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelLeft:  { fontSize: 11, fontWeight: '600' },
  progressLabelRight: { fontSize: 11, fontWeight: '700' },
  progressBarBg: {
    height: 10,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: BorderRadius.full },
  progressHint:    { fontSize: 12, textAlign: 'center' },

  statsRow:  { flexDirection: 'row', gap: 12, height: 160 },
  statsCol:  { flex: 1, gap: 12 },
  statCard: {
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  statCardDark:   { flex: 1 },
  statIconLg:     { fontSize: 32, marginBottom: 4 },
  statIconSm:     { fontSize: 20, marginBottom: 2 },
  statValueLight: { fontSize: 34, fontWeight: '900', color: '#ffffff' },
  statValueDark:  { fontSize: 28, fontWeight: '900' },
  statLabelLight: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 15 },
  statLabelDark:  { fontSize: 11, textAlign: 'center' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  levelCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  levelEmoji:   { fontSize: 24 },
  levelInfo:    { flex: 1 },
  levelName:    { fontSize: 15, fontWeight: '700' },
  levelReq:     { fontSize: 12, marginTop: 2 },
  levelCurrent: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  levelCheck:   { fontSize: 20 },

  messageCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  messageEmoji: { fontSize: 22 },
  messageText:  { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalEmoji:     { fontSize: 72 },
  modalTitle:     { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  modalBadge:     { borderRadius: BorderRadius.full, paddingHorizontal: 18, paddingVertical: 8 },
  modalBadgeText: { fontSize: 15, fontWeight: '800' },
  modalMessage:   { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  modalBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});
