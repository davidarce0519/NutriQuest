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

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#1a6b0a';
const CARD_BG = '#ebece7';

export const StudentListScreen = () => {
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
    <View style={s.container}>
      <SafeAreaView style={s.safe}>

        {/* Header verde igual al resto de la app */}
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn}>
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
          <View style={s.card}>

            {/* Saludo */}
            <View style={s.greetingRow}>
              <View>
                <Text style={s.role}>Nutricionista</Text>
                <Text style={s.name}>{user?.fullName?.split(' ')[0] ?? 'Nutricionista'}</Text>
              </View>
              <Text style={s.roleEmoji}>🥗</Text>
            </View>

            {/* Acciones rápidas */}
            <Text style={s.sectionTitle}>Panel de gestión</Text>

            {[
              { icon: '👥', label: 'Ver estudiantes', sub: 'Lista de estudiantes registrados' },
              { icon: '🍎', label: 'Gestionar catálogo', sub: 'Ir al catálogo de alimentos' },
              { icon: '📊', label: 'Ver mediciones', sub: 'Últimas mediciones de salud' },
              { icon: '✅', label: 'Validar recomendaciones', sub: 'Revisar y aprobar contenido' },
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

            {/* Aviso legal HU_5.2.1 */}
            <View style={s.disclaimer}>
              <Text style={s.disclaimerText}>
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
  container: { flex: 1, backgroundColor: GREEN },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 50, height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  iconBtnText: { color: 'white', fontSize: 22 },
  logo: { width: 120, height: 70 },
  logoutBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { color: 'white', fontSize: 22, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 40,
    padding: 22,
    gap: 14,
    elevation: 8,
  },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  role: { fontSize: 12, color: GREEN, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: '900', color: GREEN_DARK },
  roleEmoji: { fontSize: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 4 },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
  },
  actionIcon: { fontSize: 26 },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: GREEN_DARK },
  actionSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actionArrow: { fontSize: 24, color: '#cbd5e1', fontWeight: '700' },
  disclaimer: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  disclaimerText: { fontSize: 12, color: '#64748b' },
});