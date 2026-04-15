import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { logoutUseCase } from '../../../domain/usecases/auth';
import { BorderRadius } from '../../../infrastructure/theme';

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';
const CARD_BG    = '#1e293b';
const BG         = '#0f172a';

export const UsersScreen = () => {
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
    <View style={s.container}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.role}>Superadmin</Text>
              <Text style={s.name}>{user?.fullName?.split(' ')[0] ?? 'Admin'}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutIcon}>↪</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {STATS.map((st) => (
              <View key={st.label} style={s.statCard}>
                <Text style={s.statIcon}>{st.icon}</Text>
                <Text style={s.statValue}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Acciones */}
          <Text style={s.sectionTitle}>Gestión de usuarios</Text>

          {[
            { icon: '👤', label: 'Ver todos los usuarios',     sub: 'Lista completa de registros' },
            { icon: '🔑', label: 'Cambiar roles',              sub: 'Asignar nutricionista / admin' },
            { icon: '🚫', label: 'Desactivar usuarios',        sub: 'Bloquear acceso a la plataforma' },
            { icon: '⚙️',  label: 'Configuración del sistema', sub: 'Parámetros globales de la app' },
            { icon: '📋', label: 'Ver audit log',              sub: 'Historial de acciones admin' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={s.actionCard} activeOpacity={0.8}>
              <Text style={s.actionIcon}>{item.icon}</Text>
              <View style={s.actionInfo}>
                <Text style={s.actionLabel}>{item.label}</Text>
                <Text style={s.actionSub}>{item.sub}</Text>
              </View>
              <Text style={s.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe:      { flex: 1 },
  scroll:    { padding: 20, paddingBottom: 40, gap: 12 },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   8,
  },
  role:  { fontSize: 13, color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  name:  { fontSize: 26, fontWeight: '800', color: 'white' },
  logoutBtn: {
    width:           46,
    height:          46,
    borderRadius:    BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoutIcon:   { color: 'white', fontSize: 22, fontWeight: '700' },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statCard: {
    flex:            1,
    backgroundColor: CARD_BG,
    borderRadius:    16,
    padding:         14,
    alignItems:      'center',
    gap:             4,
  },
  statIcon:    { fontSize: 22 },
  statValue:   { fontSize: 22, fontWeight: '800', color: '#6366f1' },
  statLabel:   { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: '#94a3b8', marginTop: 8, marginBottom: 4 },
  actionCard: {
    backgroundColor: CARD_BG,
    borderRadius:    16,
    padding:         16,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
  },
  actionIcon:  { fontSize: 26 },
  actionInfo:  { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: 'white' },
  actionSub:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actionArrow: { fontSize: 24, color: '#475569', fontWeight: '700' },
});