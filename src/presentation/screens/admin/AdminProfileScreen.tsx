import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import Constants         from 'expo-constants';
import { useAuthStore }        from '../../../infrastructure/stores/authStore';
import { useHealthStore }      from '../../../infrastructure/stores/healthStore';
import { useNotificationStore } from '../../../infrastructure/stores/notificationStore';
import { logoutUseCase, getActiveUsersCountUseCase } from '../../../domain/usecases/auth';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';

const GREEN       = '#1a6b0a';
const GREEN_LIGHT = '#c1d9b7';
const WHITE       = '#ffffff';
const BG          = '#f5f5f0';
const PURPLE      = '#7c3aed';

export const AdminProfileScreen = () => {
  const { isDark } = useTheme();
  const { user, clear: clearAuth }  = useAuthStore();
  const { clear: clearHealth } = useHealthStore();
  const { clear: clearNotif }  = useNotificationStore();

  const bg            = isDark ? '#0f172a' : BG;
  const cardBg        = isDark ? '#1e293b' : WHITE;
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : GREEN;
  const greenLight    = isDark ? '#4ade80' : GREEN_LIGHT;

  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    getActiveUsersCountUseCase()
      .then(setActiveUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          try {
            await logoutUseCase();
            clearAuth();
            clearHealth();
            clearNotif();
          } catch {}
        },
      },
    ]);
  };

  const appVersion = Constants.expoConfig?.version ?? '—';
  const initial    = user?.fullName?.charAt(0)?.toUpperCase() ?? 'A';

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />
      <SafeAreaView style={s.safe}>
        <View style={s.headerWrap}>
          <Text style={[s.headerSub, { color: greenLight }]}>Mi cuenta</Text>
          <Text style={s.headerTitle}>Perfil</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={s.avatarSection}>
            <View style={[s.avatar, { backgroundColor: PURPLE }]}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
            <Text style={[s.userName, { color: textPrimary }]}>{user?.fullName}</Text>
            <View style={[s.roleBadge, { backgroundColor: '#ede9fe', borderColor: '#c4b5fd' }]}>
              <Text style={[s.roleText, { color: PURPLE }]}>👑 Superadmin</Text>
            </View>
          </View>

          {/* Información */}
          <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.cardTitle, { color: textMuted }]}>Información</Text>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>✉️</Text>
              <View style={s.infoText}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Correo</Text>
                <Text style={[s.infoValue, { color: textPrimary }]}>{user?.email}</Text>
              </View>
            </View>
            <View style={[s.separator, { backgroundColor: border }]} />
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>👑</Text>
              <View style={s.infoText}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Rol</Text>
                <Text style={[s.infoValue, { color: textPrimary }]}>Superadmin</Text>
              </View>
            </View>
          </View>

          {/* Sistema */}
          <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.cardTitle, { color: textMuted }]}>Sistema</Text>
            {loading ? (
              <ActivityIndicator color={green} style={{ marginVertical: 12 }} />
            ) : (
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>👥</Text>
                <View style={s.infoText}>
                  <Text style={[s.infoLabel, { color: textMuted }]}>Usuarios activos</Text>
                  <Text style={[s.infoValue, { color: textPrimary }]}>{activeUsers ?? '—'} usuarios</Text>
                </View>
              </View>
            )}
            <View style={[s.separator, { backgroundColor: border }]} />
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>📱</Text>
              <View style={s.infoText}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Versión de la app</Text>
                <Text style={[s.infoValue, { color: textPrimary }]}>v{appVersion}</Text>
              </View>
            </View>
          </View>

          {/* Cerrar sesión */}
          <TouchableOpacity
            style={[s.logoutBtn, { borderColor: '#ef4444' }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={s.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 180, borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe:       { flex: 1 },
  headerWrap: { paddingHorizontal: 20, paddingTop: 12 },
  headerSub:  { fontSize: 12, fontWeight: '600' },
  headerTitle:{ fontSize: 28, fontWeight: '900', color: WHITE },
  scroll:     { padding: 18, paddingTop: 100, gap: 14, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  avatarInitial: { color: WHITE, fontSize: 36, fontWeight: '900' },
  userName:      { fontSize: 20, fontWeight: '800' },
  roleBadge: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  roleText: { fontSize: 13, fontWeight: '700' },

  card: {
    borderRadius: 20, padding: 18, gap: 12, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardTitle:  { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon:   { fontSize: 18, width: 24 },
  infoText:   { flex: 1 },
  infoLabel:  { fontSize: 11, fontWeight: '600' },
  infoValue:  { fontSize: 15, fontWeight: '700', marginTop: 1 },
  separator:  { height: 1, marginVertical: 4 },

  logoutBtn: {
    borderRadius: 50, borderWidth: 2,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '800' },
});
