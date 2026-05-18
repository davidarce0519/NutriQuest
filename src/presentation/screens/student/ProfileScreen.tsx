import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useHealthStore } from '../../../infrastructure/stores/healthStore';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { logoutUseCase, deleteUserDataUseCase, deleteAccountUseCase } from '../../../domain/usecases/auth';
import {
  saveHealthProfileUseCase,
  calculateBmiUseCase,
  getHealthProfileUseCase,
  addMeasurementUseCase,
} from '../../../domain/usecases/health';
import { supabase } from '../../../data/supabase/supabaseClient';
import { BorderRadius } from '../../../infrastructure/theme';
import { cancelAllNotifications } from '../../../infrastructure/notifications/notificationService';
import { useNotificationStore } from '../../../infrastructure/stores/notificationStore';
import {
  updateDarkModeUseCase,
  updateNotificationsEnabledUseCase,
  pauseNotificationsUseCase,
  resumeNotificationsUseCase,
  updateNotificationHourUseCase,
} from '../../../domain/usecases/notifications';

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';

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

const PREF_CATEGORIES = [
  { key: 'alergia', label: 'Alergias', icon: '🤧', color: '#ef4444', bg: '#fef2f2', bgDark: '#2d1515', border: '#fca5a5', hint: 'ej: maní, mariscos, huevo' },
  { key: 'intolerancia', label: 'Intolerancias', icon: '😣', color: '#d97706', bg: '#fffbeb', bgDark: '#2d2108', border: '#fde68a', hint: 'ej: lactosa, gluten, fructosa' },
  { key: 'preferencia', label: 'Preferencias', icon: '💚', color: '#16a34a', bg: '#f0fdf4', bgDark: '#0f2318', border: '#bbf7d0', hint: 'ej: frutas, legumbres, snacks' },
  { key: 'restriccion', label: 'Restricciones', icon: '🚫', color: '#7c3aed', bg: '#f5f3ff', bgDark: '#1e1535', border: '#ddd6fe', hint: 'ej: sin cerdo, sin picante' },
];

type FoodPref = { id: string; category: string; value: string; severity?: string };

export const ProfileScreen = () => {
  const { user, clear: clearAuth } = useAuthStore();
  const { profile, setProfile, clear: clearHealth } = useHealthStore();
  const { isDark } = useTheme();
  const {
    settings: notifSettings,
    updateSettings: updateNotifStore,
    clear: clearNotif,
  } = useNotificationStore();

  // ── Colores dinámicos ──
  const bg = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const inputBg = isDark ? '#334155' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#475569' : '#94a3b8';
  const green = isDark ? '#22c55e' : '#1a6b0a';
  const greenDark = isDark ? '#16a34a' : '#042901';
  const greenLight = isDark ? '#4ade80' : '#c1d9b7';

  // ── Estado biométricos ──
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

  // ── Estado notificaciones ──
  const [notifHour, setNotifHour] = useState(notifSettings?.notificationHour ?? 12);
  const [savingHour, setSavingHour] = useState(false);

  // ── Estado eliminación ──
  const [deleting, setDeleting] = useState(false);

  // ── Estado preferencias ──
  const [preferences, setPreferences] = useState<FoodPref[]>([]);
  const [prefLoading, setPrefLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState<typeof PREF_CATEGORIES[0] | null>(null);
  const [newPrefValue, setNewPrefValue] = useState('');
  const [addingPref, setAddingPref] = useState(false);

  useEffect(() => {
    if (notifSettings?.notificationHour !== undefined) {
      setNotifHour(notifSettings.notificationHour);
    }
  }, [notifSettings?.notificationHour]);

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
        id: d.id, category: d.category, value: d.value, severity: d.severity,
      })));
    } catch { }
    finally { setPrefLoading(false); }
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
        .insert({ user_id: user.id, category: modalCategory.key, value: newPrefValue.trim().toLowerCase() })
        .select().single();
      if (error) throw error;
      setPreferences(prev => [...prev, { id: data.id, category: data.category, value: data.value, severity: data.severity }]);
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

  const handleChangeNotifHour = async (delta: number) => {
    if (!user || !notifSettings) return;
    const newHour = Math.min(22, Math.max(6, notifHour + delta));
    setNotifHour(newHour);
    setSavingHour(true);
    try {
      const updated = await updateNotificationHourUseCase(user.id, newHour, notifSettings.expoNotificationId);
      updateNotifStore(updated);
    } catch {
      setNotifHour(notifHour);
    } finally {
      setSavingHour(false);
    }
  };

  const handleResumeNow = async () => {
    if (!user || !notifSettings) return;
    try {
      const updated = await resumeNotificationsUseCase(user.id, notifSettings.notificationHour, notifSettings.expoNotificationId);
      updateNotifStore(updated);
    } catch {
      Alert.alert('Error', 'No se pudo reanudar las notificaciones.');
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      '⚠️ Eliminar mis datos',
      'Esta acción eliminará permanentemente:\n\n• Tu historial de sugerencias\n• Tus preferencias alimentarias\n• Tus datos biométricos\n• Tu progreso del avatar\n\nTu cuenta permanecerá activa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar →',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar eliminación',
              '¿Estás completamente seguro? Esta acción no se puede deshacer.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sí, eliminar todo',
                  style: 'destructive',
                  onPress: () => confirmarEliminacion(),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const confirmarEliminacion = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      await cancelAllNotifications().catch(() => {});
      await deleteUserDataUseCase(user.id);
      clearHealth();
      clearNotif();
      setWeightKg('');
      setHeightCm('');
      setGoal('');
      setDietType('');
      setActivity('');
      setSemester('');
      setSleepHours('');
      setWaterGlasses('');
      setBmiPreview(null);
      setPreferences([]);
      Alert.alert(
        '✅ Datos eliminados',
        'Todos tus datos han sido eliminados correctamente. Tu cuenta sigue activa y puedes volver a configurar tu perfil.',
        [{ text: 'Entendido' }],
      );
    } catch (e: any) {
      Alert.alert('Error', `No se pudieron eliminar los datos: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '🚨 Eliminar cuenta',
      'Esta acción es IRREVERSIBLE.\n\nSe eliminará:\n• Tu cuenta completa\n• Todos tus datos\n• Tu historial\n• Tu progreso\n\nNo podrás recuperar tu cuenta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar →',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '¿Estás completamente seguro?',
              'Una vez eliminada tu cuenta no hay vuelta atrás.',
              [
                { text: 'No, mantener cuenta', style: 'cancel' },
                {
                  text: 'SÍ, ELIMINAR TODO',
                  style: 'destructive',
                  onPress: ejecutarEliminacionCuenta,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const ejecutarEliminacionCuenta = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      await cancelAllNotifications().catch(() => {});
      await deleteAccountUseCase();
      clearAuth();
      clearHealth();
      clearNotif();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la cuenta. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => { await logoutUseCase(); clearAuth(); clearHealth(); clearNotif(); },
      },
    ]);
  };

  const bmiColor =
    !bmiPreview ? '#94a3b8' :
      bmiPreview.category === 'Normal' ? '#16a34a' :
        bmiPreview.category === 'Bajo peso' ? '#0284c7' :
          bmiPreview.category === 'Sobrepeso' ? '#d97706' : '#dc2626';

  if (loading) return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />
      <ActivityIndicator color="#ffffff" size="large" style={{ marginTop: 100 }} />
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <View style={[s.topStrip, { backgroundColor: green }]} />

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER */}
          <View style={s.header}>
            <View>
              <Text style={[s.headerSub, { color: greenLight }]}>Mi perfil de salud</Text>
              <Text style={s.headerTitle}>{user?.fullName?.split(' ')[0] ?? 'Estudiante'}</Text>
            </View>
            <View style={s.avatarCircleLg}>
              <Text style={s.avatarLetterLg}>{user?.fullName?.[0]?.toUpperCase() ?? 'E'}</Text>
            </View>
          </View>

          {/* INFO CARD */}
          <View style={[s.infoCard, { backgroundColor: cardBg }]}>
            <View style={s.infoRow}>
              <View style={s.infoBlock}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Correo</Text>
                <Text style={[s.infoValue, { color: textPrimary }]} numberOfLines={1}>{user?.email}</Text>
              </View>
              <View style={[s.infoDivider, { backgroundColor: border }]} />
              <View style={s.infoBlock}>
                <Text style={[s.infoLabel, { color: textMuted }]}>Rol</Text>
                <Text style={[s.infoValue, { color: textPrimary }]}>🎓 Estudiante</Text>
              </View>
            </View>
          </View>

          {/* IMC CARD */}
          {bmiPreview ? (
            <View style={[s.bmiCard, { backgroundColor: cardBg, borderLeftColor: bmiColor }]}>
              <View>
                <Text style={[s.bmiLabel, { color: textMuted }]}>Índice de Masa Corporal</Text>
                <Text style={[s.bmiValue, { color: bmiColor }]}>{bmiPreview.bmi}</Text>
              </View>
              <View>
                <View style={[s.bmiPill, { backgroundColor: bmiColor + '18' }]}>
                  <Text style={[s.bmiCat, { color: bmiColor }]}>{bmiPreview.category}</Text>
                </View>
                <Text style={[s.bmiSub, { color: textMuted }]}>
                  {bmiPreview.category === 'Normal' ? '✓ Rango saludable' : 'Consulta un profesional'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[s.bmiEmptyCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.bmiEmptyText, { color: textMuted }]}>📏 Ingresa peso y talla para calcular tu IMC</Text>
            </View>
          )}

          {/* BIOMÉTRICOS */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: textMuted }]}>📏 Datos biométricos</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg }]}>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={[s.fieldLabel, { color: textMuted }]}>Peso (kg)</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                    value={weightKg}
                    onChangeText={v => { setWeightKg(v); tryBmi(v, heightCm); }}
                    keyboardType="decimal-pad"
                    placeholder="ej: 65.5"
                    placeholderTextColor={textMuted}
                  />
                </View>
                <View style={s.halfField}>
                  <Text style={[s.fieldLabel, { color: textMuted }]}>Talla (cm)</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                    value={heightCm}
                    onChangeText={v => { setHeightCm(v); tryBmi(weightKg, v); }}
                    keyboardType="decimal-pad"
                    placeholder="ej: 170"
                    placeholderTextColor={textMuted}
                  />
                </View>
              </View>
              <View style={s.row}>
                <View style={s.halfField}>
                  <Text style={[s.fieldLabel, { color: textMuted }]}>Semestre</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                    value={semester}
                    onChangeText={setSemester}
                    keyboardType="number-pad"
                    placeholder="ej: 5"
                    placeholderTextColor={textMuted}
                  />
                </View>
                <View style={s.halfField}>
                  <Text style={[s.fieldLabel, { color: textMuted }]}>Horas de sueño</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    keyboardType="decimal-pad"
                    placeholder="ej: 7"
                    placeholderTextColor={textMuted}
                  />
                </View>
              </View>
              <View style={s.halfField}>
                <Text style={[s.fieldLabel, { color: textMuted }]}>Vasos de agua al día</Text>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                  value={waterGlasses}
                  onChangeText={setWaterGlasses}
                  keyboardType="number-pad"
                  placeholder="ej: 8"
                  placeholderTextColor={textMuted}
                />
              </View>
            </View>
          </View>

          {/* PREFERENCIAS ALIMENTARIAS */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: textMuted }]}>🚨 Preferencias alimentarias</Text>
            <Text style={[s.sectionSubtitle, { color: textMuted }]}>
              Esta información personaliza tus sugerencias y activa alertas de seguridad.
            </Text>
            {prefLoading ? (
              <ActivityIndicator color={green} style={{ marginTop: 12 }} />
            ) : (
              <View style={s.prefGrid}>
                {PREF_CATEGORIES.map(cat => {
                  const items = preferences.filter(p => p.category === cat.key);
                  const catBg = isDark ? cat.bgDark : cat.bg;
                  return (
                    <View key={cat.key} style={[s.prefCard, { borderColor: cat.border, backgroundColor: catBg }]}>
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
                      {items.length === 0 ? (
                        <Text style={[s.prefEmpty, { color: cat.color + '88' }]}>{cat.hint}</Text>
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
                        <Text style={[s.prefHint, { color: textMuted }]}>Mantén presionado para eliminar</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* OBJETIVO */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: textMuted }]}>🎯 Objetivo nutricional</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg }]}>
              <View style={s.chips}>
                {GOALS.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[s.chip, { backgroundColor: inputBg, borderColor: border }, goal === g.key && { backgroundColor: greenDark, borderColor: greenDark }]}
                    onPress={() => setGoal(g.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, { color: textSecondary }, goal === g.key && { color: '#ffffff' }]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* DIETA */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: textMuted }]}>🥗 Tipo de dieta</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg }]}>
              <View style={s.chips}>
                {DIETS.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[s.chip, { backgroundColor: inputBg, borderColor: border }, dietType === d.key && { backgroundColor: greenDark, borderColor: greenDark }]}
                    onPress={() => setDietType(d.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, { color: textSecondary }, dietType === d.key && { color: '#ffffff' }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ACTIVIDAD */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: textMuted }]}>🏃 Actividad física</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg }]}>
              <View style={s.chips}>
                {ACTIVITY.map(a => (
                  <TouchableOpacity
                    key={a.key}
                    style={[s.chip, { backgroundColor: inputBg, borderColor: border }, activity === a.key && { backgroundColor: greenDark, borderColor: greenDark }]}
                    onPress={() => setActivity(a.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.chipText, { color: textSecondary }, activity === a.key && { color: '#ffffff' }]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* CONFIGURACIÓN */}
          {notifSettings && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: textMuted }]}>⚙️ Configuración</Text>
              <View style={[s.sectionCard, { backgroundColor: cardBg }]}>

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
                    <Text style={[s.toggleDesc, { color: textMuted }]}>Recibir sugerencias alimentarias</Text>
                  </View>
                  <Switch
                    value={notifSettings.notificationsEnabled}
                    onValueChange={handleNotificationsEnabledToggle}
                    trackColor={{ false: border, true: greenLight }}
                    thumbColor={notifSettings.notificationsEnabled ? green : '#f4f3f4'}
                  />
                </View>

                {notifSettings.notificationsEnabled && (
                  <>
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

                    {notifSettings.notificationsPaused && notifSettings.notificationsPausedUntil && (
                      <View style={[s.pausedBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                        <Text style={[s.pausedBannerText, { color: '#ef4444' }]}>
                          Pausadas hasta las {new Date(notifSettings.notificationsPausedUntil).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <TouchableOpacity
                          style={[s.resumeBtn, { backgroundColor: GREEN }]}
                          onPress={handleResumeNow}
                          activeOpacity={0.8}
                        >
                          <Text style={s.resumeBtnText}>Reanudar ahora</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {!notifSettings.notificationsPaused && (
                      <View style={s.hourRow}>
                        <View style={s.toggleInfo}>
                          <Text style={[s.toggleLabel, { color: textPrimary }]}>Hora de notificación</Text>
                          <Text style={[s.toggleDesc, { color: textMuted }]}>
                            Se enviará a las {notifHour}:00
                          </Text>
                        </View>
                        <View style={s.hourControls}>
                          <TouchableOpacity
                            style={[s.hourBtn, { borderColor: border }]}
                            onPress={() => handleChangeNotifHour(-1)}
                            disabled={savingHour || notifHour <= 6}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.hourBtnText, { color: notifHour <= 6 ? textMuted : textPrimary }]}>−</Text>
                          </TouchableOpacity>
                          <Text style={[s.hourValue, { color: green }]}>{notifHour}h</Text>
                          <TouchableOpacity
                            style={[s.hourBtn, { borderColor: border }]}
                            onPress={() => handleChangeNotifHour(1)}
                            disabled={savingHour || notifHour >= 22}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.hourBtnText, { color: notifHour >= 22 ? textMuted : textPrimary }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}

              </View>
            </View>
          )}

          {/* GUARDAR */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: isDark ? green : GREEN_DARK }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={s.saveBtnText}>Guardar cambios</Text>
            }
          </TouchableOpacity>

          {/* ACCIONES SECUNDARIAS */}
          <View style={s.secondaryActions}>
            <TouchableOpacity
              style={[s.deleteBtn, deleting && { opacity: 0.6 }]}
              onPress={handleDeleteData}
              disabled={deleting}
              activeOpacity={0.8}
            >
              {deleting
                ? <ActivityIndicator color="#ef4444" size="small" />
                : <Text style={s.deleteBtnText}>🗑  Eliminar mis datos</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.deleteAccountBtn, deleting && { opacity: 0.6 }]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator color="#ffffff" size="small" />
                : <Text style={s.deleteAccountBtnText}>🚨 Eliminar mi cuenta</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.logoutBtn, { backgroundColor: inputBg, borderColor: border }]}
              onPress={handleLogout}
            >
              <Text style={[s.logoutBtnText, { color: textSecondary }]}>↪ Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity style={[s.modalCard, { backgroundColor: cardBg }]} activeOpacity={1}>
            {modalCategory && (
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalIcon}>{modalCategory.icon}</Text>
                  <View>
                    <Text style={[s.modalTitle, { color: textPrimary }]}>
                      Agregar {modalCategory.label.toLowerCase()}
                    </Text>
                    <Text style={[s.modalHint, { color: textMuted }]}>{modalCategory.hint}</Text>
                  </View>
                </View>
                <TextInput
                  style={[s.modalInput, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                  value={newPrefValue}
                  onChangeText={setNewPrefValue}
                  placeholder={modalCategory.hint}
                  placeholderTextColor={textMuted}
                  autoFocus
                  autoCapitalize="none"
                  onSubmitEditing={handleAddPreference}
                />
                <View style={s.modalActions}>
                  <TouchableOpacity
                    style={[s.modalCancelBtn, { backgroundColor: inputBg, borderColor: border }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[s.modalCancelText, { color: textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalConfirmBtn, { backgroundColor: modalCategory.color }]}
                    onPress={handleAddPreference}
                    disabled={addingPref || !newPrefValue.trim()}
                  >
                    {addingPref
                      ? <ActivityIndicator color="#ffffff" size="small" />
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
  container: { flex: 1 },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 200,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  headerSub: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  avatarCircleLg: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  avatarLetterLg: { fontSize: 24, fontWeight: '900', color: '#ffffff' },

  infoCard: { borderRadius: 20, padding: 16, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoBlock: { flex: 1, alignItems: 'center', gap: 3 },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  infoDivider: { width: 1, height: 32 },

  bmiCard: { borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  bmiLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  bmiValue: { fontSize: 40, fontWeight: '900' },
  bmiPill: { borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 4 },
  bmiCat: { fontSize: 14, fontWeight: '800' },
  bmiSub: { fontSize: 11, textAlign: 'right' },
  bmiEmptyCard: { borderRadius: 18, padding: 16, borderWidth: 1.5, borderStyle: 'dashed' },
  bmiEmptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  section: {},
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 10, lineHeight: 17 },
  sectionCard: { borderRadius: 20, padding: 16, gap: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },

  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, borderWidth: 1.5 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },

  saveBtn: { borderRadius: BorderRadius.full, paddingVertical: 15, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  secondaryActions: { gap: 10, marginTop: 4 },
  deleteBtn: { borderWidth: 1.5, borderRadius: BorderRadius.full, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  deleteAccountBtn: {
    backgroundColor: '#ef4444',
    borderRadius: BorderRadius.full,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteAccountBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutBtn: { borderRadius: BorderRadius.full, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  logoutBtnText: { fontSize: 15, fontWeight: '700' },

  prefGrid: { gap: 12 },
  prefCard: { borderRadius: 18, padding: 14, gap: 10, borderWidth: 1.5, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  prefCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prefCatLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefCatIcon: { fontSize: 20 },
  prefCatLabel: { fontSize: 14, fontWeight: '800' },
  prefAddBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  prefAddBtnText: { color: '#ffffff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  prefEmpty: { fontSize: 12, fontStyle: 'italic' },
  prefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  prefChipText: { fontSize: 13, fontWeight: '700' },
  prefChipX: { fontSize: 16, fontWeight: '700', marginTop: -1 },
  prefHint: { fontSize: 10, fontStyle: 'italic' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  toggleDivider: { height: 1, marginVertical: 4 },

  pausedBanner: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  pausedBannerText: { fontSize: 13, fontWeight: '700' },
  resumeBtn: { borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  resumeBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  hourControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hourBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  hourBtnText: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  hourValue: { fontSize: 16, fontWeight: '900', minWidth: 34, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: 24, padding: 24, gap: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIcon: { fontSize: 32 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalHint: { fontSize: 12 },
  modalInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, borderWidth: 1.5 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, borderRadius: BorderRadius.full, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5 },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, borderRadius: BorderRadius.full, paddingVertical: 13, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});