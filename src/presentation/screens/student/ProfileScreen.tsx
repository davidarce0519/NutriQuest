import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
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
import { supabase } from '../../../data/supabase/supabaseClient';
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

// HU_2.1 — 4 categorías con íconos representativos
const PREF_CATEGORIES = [
  {
    key: 'alergia',
    label: 'Alergias',
    icon: '🤧',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fca5a5',
    hint: 'ej: maní, mariscos, huevo',
  },
  {
    key: 'intolerancia',
    label: 'Intolerancias',
    icon: '😣',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    hint: 'ej: lactosa, gluten, fructosa',
  },
  {
    key: 'preferencia',
    label: 'Preferencias',
    icon: '💚',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    hint: 'ej: frutas, legumbres, snacks',
  },
  {
    key: 'restriccion',
    label: 'Restricciones',
    icon: '🚫',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    hint: 'ej: sin cerdo, sin picante',
  },
];

type FoodPref = { id: string; category: string; value: string; severity?: string };

export const ProfileScreen = () => {
  const { user, clear: clearAuth } = useAuthStore();
  const { profile, setProfile, clear: clearHealth } = useHealthStore();

  // Biométricos
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

  // Preferencias alimentarias
  const [preferences, setPreferences] = useState<FoodPref[]>([]);
  const [prefLoading, setPrefLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState<typeof PREF_CATEGORIES[0] | null>(null);
  const [newPrefValue, setNewPrefValue] = useState('');
  const [addingPref, setAddingPref] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (profile) { fillForm(profile); } else {
      setLoading(true);
      getHealthProfileUseCase(user.id)
        .then(p => { setProfile(p); fillForm(p); })
        .catch(() => { })
        .finally(() => setLoading(false));
    }
    loadPreferences();
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

  const loadPreferences = async () => {
    if (!user) return;
    setPrefLoading(true);
    try {
      const { data, error } = await supabase
        .from('food_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      setPreferences(data.map((d: any) => ({
        id: d.id,
        category: d.category,
        value: d.value,
        severity: d.severity,
      })));
    } catch (e) {
      // silencioso
    } finally {
      setPrefLoading(false);
    }
  };

  const openAddModal = (cat: typeof PREF_CATEGORIES[0]) => {
    setModalCategory(cat);
    setNewPrefValue('');
    setModalVisible(true);
  };

  const handleAddPreference = async () => {
    if (!user || !modalCategory || !newPrefValue.trim()) return;
    setAddingPref(true);
    try {
      const { data, error } = await supabase
        .from('food_preferences')
        .insert({
          user_id: user.id,
          category: modalCategory.key,
          value: newPrefValue.trim().toLowerCase(),
        })
        .select()
        .single();
      if (error) throw error;
      setPreferences(prev => [...prev, {
        id: data.id, category: data.category,
        value: data.value, severity: data.severity,
      }]);
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingPref(false);
    }
  };

  const handleDeletePreference = (id: string, value: string) => {
    Alert.alert('Eliminar', `¿Eliminar "${value}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await supabase.from('food_preferences').delete().eq('id', id);
          setPreferences(prev => prev.filter(p => p.id !== id));
        },
      },
    ]);
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

          {/* HEADER */}
          <View style={s.header}>
            <View>
              <Text style={s.headerSub}>Mi perfil de salud</Text>
              <Text style={s.headerTitle}>{user?.fullName?.split(' ')[0] ?? 'Estudiante'}</Text>
            </View>
            <View style={s.avatarCircleLg}>
              <Text style={s.avatarLetterLg}>{user?.fullName?.[0]?.toUpperCase() ?? 'E'}</Text>
            </View>
          </View>

          {/* INFO CARD */}
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>Correo</Text>
                <Text style={s.infoValue} numberOfLines={1}>{user?.email}</Text>
              </View>
              <View style={s.infoDivider} />
              <View style={s.infoBlock}>
                <Text style={s.infoLabel}>Rol</Text>
                <Text style={s.infoValue}>🎓 Estudiante</Text>
              </View>
            </View>
          </View>

          {/* IMC CARD */}
          {bmiPreview ? (
            <View style={[s.bmiCard, { borderLeftColor: bmiColor }]}>
              <View>
                <Text style={s.bmiLabel}>Índice de Masa Corporal</Text>
                <Text style={[s.bmiValue, { color: bmiColor }]}>{bmiPreview.bmi}</Text>
              </View>
              <View>
                <View style={[s.bmiPill, { backgroundColor: bmiColor + '18' }]}>
                  <Text style={[s.bmiCat, { color: bmiColor }]}>{bmiPreview.category}</Text>
                </View>
                <Text style={s.bmiSub}>
                  {bmiPreview.category === 'Normal' ? '✓ Rango saludable' : 'Consulta un profesional'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.bmiEmptyCard}>
              <Text style={s.bmiEmptyText}>📏 Ingresa peso y talla para calcular tu IMC</Text>
            </View>
          )}

          {/* BIOMÉTRICOS */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📏 Datos biométricos</Text>
            <View style={s.sectionCard}>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Peso (kg)</Text>
                  <TextInput style={s.input} value={weightKg} onChangeText={v => { setWeightKg(v); tryBmi(v, heightCm); }} keyboardType="decimal-pad" placeholder="ej: 65.5" placeholderTextColor="#aaa" />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Talla (cm)</Text>
                  <TextInput style={s.input} value={heightCm} onChangeText={v => { setHeightCm(v); tryBmi(weightKg, v); }} keyboardType="decimal-pad" placeholder="ej: 170" placeholderTextColor="#aaa" />
                </View>
              </View>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Semestre</Text>
                  <TextInput style={s.input} value={semester} onChangeText={setSemester} keyboardType="number-pad" placeholder="ej: 5" placeholderTextColor="#aaa" />
                </View>
                <View style={s.halfField}>
                  <Text style={s.fieldLabel}>Horas de sueño</Text>
                  <TextInput style={s.input} value={sleepHours} onChangeText={setSleepHours} keyboardType="decimal-pad" placeholder="ej: 7" placeholderTextColor="#aaa" />
                </View>
              </View>
              <View style={s.halfField}>
                <Text style={s.fieldLabel}>Vasos de agua al día</Text>
                <TextInput style={s.input} value={waterGlasses} onChangeText={setWaterGlasses} keyboardType="number-pad" placeholder="ej: 8" placeholderTextColor="#aaa" />
              </View>
            </View>
          </View>

          {/* ── PREFERENCIAS ALIMENTARIAS HU_2.1 ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🚨 Preferencias alimentarias</Text>
            <Text style={s.sectionSubtitle}>
              Esta información personaliza tus sugerencias y activa alertas de seguridad.
            </Text>
            {prefLoading ? (
              <ActivityIndicator color={GREEN} style={{ marginTop: 12 }} />
            ) : (
              <View style={s.prefGrid}>
                {PREF_CATEGORIES.map(cat => {
                  const items = preferences.filter(p => p.category === cat.key);
                  return (
                    <View key={cat.key} style={[s.prefCard, { borderColor: cat.border, backgroundColor: cat.bg }]}>
                      {/* Cabecera de categoría */}
                      <View style={s.prefCardHeader}>
                        <View style={s.prefCatLeft}>
                          <Text style={s.prefCatIcon}>{cat.icon}</Text>
                          <Text style={[s.prefCatLabel, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                        <TouchableOpacity
                          style={[s.prefAddBtn, { backgroundColor: cat.color }]}
                          onPress={() => openAddModal(cat)}
                          activeOpacity={0.8}
                        >
                          <Text style={s.prefAddBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Items registrados */}
                      {items.length === 0 ? (
                        <Text style={[s.prefEmpty, { color: cat.color + '88' }]}>
                          {cat.hint}
                        </Text>
                      ) : (
                        <View style={s.prefChips}>
                          {items.map(item => (
                            <TouchableOpacity
                              key={item.id}
                              style={[s.prefChip, { backgroundColor: cat.color + '18', borderColor: cat.color + '44' }]}
                              onLongPress={() => handleDeletePreference(item.id, item.value)}
                              activeOpacity={0.8}
                            >
                              <Text style={[s.prefChipText, { color: cat.color }]}>{item.value}</Text>
                              <Text style={[s.prefChipX, { color: cat.color }]}>×</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {items.length > 0 && (
                        <Text style={s.prefHint}>Mantén presionado para eliminar</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* OBJETIVO */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🎯 Objetivo nutricional</Text>
            <View style={s.sectionCard}>
              <View style={s.chips}>
                {GOALS.map(g => (
                  <TouchableOpacity key={g.key} style={[s.chip, goal === g.key && s.chipActive]} onPress={() => setGoal(g.key)} activeOpacity={0.8}>
                    <Text style={[s.chipText, goal === g.key && s.chipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* DIETA */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🥗 Tipo de dieta</Text>
            <View style={s.sectionCard}>
              <View style={s.chips}>
                {DIETS.map(d => (
                  <TouchableOpacity key={d.key} style={[s.chip, dietType === d.key && s.chipActive]} onPress={() => setDietType(d.key)} activeOpacity={0.8}>
                    <Text style={[s.chipText, dietType === d.key && s.chipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ACTIVIDAD */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🏃 Actividad física</Text>
            <View style={s.sectionCard}>
              <View style={s.chips}>
                {ACTIVITY.map(a => (
                  <TouchableOpacity key={a.key} style={[s.chip, activity === a.key && s.chipActive]} onPress={() => setActivity(a.key)} activeOpacity={0.8}>
                    <Text style={[s.chipText, activity === a.key && s.chipTextActive]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* GUARDAR */}
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color={WHITE} /> : <Text style={s.saveBtnText}>Guardar cambios</Text>}
          </TouchableOpacity>

          {/* ACCIONES SECUNDARIAS */}
          <View style={s.secondaryActions}>
            <TouchableOpacity style={s.deleteBtn} onPress={() =>
              Alert.alert('Eliminar datos', 'Esta acción eliminará permanentemente todos tus datos. ¿Continuar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => { } },
              ])
            }>
              <Text style={s.deleteBtnText}>Eliminar mis datos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* MODAL: agregar preferencia */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={s.modalCard} activeOpacity={1}>
            {modalCategory && (
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalIcon}>{modalCategory.icon}</Text>
                  <View>
                    <Text style={s.modalTitle}>Agregar {modalCategory.label.toLowerCase()}</Text>
                    <Text style={s.modalHint}>{modalCategory.hint}</Text>
                  </View>
                </View>
                <TextInput
                  style={s.modalInput}
                  value={newPrefValue}
                  onChangeText={setNewPrefValue}
                  placeholder={modalCategory.hint}
                  placeholderTextColor="#aaa"
                  autoFocus
                  autoCapitalize="none"
                  onSubmitEditing={handleAddPreference}
                />
                <View style={s.modalActions}>
                  <TouchableOpacity style={s.modalCancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={s.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalConfirmBtn, { backgroundColor: modalCategory.color }]}
                    onPress={handleAddPreference}
                    disabled={addingPref || !newPrefValue.trim()}
                  >
                    {addingPref
                      ? <ActivityIndicator color={WHITE} size="small" />
                      : <Text style={s.modalConfirmText}>Agregar</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 200, backgroundColor: GREEN,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  headerSub: { fontSize: 12, color: GREEN_LIGHT, fontWeight: '600', letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: WHITE },
  avatarCircleLg: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  avatarLetterLg: { fontSize: 24, fontWeight: '900', color: WHITE },

  infoCard: { backgroundColor: WHITE, borderRadius: 20, padding: 16, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoBlock: { flex: 1, alignItems: 'center', gap: 3 },
  infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 13, fontWeight: '800', color: GREEN_DARK, textAlign: 'center' },
  infoDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },

  bmiCard: { backgroundColor: WHITE, borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  bmiLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  bmiValue: { fontSize: 40, fontWeight: '900' },
  bmiPill: { borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 4 },
  bmiCat: { fontSize: 14, fontWeight: '800' },
  bmiSub: { fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  bmiEmptyCard: { backgroundColor: WHITE, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  bmiEmptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  section: {},
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 10, lineHeight: 17 },
  sectionCard: { backgroundColor: WHITE, borderRadius: 20, padding: 16, gap: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },

  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: GREEN_DARK, borderWidth: 1.5, borderColor: '#e2e8f0' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: WHITE },

  saveBtn: { backgroundColor: GREEN_DARK, borderRadius: BorderRadius.full, paddingVertical: 15, alignItems: 'center', elevation: 4, shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },

  secondaryActions: { gap: 10, marginTop: 4 },
  deleteBtn: { borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: BorderRadius.full, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#f8fafc', borderRadius: BorderRadius.full, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#475569' },

  // Preferencias grid
  prefGrid: { gap: 12 },
  prefCard: {
    borderRadius: 18, padding: 14, gap: 10,
    borderWidth: 1.5,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  prefCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prefCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefCatIcon: { fontSize: 20 },
  prefCatLabel: { fontSize: 14, fontWeight: '800' },
  prefAddBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  prefAddBtnText: { color: WHITE, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  prefEmpty: { fontSize: 12, fontStyle: 'italic' },
  prefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  prefChipText: { fontSize: 13, fontWeight: '700' },
  prefChipX: { fontSize: 16, fontWeight: '700', marginTop: -1 },
  prefHint: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: WHITE, borderRadius: 24, padding: 24, gap: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIcon: { fontSize: 32 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: GREEN_DARK },
  modalHint: { fontSize: 12, color: '#94a3b8' },
  modalInput: { backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: GREEN_DARK, borderWidth: 1.5, borderColor: '#e2e8f0' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: BorderRadius.full, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  modalConfirmBtn: { flex: 1, borderRadius: BorderRadius.full, paddingVertical: 13, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: WHITE },
});