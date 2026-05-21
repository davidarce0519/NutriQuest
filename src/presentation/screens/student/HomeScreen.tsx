import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Linking, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { getProgressUseCase } from '../../../domain/usecases/avatar';
import { getSuggestionUseCase } from '../../../domain/usecases/suggestion';
import { AvatarProgress, Suggestion } from '../../../domain/models';
import { StudentTabParams } from '../../navigation/StudentNavigator';
import { StudentAvatar } from '../../components/StudentAvatar';
import { OnboardingTooltip } from '../../components/OnboardingTooltip';
import { useWalkthroughStore } from '../../../infrastructure/stores/walkthroughStore';
import { WALKTHROUGH_STEPS, useWalkthrough } from '../../hooks/useWalkthrough';

type Nav = BottomTabNavigationProp<StudentTabParams>;
type QuickItem = { icon: string; label: string; tab?: keyof StudentTabParams; onPress?: () => void };

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const profile = useHealthStore((s) => s.profile);
  const { isDark } = useTheme();

  const heroCardRef = useRef<View>(null);
  const progressRowRef = useRef<View>(null);
  const quickGridRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { active, stepIndex, measure, setMeasure } = useWalkthroughStore();
  const { startWalkthrough, skipWalkthrough, nextStep } = useWalkthrough();
  const currentStep = WALKTHROUGH_STEPS[stepIndex];

  const bg = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const green = isDark ? '#22c55e' : '#1a6b0a';
  const greenDark = isDark ? '#16a34a' : '#042901';
  const greenLight = isDark ? '#4ade80' : '#c1d9b7';

  const [progress, setProgress] = useState<AvatarProgress | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (!user) return;
    getProgressUseCase(user.id).then(setProgress).catch(() => { });
    getSuggestionUseCase(user.id).then(setSuggestion).catch(() => { });
  }, [user]);

  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    AsyncStorage.getItem('home_walkthrough_done').then((done) => {
      if (!done) setTimeout(() => startWalkthrough(), 800);
    }).catch(() => { });
  }, [user?.onboardingCompleted]);

  useEffect(() => {
    if (!active || currentStep?.screen !== 'Inicio') return;
    const refs: Record<string, React.RefObject<View | null>> = {
      heroCard: heroCardRef,
      progressRow: progressRowRef,
      quickGrid: quickGridRef,
    };
    const refCurrent = refs[currentStep.refKey]?.current;
    if (!refCurrent) return;
    let cancelled = false;
    const scrollMap: Record<string, number> = {
      heroCard: 0,
      progressRow: 200,
      quickGrid: 350,
    };
    scrollRef.current?.scrollTo({ y: scrollMap[currentStep.refKey] ?? 0, animated: true });
    const timer = setTimeout(() => {
      if (cancelled) return;
      refCurrent.measure((_x, _y, width, height, pageX, pageY) => {
        if (!cancelled) setMeasure({ pageX, pageY, width, height });
      });
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [active, stepIndex]);

  const handleOpenGame = async () => {
    const packageName = 'com.unity.template.ar_mobile';
    const url = `intent://launch/#Intent;scheme=launch;package=${packageName};end`;
    try {
      await Linking.openURL(url);
    } catch {
      try {
        await Linking.openURL(`android-app://${packageName}`);
      } catch {
        Alert.alert('🎮 Error', `No se pudo abrir NutriQuest AR.\nPackage: ${packageName}`, [{ text: 'OK' }]);
      }
    }
  };

  const nextLevelDecisions = [10, 25, 50, 100][(progress?.currentLevel ?? 1) - 1] ?? 100;
  const progressPct = progress
    ? Math.min((progress.totalHealthyDecisions / nextLevelDecisions) * 100, 100)
    : 0;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />
      <SafeAreaView style={s.safe}>
        <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <View style={s.header}>
            <Image source={require('../../../../assets/logo1.0.png')} style={s.logo} resizeMode="contain" />
            <View style={s.headerText}>
              <Text style={[s.greetingText, { color: greenLight }]}>{greeting()}</Text>
              <Text style={s.nameText} numberOfLines={1}>
                {user?.fullName?.split(' ')[0] ?? 'Estudiante'} 👋
              </Text>
            </View>
          </View>

          <View ref={heroCardRef} collapsable={false}>
            <TouchableOpacity
              style={[s.heroCard, { backgroundColor: greenDark }]}
              onPress={() => navigation.navigate('Sugerencia')}
              activeOpacity={0.9}
            >
              <View style={s.heroTop}>
                <View style={[s.heroBadge, { backgroundColor: green + '55' }]}>
                  <Text style={[s.heroBadgeText, { color: greenLight }]}>Sugerencia del día</Text>
                </View>
                <Text style={s.heroEmoji}>{suggestion ? '✨' : '🥗'}</Text>
              </View>
              <Text style={s.heroTitle} numberOfLines={2}>
                {suggestion ? suggestion.food.name : '¿Qué comemos hoy?'}
              </Text>
              <Text style={s.heroSub} numberOfLines={2}>
                {suggestion
                  ? `⏱ ${suggestion.food.prepTimeMinutes ?? '–'} min · Toca para responder`
                  : 'Toca para obtener tu sugerencia personalizada'}
              </Text>
              <View style={[s.heroBtn, { backgroundColor: green }]}>
                <Text style={s.heroBtnText}>{suggestion ? 'Ver sugerencia →' : 'Obtener sugerencia →'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View ref={progressRowRef} style={s.row}>
            <TouchableOpacity
              style={[s.smallCard, { backgroundColor: cardBg }]}
              onPress={() => navigation.navigate('Progreso')}
              activeOpacity={0.88}
            >
              <Text style={[s.smallCardTag, { color: textSecondary }]}>Progreso</Text>
              <View style={s.avatarWrap}>
                <StudentAvatar
                  bmiCategory={profile?.bmiCategory}
                  currentLevel={progress?.currentLevel}
                  streakDays={progress?.activeStreakDays}
                  nutritionalGoal={profile?.nutritionalGoal}
                  activityLevel={profile?.physicalActivityLevel}
                  size={56}
                  animated={false}
                />
              </View>
              <Text style={[s.progressLevel, { color: greenDark }]} numberOfLines={1}>
                Nivel {progress?.currentLevel ?? 1}
              </Text>
              <View style={[s.miniBarBg, { backgroundColor: border }]}>
                <View style={[s.miniBarFill, { width: `${progressPct}%` as any, backgroundColor: green }]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.smallCard, s.streakCard, { backgroundColor: greenDark }]}
              onPress={() => navigation.navigate('Historial')}
              activeOpacity={0.88}
            >
              <Text style={[s.smallCardTag, { color: greenLight }]}>Racha</Text>
              <Text style={s.streakNumber} numberOfLines={1}>{progress?.activeStreakDays ?? 0}</Text>
              <Text style={[s.streakLabel, { color: greenLight }]}>días 🔥</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.sectionLabel, { color: textSecondary }]}>Explorar</Text>
          <View ref={quickGridRef} style={s.quickGrid}>
            {([
              { icon: '🎮', label: 'Juego AR', tab: undefined, onPress: handleOpenGame },
              { icon: '📊', label: 'Historial', tab: 'Historial', onPress: undefined },
              { icon: '👤', label: 'Perfil', tab: 'Perfil', onPress: undefined },
            ] as QuickItem[]).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[s.quickCard, { backgroundColor: cardBg }]}
                onPress={() => item.onPress ? item.onPress() : navigation.navigate(item.tab!)}
                activeOpacity={0.8}
              >
                <Text style={s.quickIcon}>{item.icon}</Text>
                <Text style={[s.quickLabel, { color: textPrimary }]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!profile?.weightKg && (
            <TouchableOpacity style={s.alertCard} onPress={() => navigation.navigate('Perfil')} activeOpacity={0.88}>
              <Text style={s.alertIcon}>📋</Text>
              <View style={s.alertText}>
                <Text style={s.alertTitle}>Completa tu perfil</Text>
                <Text style={s.alertSub}>Para sugerencias más precisas</Text>
              </View>
              <Text style={s.alertArrow}>›</Text>
            </TouchableOpacity>
          )}

          <View style={[s.raCard, { backgroundColor: cardBg }]}>
            <TouchableOpacity style={[s.raMain, { backgroundColor: greenLight }]} onPress={handleOpenGame} activeOpacity={0.85}>
              <View style={s.raTextBlock}>
                <Text style={[s.raTag, { color: green }]}>✨ Experiencia inmersiva</Text>
                <Text style={[s.raTitle, { color: greenDark }]} numberOfLines={1}>Realidad Aumentada</Text>
                <Text style={[s.raSub, { color: greenDark + 'aa' }]} numberOfLines={1}>Prepara un batido especial</Text>
              </View>
              <Text style={s.raEmoji}>🥤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.raSecond} onPress={handleOpenGame} activeOpacity={0.85}>
              <Text style={[s.raSecondText, { color: textSecondary }]}>Experiencia con RA</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      {active && currentStep?.screen === 'Inicio' && measure !== null && (
        <OnboardingTooltip
          visible
          title={currentStep.title}
          description={currentStep.description}
          icon={currentStep.icon}
          position={currentStep.position}
          targetMeasure={measure}
          step={stepIndex + 1}
          totalSteps={WALKTHROUGH_STEPS.length}
          onNext={() => nextStep(navigation)}
          onSkip={skipWalkthrough}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 180, borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingTop: 8, paddingBottom: 4,
  },
  headerText: { flex: 1 },
  logo: { width: 80, height: 40 },
  greetingText: { fontSize: 12, fontWeight: '600' },
  nameText: { fontSize: 18, fontWeight: '900', color: '#ffffff' },

  heroCard: { borderRadius: 28, padding: 20, gap: 8, elevation: 8 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  heroBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', lineHeight: 26 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  heroBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' },
  heroBtnText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },

  row: { flexDirection: 'row', gap: 12 },

  smallCard: {
    flex: 1, borderRadius: 22, padding: 14,
    elevation: 3, alignItems: 'center', gap: 6,
    overflow: 'hidden',
  },
  streakCard: { justifyContent: 'center' },
  smallCardTag: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', alignSelf: 'flex-start' },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  progressLevel: { fontSize: 15, fontWeight: '900', textAlign: 'center' },
  miniBarBg: { height: 4, borderRadius: 2, overflow: 'hidden', width: '100%' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  streakNumber: { fontSize: 38, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
  streakLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },

  quickGrid: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', gap: 6, elevation: 2,
  },
  quickIcon: { fontSize: 26 },
  quickLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  alertCard: {
    backgroundColor: '#fffbeb', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#fde68a',
  },
  alertIcon: { fontSize: 24 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  alertSub: { fontSize: 12, color: '#a16207' },
  alertArrow: { fontSize: 22, color: '#d97706', fontWeight: '700' },

  raCard: { borderRadius: 24, overflow: 'hidden', elevation: 3 },
  raMain: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raTextBlock: { flex: 1, gap: 2 },
  raTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  raTitle: { fontSize: 18, fontWeight: '900' },
  raSub: { fontSize: 12 },
  raEmoji: { fontSize: 40, marginLeft: 12 },
  raSecond: { padding: 14, alignItems: 'center' },
  raSecondText: { fontSize: 14, fontWeight: '700' },
});