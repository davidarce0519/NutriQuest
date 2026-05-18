import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore }  from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { logoutUseCase } from '../../../domain/usecases/auth';
import { BorderRadius }  from '../../../infrastructure/theme';
import { useTheme }      from '../../../infrastructure/theme/ThemeContext';

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';

export const StudentListScreen = () => {
  const { isDark } = useTheme();
  const cardBg        = isDark ? '#1e293b' : '#ebece7';
  const textPrimary   = isDark ? '#f1f5f9' : GREEN_DARK;
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : GREEN;
  const greenDark     = isDark ? '#16a34a' : GREEN_DARK;
  const actionBg      = isDark ? '#334155' : '#ffffff';

  const { user, clear: clearAuth } = useAuthStore();
  const { clear: clearHealth } = useHealthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await logoutUseCase();
          clearAuth();
          clearHealth();
        },
      },
    ]);
  };

  return (
    <View style={[s.container, { backgroundColor: green }]}>
      <SafeAreaView style={s.safe}>

        {/* Header verde siempre */}
        <View style={s.header}>
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: greenDark }]}>
            <Text style={s.iconBtnText}>☰</Text>
          </TouchableOpacity>
          <Image
            source={require('../../../../assets/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.card, { backgroundColor: cardBg }]}>

            {/* Saludo */}
            <View style={s.greetingRow}>
              <View>
                <Text style={[s.role, { color: green }]}>Nutricionista</Text>
                <Text style={[s.name, { color: textPrimary }]}>
                  {user?.fullName?.split(' ')[0] ?? 'Nutricionista'}
                </Text>
              </View>
              <Text style={s.roleEmoji}>🥗</Text>
            </View>

            {/* Acciones rápidas */}
            <Text style={[s.sectionTitle, { color: textSecondary }]}>Panel de gestión</Text>

            {[
              { icon: '👥', label: 'Ver estudiantes',             sub: 'Lista de estudiantes registrados' },
              { icon: '🍎', label: 'Gestionar catálogo',          sub: 'Ir al catálogo de alimentos' },
              { icon: '📊', label: 'Ver mediciones',              sub: 'Últimas mediciones de salud' },
              { icon: '✅', label: 'Validar recomendaciones',     sub: 'Revisar y aprobar contenido' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[s.actionCard, { backgroundColor: actionBg }]}
                activeOpacity={0.8}
              >
                <Text style={s.actionIcon}>{item.icon}</Text>
                <View style={s.actionInfo}>
                  <Text style={[s.actionLabel, { color: textPrimary }]}>{item.label}</Text>
                  <Text style={[s.actionSub, { color: textMuted }]}>{item.sub}</Text>
                </View>
                <Text style={[s.actionArrow, { color: textMuted }]}>›</Text>
              </TouchableOpacity>
            ))}

            {/* Aviso legal HU_5.2.1 */}
            <View style={s.disclaimer}>
              <Text style={[s.disclaimerText, { color: textSecondary }]}>
                ⚠️ Las recomendaciones validadas aquí tienen carácter educativo e informativo.
              </Text>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: 20,
    paddingTop:       10,
    paddingBottom:    10,
  },
  iconBtn: {
    width: 50, height: 50,
    borderRadius: BorderRadius.full,
    alignItems:   'center',
    justifyContent: 'center',
    elevation: 4,
  },
  iconBtnText: { color: 'white', fontSize: 22 },
  logo: { width: 120, height: 70 },
  logoutBtn: {
    width:  50,
    height: 50,
    borderRadius:    BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoutIcon: { color: 'white', fontSize: 22, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 40,
    padding:  22,
    gap:      14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  role:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  name:  { fontSize: 24, fontWeight: '900' },
  roleEmoji: { fontSize: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  actionCard: {
    borderRadius: 16,
    padding:  16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  actionIcon: { fontSize: 26 },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '700' },
  actionSub:   { fontSize: 12, marginTop: 2 },
  actionArrow: { fontSize: 24, fontWeight: '700' },
  disclaimer: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  disclaimerText: { fontSize: 12 },
});
