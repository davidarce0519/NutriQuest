import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore }        from '../../../infrastructure/stores/authStore';
import { useHealthStore }      from '../../../infrastructure/stores/healthStore';
import { useNotificationStore } from '../../../infrastructure/stores/notificationStore';
import { logoutUseCase }       from '../../../domain/usecases/auth';
import {
  getValidatedFoodsCountUseCase,
  getActiveFoodsCountUseCase,
} from '../../../domain/usecases/food';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import {
  updateDarkModeUseCase,
  updateNotificationsEnabledUseCase,
  pauseNotificationsUseCase,
  resumeNotificationsUseCase,
} from '../../../domain/usecases/notifications';

const GREEN       = '#1a6b0a';
const GREEN_DARK  = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const WHITE       = '#ffffff';
const BG          = '#f5f5f0';

export const NutritionistProfileScreen = () => {
  const { isDark } = useTheme();
  const { user, clear: clearAuth }  = useAuthStore();
  const { clear: clearHealth } = useHealthStore();
  const { settings: notifSettings, updateSettings: updateNotifStore, clear: clearNotif } = useNotificationStore();

  const bg            = isDark ? '#0f172a' : BG;
  const cardBg        = isDark ? '#1e293b' : WHITE;
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : GREEN;
  const greenDark     = isDark ? '#16a34a' : GREEN_DARK;
  const greenLight    = isDark ? '#4ade80' : GREEN_LIGHT;

  const [validatedCount, setValidatedCount] = useState<number | null>(null);
  const [activeCount, setActiveCount]       = useState<number | null>(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getValidatedFoodsCountUseCase(user.id),
      getActiveFoodsCountUseCase(),
    ])
      .then(([validated, active]) => {
        setValidatedCount(validated);
        setActiveCount(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

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

  const handleDarkModeAutoToggle = async (value: boolean) => {
    if (!user || !notifSettings) return;
    const newManual = value ? false : notifSettings.darkModeManual;
    updateNotifStore({ darkModeAuto: value, darkModeManual: newManual });
    try {
      const updated = await updateDarkModeUseCase(user.id, value, newManual);
      updateNotifStore(updated);
    } catch {
      updateNotifStore({ darkModeAuto: !value, darkModeManual: notifSettings.darkModeManual });
      Alert.alert('Error', 'No se pudo guardar la configuración de tema.');
    }
  };

  const handleDarkModeManualToggle = async (value: boolean) => {
    if (!user || !notifSettings) return;
    updateNotifStore({ darkModeManual: value });
    try {
      const updated = await updateDarkModeUseCase(user.id, notifSettings.darkModeAuto, value);
      updateNotifStore(updated);
    } catch {
      updateNotifStore({ darkModeManual: !value });
      Alert.alert('Error', 'No se pudo guardar la configuración de tema.');
    }
  };

  const handleNotificationsEnabledToggle = async (value: boolean) => {
    if (!user || !notifSettings) return;
    updateNotifStore({ notificationsEnabled: value });
    try {
      const updated = await updateNotificationsEnabledUseCase(user.id, value);
      updateNotifStore(updated);
    } catch {
      updateNotifStore({ notificationsEnabled: !value });
      Alert.alert('Error', 'No se pudo guardar la configuración de notificaciones.');
    }
  };

  const handleNotificationsPausedToggle = async (value: boolean) => {
    if (!user || !notifSettings) return;
    updateNotifStore({ notificationsPaused: value });
    try {
      const updated = value
        ? await pauseNotificationsUseCase(user.id)
        : await resumeNotificationsUseCase(user.id, notifSettings.notificationHour, notifSettings.expoNotificationId);
      updateNotifStore(updated);
    } catch {
      updateNotifStore({ notificationsPaused: !value });
      Alert.alert('Error', 'No se pudo actualizar el estado de notificaciones.');
    }
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() ?? 'N';

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
            <View style={[s.avatar, { backgroundColor: greenDark }]}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
            <Text style={[s.userName, { color: textPrimary }]} numberOfLines={1}>{user?.fullName}</Text>
            <View style={[s.roleBadge, { backgroundColor: green + '18', borderColor: green + '44' }]}>
              <Text style={[s.roleText, { color: green }]}>🥼 Nutricionista</Text>
            </View>
          </View>

          {/* Información */}
          <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.cardTitle, { color: textMuted }]}>Información</Text>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>✉️</Text>
              <View style={s.infoText}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Correo</Text>
                <Text style={[s.infoValue, { color: textPrimary }]} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>
            <View style={[s.separator, { backgroundColor: border }]} />
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>🥼</Text>
              <View style={s.infoText}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Rol</Text>
                <Text style={[s.infoValue, { color: textPrimary }]}>Nutricionista</Text>
              </View>
            </View>
          </View>

          {/* Mi actividad */}
          <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.cardTitle, { color: textMuted }]}>Mi actividad</Text>
            {loading ? (
              <ActivityIndicator color={green} style={{ marginVertical: 16 }} />
            ) : (
              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={[s.statNumber, { color: green }]}>{validatedCount ?? '—'}</Text>
                  <Text style={[s.statLabel, { color: textMuted }]}>Validados{'\n'}por mí</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: border }]} />
                <View style={s.statItem}>
                  <Text style={[s.statNumber, { color: green }]}>{activeCount ?? '—'}</Text>
                  <Text style={[s.statLabel, { color: textMuted }]}>Alimentos{'\n'}activos</Text>
                </View>
              </View>
            )}
          </View>

          {/* Configuración */}
          {notifSettings && (
            <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.cardTitle, { color: textMuted }]}>⚙️ Configuración</Text>

              <View style={s.toggleRow}>
                <View style={s.toggleInfo}>
                  <Text style={[s.toggleLabel, { color: textPrimary }]}>Modo oscuro automático</Text>
                  <Text style={[s.toggleDesc, { color: textMuted }]}>Se activa entre las 7pm y 6am</Text>
                </View>
                <Switch
                  value={notifSettings.darkModeAuto}
                  onValueChange={handleDarkModeAutoToggle}
                  trackColor={{ false: border, true: greenLight }}
                  thumbColor={notifSettings.darkModeAuto ? green : '#f4f3f4'}
                />
              </View>

              {!notifSettings.darkModeAuto && (
                <View style={s.toggleRow}>
                  <View style={s.toggleInfo}>
                    <Text style={[s.toggleLabel, { color: textPrimary }]}>Forzar modo oscuro</Text>
                    <Text style={[s.toggleDesc, { color: textMuted }]}>Modo oscuro siempre activo</Text>
                  </View>
                  <Switch
                    value={notifSettings.darkModeManual}
                    onValueChange={handleDarkModeManualToggle}
                    trackColor={{ false: border, true: greenLight }}
                    thumbColor={notifSettings.darkModeManual ? green : '#f4f3f4'}
                  />
                </View>
              )}

              <View style={[s.toggleDivider, { backgroundColor: border }]} />

              <View style={s.toggleRow}>
                <View style={s.toggleInfo}>
                  <Text style={[s.toggleLabel, { color: textPrimary }]}>
                    {notifSettings.notificationsEnabled ? '🔔 Notificaciones activas' : '🔕 Notificaciones desactivadas'}
                  </Text>
                  <Text style={[s.toggleDesc, { color: textMuted }]}>Recibir recordatorios diarios</Text>
                </View>
                <Switch
                  value={notifSettings.notificationsEnabled}
                  onValueChange={handleNotificationsEnabledToggle}
                  trackColor={{ false: border, true: greenLight }}
                  thumbColor={notifSettings.notificationsEnabled ? green : '#f4f3f4'}
                />
              </View>

              {notifSettings.notificationsEnabled && (
                <View style={s.toggleRow}>
                  <View style={s.toggleInfo}>
                    <Text style={[s.toggleLabel, { color: textPrimary }]}>
                      {notifSettings.notificationsPaused ? '🔕 Notificaciones pausadas' : '⏸ Pausar notificaciones'}
                    </Text>
                    <Text style={[s.toggleDesc, { color: textMuted }]}>
                      {notifSettings.notificationsPaused ? 'Toca para reanudar' : 'Silenciar temporalmente'}
                    </Text>
                  </View>
                  <Switch
                    value={notifSettings.notificationsPaused}
                    onValueChange={handleNotificationsPausedToggle}
                    trackColor={{ false: border, true: '#fca5a5' }}
                    thumbColor={notifSettings.notificationsPaused ? '#ef4444' : '#f4f3f4'}
                  />
                </View>
              )}
            </View>
          )}

          {/* Aviso legal */}
          <View style={[s.disclaimer, { backgroundColor: isDark ? '#422006' : '#fefce8', borderColor: '#fbbf24' }]}>
            <Text style={[s.disclaimerText, { color: isDark ? '#fde68a' : '#92400e' }]}>
              ⚠️ Las recomendaciones validadas aquí tienen carácter educativo. No reemplazan la consulta médica.
            </Text>
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

  statsRow:    { flexDirection: 'row', alignItems: 'center' },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 60 },
  statNumber:  { fontSize: 36, fontWeight: '900' },
  statLabel:   { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  disclaimer: {
    borderRadius: 14, borderLeftWidth: 3, padding: 14,
  },
  disclaimerText: { fontSize: 12, lineHeight: 18 },

  logoutBtn: {
    borderRadius: 50, borderWidth: 2,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '800' },

  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleInfo:   { flex: 1, paddingRight: 12 },
  toggleLabel:  { fontSize: 14, fontWeight: '700' },
  toggleDesc:   { fontSize: 12, marginTop: 2 },
  toggleDivider:{ height: 1, marginVertical: 4 },
});
