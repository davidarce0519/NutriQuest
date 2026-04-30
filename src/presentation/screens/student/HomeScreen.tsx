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
  
  // --- ESTADOS DE DATOS ---
  const [progress, setProgress] = useState<AvatarProgress | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  
  // --- ESTADO MODO OSCURO ---
  const [isDark, setIsDark] = useState(false);

  // Paleta de colores dinámica
  const theme = {
    bg: isDark ? '#121212' : '#f5f5f0',
    card: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    subText: isDark ? '#94a3b8' : '#64748b',
    strip: isDark ? '#082403' : GREEN,
    border: isDark ? '#334155' : '#e2e8f0',
  };

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
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <View style={[s.topStrip, { backgroundColor: theme.strip }]} />

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── HEADER ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
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

            {/* BOTÓN TOGGLE MODO OSCURO */}
            <TouchableOpacity 
              style={s.themeBtn} 
              onPress={() => setIsDark(!isDark)}
              activeOpacity={0.7}
            >
              <Text style={s.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── HERO CARD ── */}
          <TouchableOpacity
            style={s.heroCard}
            onPress={() => navigation.navigate('Sugerencia')}
            activeOpacity={0.9}
          >
            <View style={s.heroTop}>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>Sugerencia del día</Text>
              </View>
              <Text style={s.heroEmoji}>{suggestion ? '✨' : '🥗'}</Text>
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
              style={[s.smallCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('Progreso')}
              activeOpacity={0.88}
            >
              <Text style={s.smallCardTag}>Progreso</Text>
              <Text style={s.avatarEmoji}>{AVATAR_EMOJIS[progress?.currentLevel ?? 1]}</Text>
              <Text style={[s.progressLevel, { color: isDark ? GREEN_LIGHT : GREEN_DARK }]}>
                Nivel {progress?.currentLevel ?? 1}
              </Text>
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
            </TouchableOpacity>
          </View>

          {/* ── ACCESOS RÁPIDOS ── */}
          <Text style={[s.sectionLabel, { color: theme.subText }]}>Explorar</Text>
          <View style={s.quickGrid}>
            {[
              { icon: '🎮', label: 'Juego', tab: 'Sugerencia' as const },
              { icon: '📊', label: 'Historial', tab: 'Historial' as const },
              { icon: '👤', label: 'Perfil', tab: 'Perfil' as const },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[s.quickCard, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate(item.tab)}
                activeOpacity={0.8}
              >
                <Text style={s.quickIcon}>{item.icon}</Text>
                <Text style={[s.quickLabel, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── REALIDAD AUMENTADA ── */}
          <View style={[s.raCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={s.raMain} activeOpacity={0.85}>
              <View>
                <Text style={s.raTag}>✨ Inmersivo</Text>
                <Text style={s.raTitle}>Realidad Aumentada</Text>
              </View>
              <Text style={s.raEmoji}>🥤</Text>
            </TouchableOpacity>
            <View style={[s.raSecond, { borderTopWidth: 1, borderTopColor: theme.border }]}>
              <Text style={[s.raSecondText, { color: theme.subText }]}>Preparar Batido</Text>
            </View>
          </View>

          <Text style={s.legalText}>
            ⚠️ Contenido educativo · NutriQuest 2026
          </Text>

        </ScrollView>
      </SafeAreaView>
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
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 90, height: 45 },
  greetingText: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  nameText: { fontSize: 20, fontWeight: '900', color: '#ffffff' },

  themeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  themeIcon: { fontSize: 20 },

  heroCard: {
    backgroundColor: GREEN_DARK,
    borderRadius: 28,
    padding: 22,
    gap: 8,
    elevation: 8,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBadge: { backgroundColor: 'rgba(26, 107, 10, 0.4)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: GREEN_LIGHT, textTransform: 'uppercase' },
  heroEmoji: { fontSize: 32 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroBtn: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  heroBtnText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },

  row: { flexDirection: 'row', gap: 12 },
  smallCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    elevation: 3,
  },
  streakCard: { backgroundColor: GREEN_DARK },
  smallCardTag: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  smallCardTagLight: { fontSize: 10, fontWeight: '700', color: GREEN_LIGHT, textTransform: 'uppercase' },
  avatarEmoji: { fontSize: 28, marginVertical: 4 },
  progressLevel: { fontSize: 16, fontWeight: '900' },
  miniBarBg: { height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginTop: 6 },
  miniBarFill: { height: '100%', backgroundColor: GREEN, borderRadius: 2 },
  streakNumber: { fontSize: 36, fontWeight: '900', color: '#ffffff' },
  streakLabel: { fontSize: 14, fontWeight: '700', color: GREEN_LIGHT },

  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 10 },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    elevation: 2,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 10, fontWeight: '700' },

  raCard: { borderRadius: 24, overflow: 'hidden', elevation: 3 },
  raMain: { backgroundColor: GREEN_LIGHT, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raTag: { fontSize: 10, fontWeight: '700', color: GREEN },
  raTitle: { fontSize: 18, fontWeight: '900', color: GREEN_DARK },
  raEmoji: { fontSize: 38 },
  raSecond: { padding: 12, alignItems: 'center' },
  raSecondText: { fontSize: 13, fontWeight: '700' },

  legalText: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 10 },
});