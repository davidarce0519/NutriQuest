import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, TextInput, Alert, Modal, ScrollView,
  Dimensions, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { useTheme }    from '../../../infrastructure/theme/ThemeContext';
import {
  getAllFoodsUseCase,
  searchFoodsUseCase,
  createFoodUseCase,
  updateFoodUseCase,
  toggleFoodActiveUseCase,
  validateFoodUseCase,
} from '../../../domain/usecases/food';
import { Food }        from '../../../domain/models';
import { BorderRadius } from '../../../infrastructure/theme';

const { width: W } = Dimensions.get('window');
const LIST_PAD  = 14;
const CARD_GAP  = 10;
const CARD_W    = (W - LIST_PAD * 2 - CARD_GAP) / 2;

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
const ENERGY_LABELS = ['', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];

type FilterStatus = 'todos' | 'validados' | 'sin_validar' | 'inactivos';

const FILTERS: Array<{ key: FilterStatus; label: string }> = [
  { key: 'todos',       label: 'Todos' },
  { key: 'validados',   label: '✅ Validados' },
  { key: 'sin_validar', label: '⏳ Sin validar' },
  { key: 'inactivos',   label: '🔴 Inactivos' },
];

export const FoodCatalogScreen = () => {
  const { isDark } = useTheme();
  const user = useAuthStore((s) => s.user);

  const bg          = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg      = isDark ? '#1e293b' : '#ffffff';
  const inputBg     = isDark ? '#334155' : '#f8fafc';
  const border      = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted   = isDark ? '#475569' : '#94a3b8';
  const green       = isDark ? '#22c55e' : '#1a6b0a';
  const greenDark   = isDark ? '#16a34a' : '#042901';

  // ── Estado principal ─────────────────────────────────────────
  const [foods, setFoods]               = useState<Food[]>([]);
  const [filtered, setFiltered]         = useState<Food[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');

  // ── Detalle ──────────────────────────────────────────────────
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showDetail, setShowDetail]     = useState(false);

  // ── Formulario ───────────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [saving, setSaving]           = useState(false);
  const [nameError, setNameError]     = useState(false);

  const [formName, setFormName]               = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBenefits, setFormBenefits]       = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formImageUrl, setFormImageUrl]       = useState('');
  const [formPrepTime, setFormPrepTime]       = useState('');
  const [formEnergyLevel, setFormEnergyLevel] = useState('3');
  const [formCalories, setFormCalories]       = useState('');
  const [formProtein, setFormProtein]         = useState('');
  const [formCarbs, setFormCarbs]             = useState('');
  const [formFat, setFormFat]                 = useState('');
  const [formIsQuick, setFormIsQuick]         = useState(false);

  // ── Carga ────────────────────────────────────────────────────
  const loadFoods = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFoodsUseCase();
      setFoods(data);
      setFiltered(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFoods(); }, [loadFoods]);

  // ── Filtrado ─────────────────────────────────────────────────
  const applyStatusFilter = useCallback((list: Food[], status: FilterStatus): Food[] => {
    if (status === 'validados')   return list.filter(f => !!f.validatorName);
    if (status === 'sin_validar') return list.filter(f => !f.validatorName);
    if (status === 'inactivos')   return list.filter(f => !f.isActive);
    return list;
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFiltered(applyStatusFilter(foods, filterStatus));
    } else {
      searchFoodsUseCase(text)
        .then(results => setFiltered(applyStatusFilter(results, filterStatus)))
        .catch(() => {});
    }
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    if (!searchQuery.trim()) {
      setFiltered(applyStatusFilter(foods, status));
    } else {
      searchFoodsUseCase(searchQuery)
        .then(results => setFiltered(applyStatusFilter(results, status)))
        .catch(() => {});
    }
  };

  // ── Crear / editar ───────────────────────────────────────────
  const openCreate = () => {
    setFormName(''); setFormDescription(''); setFormBenefits('');
    setFormIngredients(''); setFormImageUrl(''); setFormPrepTime('');
    setFormEnergyLevel('3'); setFormCalories(''); setFormProtein('');
    setFormCarbs(''); setFormFat(''); setFormIsQuick(false);
    setNameError(false); setEditingFood(null); setShowForm(true);
  };

  const openEdit = (food: Food) => {
    setFormName(food.name);
    setFormDescription(food.description ?? '');
    setFormBenefits(food.nutritionalBenefits ?? '');
    setFormIngredients(food.ingredientsSummary ?? '');
    setFormImageUrl(food.imageUrl ?? '');
    setFormPrepTime(food.prepTimeMinutes?.toString() ?? '');
    setFormEnergyLevel(food.energyLevel?.toString() ?? '3');
    setFormCalories(food.caloriesKcal?.toString() ?? '');
    setFormProtein(food.proteinG?.toString() ?? '');
    setFormCarbs(food.carbsG?.toString() ?? '');
    setFormFat(food.fatG?.toString() ?? '');
    setFormIsQuick(food.isQuick);
    setNameError(false); setEditingFood(food);
    setShowDetail(false); setShowForm(true);
  };

  // ── Guardar ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formName.trim()) {
      setNameError(true);
      Alert.alert('Error', 'El nombre del alimento es requerido.');
      return;
    }
    setNameError(false);
    const data: Partial<Food> = {
      name:                formName.trim(),
      description:         formDescription.trim() || undefined,
      nutritionalBenefits: formBenefits.trim() || undefined,
      ingredientsSummary:  formIngredients.trim() || undefined,
      imageUrl:            formImageUrl.trim() || undefined,
      prepTimeMinutes:     formPrepTime ? parseInt(formPrepTime, 10) : undefined,
      energyLevel:         formEnergyLevel ? parseInt(formEnergyLevel, 10) : undefined,
      caloriesKcal:        formCalories ? parseInt(formCalories, 10) : undefined,
      proteinG:            formProtein ? parseFloat(formProtein) : undefined,
      carbsG:              formCarbs ? parseFloat(formCarbs) : undefined,
      fatG:                formFat ? parseFloat(formFat) : undefined,
      isQuick:             formIsQuick,
    };
    try {
      setSaving(true);
      if (editingFood) {
        await updateFoodUseCase(editingFood.id, data);
      } else {
        await createFoodUseCase(data);
      }
      await loadFoods();
      setShowForm(false);
      Alert.alert('✅ Guardado', editingFood ? 'Alimento actualizado.' : 'Alimento creado.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo — optimistic ───────────────────────────────
  const handleToggleActive = (food: Food) => {
    const action = food.isActive ? 'Desactivar' : 'Activar';
    Alert.alert(action, `¿${action} "${food.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action, style: 'destructive',
        onPress: async () => {
          const newActive = !food.isActive;
          const upd = (f: Food): Food => f.id === food.id ? { ...f, isActive: newActive } : f;
          setFoods(prev => prev.map(upd));
          setFiltered(prev => prev.map(upd));
          setSelectedFood(prev => prev?.id === food.id ? { ...prev, isActive: newActive } : prev);
          setShowDetail(false);
          try {
            await toggleFoodActiveUseCase(food.id, newActive);
          } catch (e: any) {
            const rollback = (f: Food): Food => f.id === food.id ? { ...f, isActive: food.isActive } : f;
            setFoods(prev => prev.map(rollback));
            setFiltered(prev => prev.map(rollback));
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ── Validar — optimistic ─────────────────────────────────────
  const handleValidate = (food: Food) => {
    if (!user) return;
    Alert.alert('Validar', `¿Validar "${food.name}" como alimento seguro?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Validar',
        onPress: async () => {
          try {
            await validateFoodUseCase(food.id, user.id, user.fullName);
            const upd = (f: Food): Food =>
              f.id === food.id ? { ...f, validatorName: user.fullName } : f;
            setFoods(prev => prev.map(upd));
            setFiltered(prev => prev.map(upd));
            setSelectedFood(prev =>
              prev?.id === food.id ? { ...prev, validatorName: user.fullName } : prev);
            setShowDetail(false);
            Alert.alert('✅ Alimento validado', `"${food.name}" ha sido validado.`);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  // ── Valores derivados ────────────────────────────────────────
  const activeCount       = foods.filter(f => f.isActive).length;
  const benefitsWordCount = formBenefits.trim() ? formBenefits.trim().split(/\s+/).length : 0;

  const detailIngredients = selectedFood?.ingredientsSummary
    ?.split(',').map(i => i.trim()).filter(Boolean) ?? [];
  const detailHasMacros   = !!(
    selectedFood?.caloriesKcal || selectedFood?.proteinG ||
    selectedFood?.carbsG || selectedFood?.fatG
  );
  const detailTiming      =
    !selectedFood?.energyLevel ? null :
    selectedFood.energyLevel >= 4
      ? { icon: '☀️', text: 'Antes de clases o estudio intenso' }
      : selectedFood.energyLevel >= 2
      ? { icon: '🌤', text: 'A media tarde o entre clases' }
      : { icon: '🌙', text: 'En la noche o como snack ligero' };

  // ── Render card ──────────────────────────────────────────────
  const renderFood = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={[
        s.foodCard,
        { backgroundColor: cardBg, borderColor: border },
        !item.isActive && { opacity: 0.55 },
      ]}
      onPress={() => { setSelectedFood(item); setShowDetail(true); }}
      activeOpacity={0.8}
    >
      <View style={s.foodCardMedia}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={s.foodImg} resizeMode="cover" />
        ) : (
          <View style={[s.foodImgFallback, { backgroundColor: green + '18' }]}>
            <Text style={s.foodImgEmoji}>🥗</Text>
          </View>
        )}
        {item.validatorName && (
          <View style={s.validBadge}><Text style={s.validBadgeText}>✅</Text></View>
        )}
      </View>
      <View style={[s.foodLabel, { backgroundColor: greenDark }]}>
        <Text style={s.foodLabelText} numberOfLines={2}>{item.name}</Text>
      </View>
      <View style={s.cardChipsWrap}>
        {item.isQuick && (
          <View style={[s.cardChip, { backgroundColor: isDark ? '#14532d' : '#f0fdf4' }]}>
            <Text style={[s.cardChipText, { color: '#16a34a' }]}>⚡ Rápido</Text>
          </View>
        )}
        {!!item.energyLevel && (
          <View style={[s.cardChip, { backgroundColor: ENERGY_COLORS[item.energyLevel] + '22' }]}>
            <Text style={[s.cardChipText, { color: ENERGY_COLORS[item.energyLevel] }]}>
              ⚡{item.energyLevel}/5
            </Text>
          </View>
        )}
        {!item.validatorName && (
          <View style={[s.cardChip, { backgroundColor: isDark ? '#422006' : '#fefce8' }]}>
            <Text style={[s.cardChipText, { color: '#d97706' }]}>⏳ Sin validar</Text>
          </View>
        )}
        {!item.isActive && (
          <View style={[s.cardChip, { backgroundColor: isDark ? '#2d1515' : '#fef2f2' }]}>
            <Text style={[s.cardChipText, { color: '#ef4444' }]}>Inactivo</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: bg }]}>

      {/* Header */}
      <View style={[s.topStrip, { backgroundColor: green }]}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerSub}>Panel nutricionista</Text>
              <Text style={s.headerTitle}>Catálogo 🥗</Text>
            </View>
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={openCreate}
              activeOpacity={0.8}
            >
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Búsqueda */}
      <View style={[s.searchWrap, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[s.searchIcon, { color: textMuted }]}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: textPrimary }]}
          placeholder="Buscar alimento..."
          placeholderTextColor={textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={[s.searchClear, { color: textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={s.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersContent}
          style={{ flex: 1 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                s.filterChip,
                { borderColor: filterStatus === f.key ? green : border },
                filterStatus === f.key && { backgroundColor: green },
              ]}
              onPress={() => handleFilterChange(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                s.filterChipText,
                { color: filterStatus === f.key ? '#ffffff' : textSecondary },
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[s.activeCounter, { color: textMuted }]}>{activeCount} activos</Text>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color={green} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderFood}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              {searchQuery ? (
                <>
                  <Text style={s.emptyEmoji}>🔍</Text>
                  <Text style={[s.emptyTitle, { color: textPrimary }]}>
                    Sin resultados para "{searchQuery}"
                  </Text>
                  <Text style={[s.emptySub, { color: textMuted }]}>Intenta con otro nombre</Text>
                  <TouchableOpacity
                    style={[s.emptyOutlineBtn, { borderColor: green }]}
                    onPress={() => handleSearch('')}
                  >
                    <Text style={[s.emptyOutlineBtnText, { color: green }]}>Limpiar búsqueda</Text>
                  </TouchableOpacity>
                </>
              ) : filterStatus !== 'todos' ? (
                <>
                  <Text style={s.emptyEmoji}>📋</Text>
                  <Text style={[s.emptyTitle, { color: textPrimary }]}>
                    No hay alimentos{' '}
                    {FILTERS.find(f => f.key === filterStatus)?.label
                      .replace(/[✅⏳🔴]/g, '').trim().toLowerCase()}
                  </Text>
                  <TouchableOpacity
                    style={[s.emptyOutlineBtn, { borderColor: green }]}
                    onPress={() => handleFilterChange('todos')}
                  >
                    <Text style={[s.emptyOutlineBtnText, { color: green }]}>Ver todos</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.emptyEmoji}>🥗</Text>
                  <Text style={[s.emptyTitle, { color: textPrimary }]}>¡Aún no hay alimentos!</Text>
                  <Text style={[s.emptySub, { color: textMuted }]}>Crea el primero para comenzar</Text>
                  <TouchableOpacity
                    style={[s.emptyFilledBtn, { backgroundColor: green }]}
                    onPress={openCreate}
                  >
                    <Text style={s.emptyFilledBtnText}>+ Crear alimento</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
        />
      )}

      {/* ── MODAL DETALLE ────────────────────────────────────── */}
      <Modal visible={showDetail} animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={[s.modalContainer, { backgroundColor: bg }]}>
          {selectedFood && (
            <SafeAreaView style={{ flex: 1 }}>

              {/* Hero */}
              <View style={s.heroWrap}>
                {selectedFood.imageUrl ? (
                  <Image source={{ uri: selectedFood.imageUrl }} style={s.heroImg} resizeMode="cover" />
                ) : (
                  <View style={[s.heroFallback, { backgroundColor: green + '20' }]}>
                    <Text style={{ fontSize: 80 }}>🥗</Text>
                  </View>
                )}
                <View style={s.heroOverlay} />
                <Text style={s.heroName} numberOfLines={2}>{selectedFood.name}</Text>
                <TouchableOpacity style={s.heroBack} onPress={() => setShowDetail(false)} activeOpacity={0.8}>
                  <Text style={s.heroBackText}>←</Text>
                </TouchableOpacity>
                <View style={[
                  s.heroBadge,
                  { backgroundColor: selectedFood.validatorName ? '#f0fdf4' : '#fefce8' },
                ]}>
                  <Text style={[
                    s.heroBadgeText,
                    { color: selectedFood.validatorName ? '#16a34a' : '#d97706' },
                  ]}>
                    {selectedFood.validatorName ? '✅ Validado' : '⏳ Sin validar'}
                  </Text>
                </View>
              </View>

              {/* Contenido */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.detailScroll}>

                {/* Chips horizontales */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.detailChipsRow}>
                  {selectedFood.prepTimeMinutes !== undefined && (
                    <View style={[s.detailChip, { backgroundColor: cardBg, borderColor: border }]}>
                      <Text style={[s.detailChipText, { color: textSecondary }]}>
                        ⏱ {selectedFood.prepTimeMinutes === 0 ? 'Sin prep' : `${selectedFood.prepTimeMinutes} min`}
                      </Text>
                    </View>
                  )}
                  {!!selectedFood.energyLevel && (
                    <View style={[s.detailChip, {
                      backgroundColor: ENERGY_COLORS[selectedFood.energyLevel] + '20',
                      borderColor: ENERGY_COLORS[selectedFood.energyLevel] + '40',
                    }]}>
                      <Text style={[s.detailChipText, { color: ENERGY_COLORS[selectedFood.energyLevel] }]}>
                        ⚡ Energía {selectedFood.energyLevel}/5
                      </Text>
                    </View>
                  )}
                  {selectedFood.isQuick && (
                    <View style={[s.detailChip, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                      <Text style={[s.detailChipText, { color: '#16a34a' }]}>💪 Rápido</Text>
                    </View>
                  )}
                  {selectedFood.validatorName && (
                    <View style={[s.detailChip, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                      <Text style={[s.detailChipText, { color: '#16a34a' }]}>
                        ✅ {selectedFood.validatorName}
                      </Text>
                    </View>
                  )}
                  {!selectedFood.isActive && (
                    <View style={[s.detailChip, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                      <Text style={[s.detailChipText, { color: '#ef4444' }]}>🔴 Inactivo</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Descripción */}
                {selectedFood.description && (
                  <Text style={[s.detailDesc, { color: textSecondary }]}>{selectedFood.description}</Text>
                )}

                {/* Beneficios */}
                {selectedFood.nutritionalBenefits && (
                  <View style={[s.benefitsCard, { borderColor: green + '44', backgroundColor: green + '0d' }]}>
                    <Text style={[s.detailSectionLabel, { color: green }]}>💡 ¿Por qué este alimento?</Text>
                    <Text style={[s.detailText, { color: textPrimary }]}>{selectedFood.nutritionalBenefits}</Text>
                  </View>
                )}

                {/* Ingredientes */}
                {detailIngredients.length > 0 && (
                  <View style={[s.detailSection, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[s.detailSectionLabel, { color: textMuted }]}>🛒 Ingredientes</Text>
                    {detailIngredients.map((ing, i) => (
                      <Text key={i} style={[s.ingredientItem, { color: textPrimary }]}>• {ing}</Text>
                    ))}
                  </View>
                )}

                {/* Macros */}
                {detailHasMacros && (
                  <View style={s.macroSection}>
                    <Text style={[s.detailSectionLabel, { color: textMuted }]}>📊 Información nutricional</Text>
                    <View style={s.macrosGrid}>
                      {([
                        { label: 'Calorías', val: selectedFood.caloriesKcal, unit: 'kcal', icon: '🔥' },
                        { label: 'Proteína', val: selectedFood.proteinG,     unit: 'g',    icon: '💪' },
                        { label: 'Carbos',   val: selectedFood.carbsG,       unit: 'g',    icon: '⚡' },
                        { label: 'Grasas',   val: selectedFood.fatG,         unit: 'g',    icon: '🫒' },
                      ] as Array<{ label: string; val: number | undefined; unit: string; icon: string }>)
                        .filter(m => m.val)
                        .map(m => (
                          <View key={m.label} style={[s.macroPill, { backgroundColor: cardBg, borderColor: border }]}>
                            <Text style={s.macroIcon}>{m.icon}</Text>
                            <Text style={[s.macroVal, { color: textPrimary }]}>{m.val}{m.unit}</Text>
                            <Text style={[s.macroLabel, { color: textMuted }]}>{m.label}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}

                {/* Momento ideal */}
                {detailTiming && (
                  <View style={[s.detailSection, { backgroundColor: cardBg, borderColor: border }]}>
                    <Text style={[s.detailSectionLabel, { color: textMuted }]}>⏰ Momento ideal</Text>
                    <Text style={[s.detailText, { color: textPrimary }]}>
                      {detailTiming.icon} {detailTiming.text}
                    </Text>
                  </View>
                )}

              </ScrollView>

              {/* Footer fijo */}
              <View style={[s.detailFooter, { backgroundColor: cardBg, borderTopColor: border }]}>
                <TouchableOpacity
                  style={[s.footerBtnMain, { backgroundColor: green }]}
                  onPress={() => openEdit(selectedFood)}
                  activeOpacity={0.85}
                >
                  <Text style={s.footerBtnText}>✏️ Editar</Text>
                </TouchableOpacity>

                {!selectedFood.validatorName && (
                  <TouchableOpacity
                    style={[s.footerBtnSec, { backgroundColor: '#0284c7' }]}
                    onPress={() => handleValidate(selectedFood)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.footerBtnText}>✅ Validar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[s.footerBtnToggle, {
                    backgroundColor: selectedFood.isActive ? '#fef2f2' : '#f0fdf4',
                    borderColor:     selectedFood.isActive ? '#fca5a5' : '#bbf7d0',
                  }]}
                  onPress={() => handleToggleActive(selectedFood)}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 22 }}>
                    {selectedFood.isActive ? '🔴' : '🟢'}
                  </Text>
                </TouchableOpacity>
              </View>

            </SafeAreaView>
          )}
        </View>
      </Modal>

      {/* ── MODAL FORMULARIO ─────────────────────────────────── */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={[s.modalContainer, { backgroundColor: bg }]}>

          {/* Header */}
          <View style={[s.formHeaderWrap, { backgroundColor: green }]}>
            <SafeAreaView edges={['top']}>
              <View style={s.formHeaderRow}>
                <TouchableOpacity style={s.formBackBtn} onPress={() => setShowForm(false)} activeOpacity={0.8}>
                  <Text style={s.formBackText}>←</Text>
                </TouchableOpacity>
                <Text style={s.formHeaderTitle}>
                  {editingFood ? 'Editar alimento' : 'Nuevo alimento'}
                </Text>
                <View style={{ width: 44 }} />
              </View>
            </SafeAreaView>
          </View>

          <ScrollView
            contentContainerStyle={s.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* INFORMACIÓN BÁSICA */}
            <Text style={[s.sectionHeader, { color: textMuted }]}>INFORMACIÓN BÁSICA</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.fieldLabel, { color: nameError ? '#ef4444' : textMuted }]}>
                Nombre{nameError ? ' * (requerido)' : ' *'}
              </Text>
              <TextInput
                style={[s.input, {
                  backgroundColor: inputBg,
                  borderColor: nameError ? '#ef4444' : border,
                  color: textPrimary,
                }]}
                value={formName}
                onChangeText={v => { setFormName(v); if (v.trim()) setNameError(false); }}
                placeholder="ej: Ensalada de quinoa"
                placeholderTextColor={textMuted}
              />

              <Text style={[s.fieldLabel, { color: textMuted }]}>URL de imagen</Text>
              <TextInput
                style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                value={formImageUrl}
                onChangeText={setFormImageUrl}
                placeholder="https://..."
                placeholderTextColor={textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
              {formImageUrl.trim().length > 0 && (
                <Image
                  source={{ uri: formImageUrl.trim() }}
                  style={s.imgPreview}
                  resizeMode="cover"
                  onError={() => {}}
                />
              )}
            </View>

            {/* DESCRIPCIÓN */}
            <Text style={[s.sectionHeader, { color: textMuted }]}>DESCRIPCIÓN</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.fieldLabel, { color: textMuted }]}>Descripción</Text>
              <TextInput
                style={[s.inputMulti, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Descripción breve del alimento..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={3}
              />

              <Text style={[s.fieldLabel, { color: textMuted }]}>Beneficios nutricionales</Text>
              <TextInput
                style={[s.inputMulti, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                value={formBenefits}
                onChangeText={setFormBenefits}
                placeholder="¿Por qué es saludable este alimento?"
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={3}
              />
              <Text style={[s.wordCounter, { color: benefitsWordCount > 100 ? '#ef4444' : textMuted }]}>
                {benefitsWordCount} / 100 palabras recomendadas
              </Text>

              <Text style={[s.fieldLabel, { color: textMuted }]}>Ingredientes</Text>
              <TextInput
                style={[s.inputMulti, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                value={formIngredients}
                onChangeText={setFormIngredients}
                placeholder="Separar por coma: pollo, arroz, espinaca..."
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* PREPARACIÓN */}
            <Text style={[s.sectionHeader, { color: textMuted }]}>PREPARACIÓN</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={s.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: textMuted }]}>Tiempo (min)</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                    value={formPrepTime}
                    onChangeText={setFormPrepTime}
                    placeholder="ej: 5"
                    placeholderTextColor={textMuted}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[s.quickToggle, { borderColor: border, backgroundColor: inputBg }]}>
                  <Text style={[s.fieldLabel, { color: textMuted, marginTop: 0 }]}>¿Es rápido?</Text>
                  <Switch
                    value={formIsQuick}
                    onValueChange={setFormIsQuick}
                    trackColor={{ false: border, true: green + '80' }}
                    thumbColor={formIsQuick ? green : '#f4f3f4'}
                  />
                </View>
              </View>

              <Text style={[s.fieldLabel, { color: textMuted }]}>Nivel energético (1–5)</Text>
              <View style={s.energySelector}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      s.energyBtn,
                      { borderColor: ENERGY_COLORS[n] },
                      formEnergyLevel === String(n) && { backgroundColor: ENERGY_COLORS[n] },
                    ]}
                    onPress={() => setFormEnergyLevel(String(n))}
                  >
                    <Text style={[
                      s.energyBtnText,
                      { color: formEnergyLevel === String(n) ? '#fff' : ENERGY_COLORS[n] },
                    ]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.energyLabelRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Text
                    key={n}
                    style={[
                      s.energyLabelText,
                      { color: formEnergyLevel === String(n) ? ENERGY_COLORS[n] : textMuted },
                    ]}
                  >
                    {ENERGY_LABELS[n]}
                  </Text>
                ))}
              </View>
            </View>

            {/* MACRONUTRIENTES */}
            <Text style={[s.sectionHeader, { color: textMuted }]}>MACRONUTRIENTES</Text>
            <View style={[s.sectionCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={s.macrosForm}>
                {([
                  { label: '🔥 Calorías (kcal)', val: formCalories, set: setFormCalories },
                  { label: '💪 Proteína (g)',    val: formProtein,  set: setFormProtein },
                  { label: '⚡ Carbos (g)',       val: formCarbs,    set: setFormCarbs },
                  { label: '🫒 Grasas (g)',       val: formFat,      set: setFormFat },
                ] as Array<{ label: string; val: string; set: (v: string) => void }>)
                  .map(({ label, val, set }) => (
                    <View key={label} style={s.macroField}>
                      <Text style={[s.fieldLabelSm, { color: textMuted }]}>{label}</Text>
                      <TextInput
                        style={[s.inputSm, { backgroundColor: inputBg, borderColor: border, color: textPrimary }]}
                        value={val}
                        onChangeText={set}
                        placeholder="0"
                        placeholderTextColor={textMuted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
              </View>
              <Text style={[s.macroHint, { color: textMuted }]}>Datos por porción típica</Text>
            </View>

          </ScrollView>

          {/* Footer formulario */}
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: cardBg }}>
            <View style={[s.formFooter, { backgroundColor: cardBg, borderTopColor: border }]}>
              <TouchableOpacity
                style={[s.formCancelBtn, { borderColor: border }]}
                onPress={() => setShowForm(false)}
                disabled={saving}
              >
                <Text style={[s.formCancelText, { color: textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.formSaveBtn, { backgroundColor: green, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.formSaveText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </SafeAreaView>

        </View>
      </Modal>

    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  topStrip: {
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    paddingHorizontal: 20, paddingBottom: 18,
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', paddingTop: 10,
  },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#ffffff', fontSize: 28, fontWeight: '900', lineHeight: 32 },

  // Búsqueda
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: LIST_PAD, marginTop: 14, marginBottom: 4,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  searchClear: { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },

  // Filtros
  filtersRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: LIST_PAD, marginBottom: 8,
  },
  filtersContent: { paddingHorizontal: LIST_PAD, gap: 8 },
  filterChip: {
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  activeCounter:  { fontSize: 11, fontWeight: '600', marginLeft: 8 },

  // Grid
  listContent: { paddingHorizontal: LIST_PAD, paddingBottom: 40, paddingTop: 4 },
  row:         { gap: CARD_GAP, marginBottom: CARD_GAP },

  // Card
  foodCard: {
    width: CARD_W,
    borderRadius: 16, overflow: 'hidden', borderWidth: 1,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8,
  },
  foodCardMedia: { position: 'relative' },
  foodImg:         { width: '100%', height: 120 },
  foodImgFallback: {
    width: '100%', height: 120,
    alignItems: 'center', justifyContent: 'center',
  },
  foodImgEmoji: { fontSize: 44 },
  validBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 3,
  },
  validBadgeText: { fontSize: 12 },
  foodLabel: {
    minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  foodLabelText: { color: '#ffffff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cardChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 6, paddingTop: 5 },
  cardChip: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cardChipText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyWrap:         { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji:        { fontSize: 52 },
  emptyTitle:        { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySub:          { fontSize: 13, textAlign: 'center' },
  emptyOutlineBtn:   { borderWidth: 2, borderRadius: BorderRadius.full, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  emptyOutlineBtnText: { fontSize: 14, fontWeight: '700' },
  emptyFilledBtn:    { borderRadius: BorderRadius.full, paddingHorizontal: 28, paddingVertical: 12, marginTop: 4 },
  emptyFilledBtnText:{ color: '#ffffff', fontSize: 15, fontWeight: '800' },

  // Modal
  modalContainer: { flex: 1 },

  // Hero (detail)
  heroWrap: { height: 280, position: 'relative' },
  heroImg:  { width: '100%', height: 280 },
  heroFallback: {
    width: '100%', height: 280,
    alignItems: 'center', justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroName: {
    position: 'absolute', bottom: 56, left: 16, right: 16,
    color: '#ffffff', fontSize: 22, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  heroBack: {
    position: 'absolute', top: 14, left: 14,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBackText: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  heroBadge: {
    position: 'absolute', top: 14, right: 14,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '800' },

  // Detail content
  detailScroll:    { padding: 18, gap: 14, paddingBottom: 20 },
  detailChipsRow:  { marginBottom: 4 },
  detailChip: {
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
  },
  detailChipText: { fontSize: 13, fontWeight: '700' },
  detailDesc:     { fontSize: 14, lineHeight: 22 },
  benefitsCard: {
    borderRadius: 16, borderLeftWidth: 3, borderWidth: 1,
    padding: 14, gap: 8,
  },
  detailSection: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 8,
  },
  macroSection:       { gap: 8 },
  detailSectionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText:         { fontSize: 14, lineHeight: 21 },
  ingredientItem:     { fontSize: 14, lineHeight: 22 },

  macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroPill:  {
    width: '47%', borderRadius: 14, borderWidth: 1,
    padding: 12, alignItems: 'center', gap: 2,
  },
  macroIcon:  { fontSize: 18 },
  macroVal:   { fontSize: 16, fontWeight: '900' },
  macroLabel: { fontSize: 10, fontWeight: '600' },

  // Detail footer
  detailFooter: {
    flexDirection: 'row', gap: 10,
    padding: 14, borderTopWidth: 1,
  },
  footerBtnMain: {
    flex: 2, borderRadius: BorderRadius.full, paddingVertical: 14,
    alignItems: 'center', elevation: 3,
  },
  footerBtnSec: {
    flex: 1, borderRadius: BorderRadius.full, paddingVertical: 14,
    alignItems: 'center',
  },
  footerBtnToggle: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  footerBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  // Form header
  formHeaderWrap: {
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    paddingBottom: 16,
  },
  formHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10,
  },
  formBackBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  formBackText:    { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  formHeaderTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },

  // Form scroll & sections
  formScroll:    { padding: 18, gap: 6, paddingBottom: 20 },
  sectionHeader: {
    fontSize: 11, fontWeight: '800', letterSpacing: 0.8,
    textTransform: 'uppercase', marginTop: 16, marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 16, gap: 6,
  },

  // Form fields
  fieldLabel:   { fontSize: 12, fontWeight: '700', marginBottom: 4, marginTop: 8 },
  fieldLabelSm: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  input: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, borderWidth: 1.5,
  },
  inputSm: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, borderWidth: 1.5,
  },
  inputMulti: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, borderWidth: 1.5, textAlignVertical: 'top', minHeight: 80,
  },
  wordCounter: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  imgPreview:  { width: 80, height: 80, borderRadius: 12, marginTop: 8 },

  rowFields:   { flexDirection: 'row', gap: 12 },
  quickToggle: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    padding: 12, alignItems: 'center', justifyContent: 'center', gap: 6,
  },

  energySelector: { flexDirection: 'row', gap: 8 },
  energyBtn: {
    flex: 1, borderRadius: 10, borderWidth: 2,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  energyBtnText: { fontSize: 18, fontWeight: '900' },
  energyLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 4,
  },
  energyLabelText: { flex: 1, fontSize: 10, fontWeight: '600', textAlign: 'center' },

  macrosForm: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  macroField: { width: '47%' },
  macroHint:  { fontSize: 11, fontStyle: 'italic', marginTop: 4 },

  // Form footer
  formFooter: {
    flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1,
  },
  formCancelBtn: {
    flex: 1, borderRadius: BorderRadius.full, borderWidth: 1.5,
    paddingVertical: 14, alignItems: 'center',
  },
  formCancelText: { fontSize: 15, fontWeight: '700' },
  formSaveBtn: {
    flex: 2, borderRadius: BorderRadius.full,
    paddingVertical: 14, alignItems: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  formSaveText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
