import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { logoutUseCase } from '../../../domain/usecases/auth';
import {
  saveHealthProfileUseCase,
  calculateBmiUseCase,
  getHealthProfileUseCase,
  addMeasurementUseCase,
} from '../../../domain/usecases/health';
import { BorderRadius } from '../../../infrastructure/theme';

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const BG = '#f5f5f0';
const WHITE = '#ffffff';

const GOALS = [
  { key: 'mejorar_energia', label: '⚡ Energía' },
  { key: 'mejorar_concentracion', label: '🧠 Concentración' },
  { key: 'mantener_peso', label: '⚖️ Mantener peso' },
  { key: 'bienestar_general', label: '🌿 Bienestar' },
  { key: 'perder_peso', label: '📉 Perder peso' },
  { key: 'ganar_masa', label: '💪 Ganar masa' },
];

const DIETS = [
  { key: 'omnivora', label: 'Omnívora' },
  { key: 'vegetariana', label: 'Vegetariana' },
  { key: 'vegana', label: 'Vegana' },
  { key: 'flexitariana', label: 'Flexitariana' },
  { key: 'otra', label: 'Otra' },
];

const ACTIVITY = [
  { key: 'sedentario', label: '🪑 Sedentario' },
  { key: 'ligero', label: '🚶 Ligero' },
  { key: 'moderado', label: '🚴 Moderado' },
  { key: 'activo', label: '🏃 Activo' },
  { key: 'muy_activo', label: '🏋️ Muy activo' },
];

export const ProfileScreen = () => {
  const { user, clear: clearAuth } = useAuthStore();
  const { profile, setProfile, clear: clearHealth } = useHealthStore();

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [goal, setGoal] = useState('');
  const [dietType, setDietType] = useState('');
  const [activity, setActivity] = useState('');
  const [semester, setSemester] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [waterGlasses, setWaterGlasses] = useState('');
  const [bmiPreview, setBmiPreview] = useState<{ bmi: number; category: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (profile) { fillForm(profile); return; }
    setLoading(true);
    getHealthProfileUseCase(user.id)
      .then(p => { setProfile(p); fillForm(p); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user]);

  const fillForm = (p: any) => {
    setWeightKg(p.weightKg?.toString() ?? '');
    setHeightCm(p.heightCm?.toString() ?? '');
    setGoal(p.nutritionalGoal ?? '');
    setDietType(p.dietType ?? '');
    setActivity(p.physicalActivityLevel ?? '');
    setSemester(p.currentSemester?.toString() ?? '');
    setSleepHours(p.avgSleepHours?.toString() ?? '');
    setWaterGlasses(p.dailyWaterGlasses?.toString() ?? '');
    if (p.bmi) setBmiPreview({ bmi: p.bmi, category: p.bmiCategory });
  };

  const tryBmi = (w: string, h: string) => {
    try { setBmiPreview(calculateBmiUseCase(parseFloat(w), parseFloat(h))); }
    catch { setBmiPreview(null); }
  };

  const handleSave = async () => {
    if (!user) return;
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      Alert.alert('Error', 'Ingresa peso y talla válidos.');
      return;
    }
    try {
      setSaving(true);
      const updated = await saveHealthProfileUseCase(user.id, {
        weightKg: w, heightCm: h,
        nutritionalGoal: goal as any,
        dietType: dietType as any,
        physicalActivityLevel: activity as any,
        currentSemester: semester ? parseInt(semester) : undefined,
        avgSleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        dailyWaterGlasses: waterGlasses ? parseInt(waterGlasses) : undefined,
      });
      setProfile(updated);
      setBmiPreview({ bmi: updated.bmi!, category: updated.bmiCategory! });
      await addMeasurementUseCase(user.id, {
        weightKg: w, heightCm: h,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        waterGlasses: waterGlasses ? parseInt(waterGlasses) : undefined,
      });
      Alert.alert('✅ Guardado', `IMC: ${updated.bmi} — ${updated.bmiCategory}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => { await logoutUseCase(); clearAuth(); clearHealth(); },
      },
    ]);
  };

  const bmiColor =
    !bmiPreview ? '#94a3b8' :
      bmiPreview.category === 'Normal' ? '#16a34a' :
        bmiPreview.category === 'Bajo peso' ? '#0284c7' :
          bmiPreview.category === 'Sobrepeso' ? '#d97706' : '#dc2626';

  if (loading) return (
    <View style={s.container}>
      <View style={s.topStrip} />
      <ActivityIndicator color={WHITE} size="large" style={{ marginTop: 100 }} />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.topStrip} />
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Header */}
          {/* <View style={s.header}>
            <Text style={s.headerSub}>Mi perfil de salud</Text>
            <Text style={s.headerTitle}>{user?.fullName?.split(' ')[0] ?? 'Estudiante'}</Text>
          </View> */}

          {/* Info card */}
          <View style={s.infoCard}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarLetter}>
                {user?.fullName?.[0]?.toUpperCase() ?? 'E'}
              </Text>
            </View>
            <View style={s.infoRight}>
              <Text style={s.infoName}>{user?.fullName}</Text>
              <Text style={s.infoEmail}>{user?.email}</Text>
              <View style={s.rolePill}>
                <Text style={s.roleText}>🎓 Estudiante</Text>
              </View>
            </View>
          </View>

          {/* IMC card — siempre visible si hay datos */}
          {bmiPreview && (
            <View style={[s.bmiCard, { borderLeftColor: bmiColor }]}>
              <View style={s.bmiLeft}>
                <Text style={s.bmiLabel}>Índice de Masa Corporal</Text>
                <Text style={[s.bmiValue, { color: bmiColor }]}>{bmiPreview.bmi}</Text>
              </View>
              <View style={[s.bmiPill, { backgroundColor: bmiColor + '18' }]}>
                <Text style={[s.bmiCat, { color: bmiColor }]}>{bmiPreview.category}</Text>
              </View>
            </View>
          )}

          {/* ── SECCIÓN: Biométricos ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📏 Datos biométricos</Text>
            <View style={s.sectionCard}>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Peso (kg)</Text>
                  <TextInput
                    style={s.input}
                    value={weightKg}
                    onChangeText={v => { setWeightKg(v); tryBmi(v, heightCm); }}
                    keyboardType="decimal-pad"
                    placeholder="ej: 65.5"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Talla (cm)</Text>
                  <TextInput
                    style={s.input}
                    value={heightCm}
                    onChangeText={v => { setHeightCm(v); tryBmi(weightKg, v); }}
                    keyboardType="decimal-pad"
                    placeholder="ej: 170"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Semestre</Text>
                  <TextInput
                    style={s.input}
                    value={semester}
                    onChangeText={setSemester}
                    keyboardType="number-pad"
                    placeholder="ej: 5"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Horas de sueño</Text>
                  <TextInput
                    style={s.input}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    keyboardType="decimal-pad"
                    placeholder="ej: 7"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>
              <Text style={s.fieldLabel}>Vasos de agua al día</Text>
              <TextInput
                style={s.input}
                value={waterGlasses}
                onChangeText={setWaterGlasses}
                keyboardType="number-pad"
                placeholder="ej: 8"
                placeholderTextColor="#aaa"
              />
            </View>
          </View>

          {/* ── SECCIÓN: Objetivo ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🎯 Objetivo nutricional</Text>
            <View style={s.sectionCard}>
              <View style={s.chips}>
                {GOALS.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[s.chip, goal === g.key && s.chipActive]}
                    onPress={() => setGoal(g.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, goal === g.key && s.chipTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── SECCIÓN: Dieta ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🥗 Tipo de dieta</Text>
            <View style={s.sectionCard}>
              <View style={s.chips}>
                {DIETS.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[s.chip, dietType === d.key && s.chipActive]}
                    onPress={() => setDietType(d.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, dietType === d.key && s.chipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── SECCIÓN: Actividad ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🏃 Actividad física</Text>
            <View style={s.sectionCard}>
              <View style={s.chips}>
                {ACTIVITY.map(a => (
                  <TouchableOpacity
                    key={a.key}
                    style={[s.chip, activity === a.key && s.chipActive]}
                    onPress={() => setActivity(a.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, activity === a.key && s.chipTextActive]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Guardar */}
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving
              ? <ActivityIndicator color={WHITE} />
              : <Text style={s.saveBtnText}>Guardar cambios</Text>
            }
          </TouchableOpacity>

          {/* Acciones secundarias */}
          <View style={s.secondaryActions}>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => Alert.alert(
                'Eliminar datos',
                'Esta acción eliminará permanentemente todos tus datos. ¿Continuar?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => { } },
                ]
              )}
            >
              <Text style={s.deleteBtnText}>🗑  Eliminar mis datos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.logoutBtnFull} onPress={handleLogout}>
              <Text style={s.logoutBtnIcon}>↪</Text>
              <Text style={s.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

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
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: {},
  headerSub: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: WHITE },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { color: WHITE, fontSize: 20, fontWeight: '700' },

  // Info card
  infoCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: '900', color: WHITE },
  infoRight: { flex: 1 },
  infoName: { fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  infoEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  rolePill: {
    backgroundColor: GREEN + '15',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: GREEN },

  // IMC card
  bmiCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bmiLeft: {},
  bmiLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  bmiValue: { fontSize: 36, fontWeight: '900' },
  bmiPill: { borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 8 },
  bmiCat: { fontSize: 15, fontWeight: '700' },

  // Secciones
  section: {},
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: GREEN_DARK,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: WHITE },

  // Botones
  saveBtn: {
    backgroundColor: GREEN_DARK,
    borderRadius: BorderRadius.full,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
  },
  saveBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },

  // Acciones secundarias al final
  secondaryActions: {
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  logoutBtnFull: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  logoutBtnIcon: { fontSize: 18 },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#475569' },
});