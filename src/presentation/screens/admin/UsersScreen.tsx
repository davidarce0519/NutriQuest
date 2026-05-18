import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore }  from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { logoutUseCase } from '../../../domain/usecases/auth';
import { BorderRadius }  from '../../../infrastructure/theme';
import { useTheme }      from '../../../infrastructure/theme/ThemeContext';

export const UsersScreen = () => {
  const { isDark } = useTheme();
  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg        = isDark ? '#1e293b' : '#ffffff';
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : '#1a6b0a';

  const { user, clear: clearAuth }  = useAuthStore();
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

  const STATS = [
    { label: 'Usuarios activos', value: '—', icon: '👥' },
    { label: 'Estudiantes',      value: '—', icon: '🎓' },
    { label: 'Nutricionistas',   value: '—', icon: '🥗' },
  ];

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={[s.role, { color: green }]}>Superadmin</Text>
              <Text style={[s.name, { color: textPrimary }]}>
                {user?.fullName?.split(' ')[0] ?? 'Admin'}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.logoutBtn, { backgroundColor: isDark ? '#1e293b' : 'rgba(0,0,0,0.06)' }]}
              onPress={handleLogout}
            >
              <Text style={[s.logoutIcon, { color: textSecondary }]}>↪</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {STATS.map((st) => (
              <View key={st.label} style={[s.statCard, { backgroundColor: cardBg, borderColor: border }]}>
                <Text style={s.statIcon}>{st.icon}</Text>
                <Text style={[s.statValue, { color: green }]}>{st.value}</Text>
                <Text style={[s.statLabel, { color: textMuted }]}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Acciones */}
          <Text style={[s.sectionTitle, { color: textMuted }]}>Gestión de usuarios</Text>

          {[
            { icon: '👤', label: 'Ver todos los usuarios',     sub: 'Lista completa de registros' },
            { icon: '🔑', label: 'Cambiar roles',              sub: 'Asignar nutricionista / admin' },
            { icon: '🚫', label: 'Desactivar usuarios',        sub: 'Bloquear acceso a la plataforma' },
            { icon: '⚙️',  label: 'Configuración del sistema', sub: 'Parámetros globales de la app' },
            { icon: '📋', label: 'Ver audit log',              sub: 'Historial de acciones admin' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[s.actionCard, { backgroundColor: cardBg, borderColor: border }]}
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

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  scroll:    { padding: 20, paddingBottom: 40, gap: 12 },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   8,
  },
  role:  { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  name:  { fontSize: 26, fontWeight: '800' },
  logoutBtn: {
    width:        46,
    height:       46,
    borderRadius: BorderRadius.full,
    alignItems:   'center',
    justifyContent: 'center',
  },
  logoutIcon:   { fontSize: 22, fontWeight: '700' },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statCard: {
    flex:         1,
    borderRadius: 16,
    padding:      14,
    alignItems:   'center',
    gap:          4,
    borderWidth:  1,
    elevation:    2,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statIcon:    { fontSize: 22 },
  statValue:   { fontSize: 22, fontWeight: '800' },
  statLabel:   { fontSize: 10, textAlign: 'center' },
  sectionTitle:{ fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  actionCard: {
    borderRadius: 16,
    padding:      16,
    flexDirection: 'row',
    alignItems:   'center',
    gap:          14,
    borderWidth:  1,
    elevation:    2,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  actionIcon:  { fontSize: 26 },
  actionInfo:  { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '700' },
  actionSub:   { fontSize: 12, marginTop: 2 },
  actionArrow: { fontSize: 24, fontWeight: '700' },
});
