import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { getProgressUseCase, getAvatarLevelsUseCase } from '../../../domain/usecases/avatar';
import { AvatarProgress, AvatarLevel } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';

const GREEN       = '#1a6b0a';
const GREEN_DARK  = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG          = '#f5f5f0';
const WHITE       = '#ffffff';

const AVATAR_EMOJIS = ['', '🌱', '🌿', '🌳', '🌲', '🏔️'];

export const ProgressScreen = () => {
  const user = useAuthStore((s) => s.user);
  const [progress, setProgress] = useState<AvatarProgress | null>(null);
  const [levels, setLevels]     = useState<AvatarLevel[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getProgressUseCase(user.id), getAvatarLevelsUseCase()])
      .then(([p, l]) => { setProgress(p); setLevels(l); })
      .finally(() => setLoading(false));
  }, [user]);

  const currentLevel    = levels.find(l => l.level === progress?.currentLevel);
  const nextLevel       = levels.find(l => l.level === (progress?.currentLevel ?? 0) + 1);
  const decisionsToNext = nextLevel
    ? nextLevel.minDecisions - (progress?.totalHealthyDecisions ?? 0)
    : 0;
  const progressPct = nextLevel && progress && currentLevel
    ? Math.min(
        ((progress.totalHealthyDecisions - currentLevel.minDecisions) /
        (nextLevel.minDecisions - currentLevel.minDecisions)) * 100,
        100
      )
    : 100;

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
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerSub}>Tu camino de autocuidado</Text>
            <Text style={s.headerTitle}>Progreso 🏆</Text>
          </View>

          {/* Hero avatar */}
          <View style={s.avatarCard}>
            <Text style={s.avatarEmoji}>
              {AVATAR_EMOJIS[progress?.currentLevel ?? 1]}
            </Text>
            <View style={s.avatarInfo}>
              <View style={s.avatarBadge}>
                <Text style={s.avatarBadgeText}>Nivel {progress?.currentLevel ?? 1}</Text>
              </View>
              <Text style={s.avatarLevel}>{currentLevel?.label ?? 'Semilla'}</Text>
              <Text style={s.avatarDesc}>{currentLevel?.description}</Text>
            </View>

            {/* Barra de progreso */}
            {nextLevel && (
              <View style={s.progressSection}>
                <View style={s.progressLabelRow}>
                  <Text style={s.progressLabelLeft}>
                    {currentLevel?.label}
                  </Text>
                  <Text style={s.progressLabelRight}>
                    {nextLevel.label}
                  </Text>
                </View>
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { width: `${progressPct}%` as any }]} />
                </View>
                <Text style={s.progressHint}>
                  {decisionsToNext > 0
                    ? `${decisionsToNext} decisiones más para "${nextLevel.label}"`
                    : '¡Lista para el siguiente nivel!'}
                </Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={[s.statCard, s.statCardDark]}>
              <Text style={s.statIconLg}>🥗</Text>
              <Text style={s.statValueLight}>{progress?.totalHealthyDecisions ?? 0}</Text>
              <Text style={s.statLabelLight}>Decisiones{'\n'}saludables</Text>
            </View>
            <View style={s.statsCol}>
              <View style={[s.statCard, s.statCardWhite, { flex: 1 }]}>
                <Text style={s.statIconSm}>🔥</Text>
                <Text style={s.statValueDark}>{progress?.activeStreakDays ?? 0}</Text>
                <Text style={s.statLabelDark}>días de racha</Text>
              </View>
              <View style={[s.statCard, s.statCardGreen, { flex: 1 }]}>
                <Text style={s.statIconSm}>⭐</Text>
                <Text style={s.statValueLight}>Nivel {progress?.currentLevel ?? 1}</Text>
                <Text style={s.statLabelLight}>actual</Text>
              </View>
            </View>
          </View>

          {/* Niveles */}
          <Text style={s.sectionLabel}>Niveles del avatar</Text>
          {levels.map(level => {
            const unlocked  = (progress?.totalHealthyDecisions ?? 0) >= level.minDecisions;
            const isCurrent = level.level === progress?.currentLevel;
            return (
              <View key={level.level} style={[s.levelRow, isCurrent && s.levelRowActive]}>
                <View style={[
                  s.levelCircle,
                  { backgroundColor: unlocked ? GREEN : '#e2e8f0' }
                ]}>
                  <Text style={s.levelEmoji}>{AVATAR_EMOJIS[level.level]}</Text>
                </View>
                <View style={s.levelInfo}>
                  <Text style={[s.levelName, isCurrent && s.levelNameActive]}>
                    {level.label}
                  </Text>
                  <Text style={s.levelReq}>Desde {level.minDecisions} decisiones</Text>
                  {isCurrent && (
                    <Text style={s.levelCurrent}>← Nivel actual</Text>
                  )}
                </View>
                <Text style={s.levelCheck}>{unlocked ? '✅' : '🔒'}</Text>
              </View>
            );
          })}

          {/* Mensaje HU_3.3 */}
          <View style={s.messageCard}>
            <Text style={s.messageEmoji}>💡</Text>
            <Text style={s.messageText}>
              Cada decisión que tomas suma a tu progreso. Tu avatar nunca retrocede — cada paso cuenta.
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topStrip: {
    position:                'absolute',
    top: 0, left: 0, right: 0,
    height:                  180,
    backgroundColor:         GREEN,
    borderBottomLeftRadius:  40,
    borderBottomRightRadius: 40,
  },
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },

  // Header
  header:      { paddingTop: 8, paddingBottom: 4 },
  headerSub:   { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: WHITE },

  // Avatar card
  avatarCard: {
    backgroundColor: WHITE,
    borderRadius:    28,
    padding:         24,
    alignItems:      'center',
    gap:             12,
    elevation:       6,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.1,
    shadowRadius:    16,
  },
  avatarEmoji:     { fontSize: 80 },
  avatarInfo:      { alignItems: 'center', gap: 4 },
  avatarBadge: {
    backgroundColor: GREEN + '15',
    borderRadius:    BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical:   5,
  },
  avatarBadgeText: { fontSize: 12, fontWeight: '700', color: GREEN },
  avatarLevel:     { fontSize: 26, fontWeight: '900', color: GREEN_DARK },
  avatarDesc:      { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },

  progressSection: { width: '100%', gap: 6, marginTop: 4 },
  progressLabelRow:{ flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelLeft: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  progressLabelRight:{ fontSize: 11, color: GREEN, fontWeight: '700' },
  progressBarBg: {
    height:          10,
    backgroundColor: '#e2e8f0',
    borderRadius:    BorderRadius.full,
    overflow:        'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: GREEN, borderRadius: BorderRadius.full },
  progressHint:    { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Stats
  statsRow:    { flexDirection: 'row', gap: 12, height: 160 },
  statsCol:    { flex: 1, gap: 12 },
  statCard: {
    borderRadius: 22,
    padding:      16,
    alignItems:   'center',
    justifyContent: 'center',
    elevation:    4,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
  },
  statCardDark:  { flex: 1, backgroundColor: GREEN_DARK },
  statCardWhite: { backgroundColor: WHITE },
  statCardGreen: { backgroundColor: GREEN },
  statIconLg:    { fontSize: 32, marginBottom: 4 },
  statIconSm:    { fontSize: 20, marginBottom: 2 },
  statValueLight:{ fontSize: 34, fontWeight: '900', color: WHITE },
  statValueDark: { fontSize: 28, fontWeight: '900', color: GREEN_DARK },
  statLabelLight:{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 15 },
  statLabelDark: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },

  // Niveles
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  levelRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: WHITE,
    borderRadius:    18,
    padding:         14,
    gap:             14,
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.05,
    shadowRadius:    6,
  },
  levelRowActive: {
    borderWidth:  2,
    borderColor:  GREEN,
  },
  levelCircle: {
    width:  48, height: 48,
    borderRadius: 24,
    alignItems:   'center',
    justifyContent: 'center',
  },
  levelEmoji:       { fontSize: 24 },
  levelInfo:        { flex: 1 },
  levelName:        { fontSize: 15, fontWeight: '700', color: '#475569' },
  levelNameActive:  { color: GREEN_DARK, fontWeight: '900' },
  levelReq:         { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  levelCurrent:     { fontSize: 11, color: GREEN, fontWeight: '700', marginTop: 2 },
  levelCheck:       { fontSize: 20 },

  // Mensaje
  messageCard: {
    backgroundColor: WHITE,
    borderRadius:    18,
    padding:         16,
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             12,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
    elevation:       2,
  },
  messageEmoji: { fontSize: 22 },
  messageText:  { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20, fontStyle: 'italic' },
});