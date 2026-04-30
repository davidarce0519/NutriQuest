import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../infrastructure/stores/authStore';

// Mantenemos tu paleta de colores original
const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#f5f5f0'; 
const WHITE = '#ffffff';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  
  // Estado local para el ejemplo (esto debería conectarse a un store global de tema)
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <View style={s.container}>
      <View style={s.topStrip} />

      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Ajustes</Text>
          <View style={{ width: 40 }} /> {/* Espaciador para centrar el título */}
        </View>

        <ScrollView 
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          
          {/* ── SECCIÓN: APARIENCIA ── */}
          <Text style={s.sectionLabel}>Apariencia</Text>
          
          <TouchableOpacity 
            style={s.settingCard} 
            activeOpacity={0.9}
            onPress={toggleTheme}
          >
            <View style={s.iconCircle}>
              <Text style={s.settingIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
            </View>
            <View style={s.settingTextContainer}>
              <Text style={s.settingTitle}>Modo Oscuro</Text>
              <Text style={s.settingSub}>Cambia el aspecto de la aplicación</Text>
            </View>
            <Switch
              trackColor={{ false: '#e2e8f0', true: GREEN_LIGHT }}
              thumbColor={isDarkMode ? GREEN : '#f4f3f4'}
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </TouchableOpacity>

          {/* ── SECCIÓN: CUENTA ── */}
          <Text style={s.sectionLabel}>Cuenta</Text>
          
          <View style={s.cardGroup}>
            <TouchableOpacity style={s.groupItem}>
              <Text style={s.itemIcon}>👤</Text>
              <Text style={s.itemLabel}>Editar Perfil</Text>
              <Text style={s.itemArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={s.separator} />
            
            <TouchableOpacity style={s.groupItem}>
              <Text style={s.itemIcon}>🔔</Text>
              <Text style={s.itemLabel}>Notificaciones</Text>
              <Text style={s.itemArrow}>›</Text>
            </TouchableOpacity>

            <View style={s.separator} />

            <TouchableOpacity style={s.groupItem}>
              <Text style={s.itemIcon}>🛡️</Text>
              <Text style={s.itemLabel}>Privacidad y Seguridad</Text>
              <Text style={s.itemArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── SECCIÓN: SOPORTE ── */}
          <Text style={s.sectionLabel}>Soporte</Text>
          <View style={s.cardGroup}>
            <TouchableOpacity style={s.groupItem}>
              <Text style={s.itemIcon}>❓</Text>
              <Text style={s.itemLabel}>Centro de ayuda</Text>
              <Text style={s.itemArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={s.separator} />
            
            <TouchableOpacity style={s.groupItem}>
              <Text style={s.itemIcon}>📄</Text>
              <Text style={s.itemLabel}>Términos y condiciones</Text>
              <Text style={s.itemArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── BOTÓN CERRAR SESIÓN ── */}
          <TouchableOpacity style={s.logoutBtn}>
            <Text style={s.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <Text style={s.versionText}>NutriQuest v1.0.0</Text>
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
    height: 120,
    backgroundColor: GREEN,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 30, color: WHITE, fontWeight: '300', marginTop: -4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: WHITE },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 20, gap: 12 },
  
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginTop: 10,
    marginLeft: 4,
  },

  // Card para Modo Oscuro
  settingCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingIcon: { fontSize: 22 },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  settingSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Grupo de opciones (Lista)
  cardGroup: {
    backgroundColor: WHITE,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  itemIcon: { fontSize: 20, marginRight: 14 },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#475569' },
  itemArrow: { fontSize: 20, color: '#cbd5e1', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 18 },

  // Logout
  logoutBtn: {
    marginTop: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
  
  versionText: { 
    textAlign: 'center', 
    color: '#cbd5e1', 
    fontSize: 12, 
    marginTop: 20,
    fontWeight: '600' 
  },
});