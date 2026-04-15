import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { getProgressUseCase } from '../../../domain/usecases/avatar';
import { getSuggestionUseCase } from '../../../domain/usecases/suggestion';
import { AvatarProgress, Suggestion } from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';
import { StudentTabParams } from '../../navigation/StudentNavigator';

type Nav = BottomTabNavigationProp<StudentTabParams>;

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#f5f5f0';   // fondo crema claro
const WHITE = '#ffffff';

const AVATAR_EMOJIS = ['', '🌱', '🌿', '🌳', '🌲', '🏔️'];

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
  const [progress, setProgress] = useState<AvatarProgress | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (!user) return;
    getProgressUseCase(user.id).then(setProgress).catch(() => { });
    getSuggestionUseCase(user.id).then(setSuggestion).catch(() => { });
  }, [user]);

  const nextLevelDecisions = [10, 25, 50, 100][(progress?.currentLevel ?? 1) - 1] ?? 100;
  const progressPct = progress
    ? Math.min((progress.totalHealthyDecisions / nextLevelDecisions) * 100, 100)
    : 0;

  return (
    <View style={s.container}>
      {/* Franja verde superior que hace de "header zona" */}
      <View style={s.topStrip} />

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── HEADER ── */}
          <View style={s.header}>
            <Image
              source={require('../../../../assets/logo1.0.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <View>
              <Text style={s.greetingText}>{greeting()}</Text>
              <Text style={s.nameText}>
                {user?.fullName?.split(' ')[0] ?? 'Estudiante'}
              </Text>
            </View>
          </View>

          {/* ── HERO CARD: Sugerencia del día ── */}
          <TouchableOpacity
            style={s.heroCard}
            onPress={() => navigation.navigate('Sugerencia')}
            activeOpacity={0.9}
          >
            <View style={s.heroTop}>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>Sugerencia del día</Text>
              </View>
              <Text style={s.heroEmoji}>
                {suggestion ? '✨' : '🥗'}
              </Text>
            </View>
            <Text style={s.heroTitle}>
              {suggestion ? suggestion.food.name : '¿Qué comemos hoy?'}
            </Text>
            <Text style={s.heroSub}>
              {suggestion
                ? `⏱ ${suggestion.food.prepTimeMinutes ?? '–'} min · Toca para responder`
                : 'Toca para obtener tu sugerencia personalizada'}
            </Text>
            <View style={s.heroBtn}>
              <Text style={s.heroBtnText}>
                {suggestion ? 'Ver sugerencia →' : 'Obtener sugerencia →'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── FILA: Progreso + Racha ── */}
          <View style={s.row}>
            <TouchableOpacity
              style={[s.smallCard, s.progressCard]}
              onPress={() => navigation.navigate('Progreso')}
              activeOpacity={0.88}
            >
              <Text style={s.smallCardTag}>Progreso</Text>
              <Text style={s.avatarEmoji}>{AVATAR_EMOJIS[progress?.currentLevel ?? 1]}</Text>
              <Text style={s.progressLevel}>Nivel {progress?.currentLevel ?? 1}</Text>
              <View style={s.miniBarBg}>
                <View style={[s.miniBarFill, { width: `${progressPct}%` as any }]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.smallCard, s.streakCard]}
              onPress={() => navigation.navigate('Historial')}
              activeOpacity={0.88}
            >
              <Text style={s.smallCardTagLight}>Racha</Text>
              <Text style={s.streakNumber}>{progress?.activeStreakDays ?? 0}</Text>
              <Text style={s.streakLabel}>días 🔥</Text>
              <Text style={s.streakDecisions}>
                {progress?.totalHealthyDecisions ?? 0} decisiones
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── ACCESOS RÁPIDOS ── */}
          <Text style={s.sectionLabel}>Explorar</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '🎮', label: 'Mini Juego', tab: 'Sugerencia' as const },
              { icon: '📖', label: 'Nutrición', tab: 'Historial' as const },
              { icon: '📊', label: 'Historial', tab: 'Historial' as const },
              { icon: '👤', label: 'Mi perfil', tab: 'Perfil' as const },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={s.quickCard}
                onPress={() => navigation.navigate(item.tab)}
                activeOpacity={0.8}
              >
                <Text style={s.quickIcon}>{item.icon}</Text>
                <Text style={s.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ALERTA: perfil incompleto ── */}
          {!profile?.weightKg && (
            <TouchableOpacity
              style={s.alertCard}
              onPress={() => navigation.navigate('Perfil')}
              activeOpacity={0.88}
            >
              <Text style={s.alertIcon}>📋</Text>
              <View style={s.alertText}>
                <Text style={s.alertTitle}>Completa tu perfil</Text>
                <Text style={s.alertSub}>Para sugerencias más precisas</Text>
              </View>
              <Text style={s.alertArrow}>›</Text>
            </TouchableOpacity>
          )}

          {/* ── REALIDAD AUMENTADA ── */}
          <View style={s.raCard}>
            <TouchableOpacity style={s.raMain} activeOpacity={0.85}>
              <View>
                <Text style={s.raTag}>✨ Experiencia inmersiva</Text>
                <Text style={s.raTitle}>Realidad Aumentada</Text>
                <Text style={s.raSub}>Prepara un batido especial</Text>
              </View>
              <Text style={s.raEmoji}>🥤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.raSecond} activeOpacity={0.85}>
              <Text style={s.raSecondText}>Experiencia sin RA</Text>
            </TouchableOpacity>
          </View>

          {/* Aviso legal */}
          <Text style={s.legalText}>
            ⚠️ Contenido educativo · No reemplaza consulta profesional
          </Text>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logo: { width: 100, height: 50 },
  greetingText: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  nameText: { fontSize: 20, fontWeight: '900', color: WHITE },

  // Hero card
  heroCard: {
    backgroundColor: GREEN_DARK,
    borderRadius: 28,
    padding: 22,
    gap: 8,
    elevation: 8,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroBadge: { backgroundColor: GREEN + '55', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN_LIGHT, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: WHITE },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroBtn: {
    backgroundColor: GREEN,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  heroBtnText: { fontSize: 13, fontWeight: '800', color: WHITE },

  // Fila pequeña
  row: { flexDirection: 'row', gap: 14 },
  smallCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    gap: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  progressCard: { backgroundColor: WHITE },
  streakCard: { backgroundColor: GREEN_DARK },
  smallCardTag: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  smallCardTagLight: { fontSize: 11, fontWeight: '700', color: GREEN_LIGHT, textTransform: 'uppercase', letterSpacing: 0.5 },
  avatarEmoji: { fontSize: 32 },
  progressLevel: { fontSize: 16, fontWeight: '900', color: GREEN_DARK },
  miniBarBg: { height: 5, backgroundColor: '#e2e8f0', borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 4 },
  miniBarFill: { height: '100%', backgroundColor: GREEN, borderRadius: BorderRadius.full },
  streakNumber: { fontSize: 40, fontWeight: '900', color: WHITE },
  streakLabel: { fontSize: 15, fontWeight: '700', color: GREEN_LIGHT },
  streakDecisions: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // Accesos rápidos
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  quickIcon: { fontSize: 26 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textAlign: 'center' },

  // Alerta perfil
  alertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  alertIcon: { fontSize: 24 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  alertSub: { fontSize: 12, color: '#a16207' },
  alertArrow: { fontSize: 22, color: '#d97706', fontWeight: '700' },

  // RA
  raCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  raMain: {
    backgroundColor: GREEN_LIGHT,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raTag: { fontSize: 11, fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 },
  raTitle: { fontSize: 20, fontWeight: '900', color: GREEN_DARK, marginTop: 2 },
  raSub: { fontSize: 12, color: '#4a7c36', marginTop: 2 },
  raEmoji: { fontSize: 44 },
  raSecond: { padding: 14, alignItems: 'center' },
  raSecondText: { fontSize: 14, fontWeight: '700', color: '#64748b' },

  // Legal
  legalText: { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 16 },
});