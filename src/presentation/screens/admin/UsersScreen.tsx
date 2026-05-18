import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme }     from '../../../infrastructure/theme/ThemeContext';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import {
  getAllUsersUseCase,
  changeUserRoleUseCase,
  toggleUserActiveUseCase,
} from '../../../domain/usecases/auth';
import { User, UserRole } from '../../../domain/models';

// Políticas RLS requeridas en Supabase (ejecutar una vez):
// CREATE POLICY "nutricionistas ven estudiantes" ON public.profiles FOR SELECT
//   USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('nutricionista','superadmin')) OR auth.uid() = id);
// CREATE POLICY "superadmin actualiza roles" ON public.profiles FOR UPDATE
//   USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'superadmin'));

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  estudiante:    { bg: '#f0fdf4', text: '#16a34a' },
  nutricionista: { bg: '#e0f2fe', text: '#0284c7' },
  superadmin:    { bg: '#ede9fe', text: '#7c3aed' },
};

const ROLE_LABELS: Record<UserRole, string> = {
  estudiante:    '🎓 Estudiante',
  nutricionista: '🥼 Nutricionista',
  superadmin:    '👑 Superadmin',
};

type FilterValue = 'todos' | UserRole;

const FILTER_KEYS: Array<{ label: string; value: FilterValue }> = [
  { label: 'Todos',          value: 'todos' },
  { label: 'Estudiantes',    value: 'estudiante' },
  { label: 'Nutricionistas', value: 'nutricionista' },
  { label: 'Admins',         value: 'superadmin' },
];

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

export const UsersScreen = () => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuthStore();

  const bg            = isDark ? '#0f172a' : '#f5f5f0';
  const cardBg        = isDark ? '#1e293b' : '#ffffff';
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : '#1a6b0a';
  const sheetBg       = isDark ? '#1e293b' : '#ffffff';
  const actionBg      = isDark ? '#0f172a' : '#f8fafc';
  const inputBg       = isDark ? '#334155' : '#f8fafc';

  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('todos');
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [saving, setSaving]             = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsersUseCase();
      setUsers(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (activeFilter !== 'todos') list = list.filter(u => u.role === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, activeFilter, searchQuery]);

  const filterCounts = useMemo<Record<FilterValue, number>>(() => ({
    todos:         users.length,
    estudiante:    users.filter(u => u.role === 'estudiante').length,
    nutricionista: users.filter(u => u.role === 'nutricionista').length,
    superadmin:    users.filter(u => u.role === 'superadmin').length,
  }), [users]);

  const headerStats = useMemo(() => ({
    total:    users.length,
    activos:  users.filter(u => u.isActive).length,
    inactivos: users.filter(u => !u.isActive).length,
  }), [users]);

  const isSelf = (u: User) => u.id === currentUser?.id;

  const handleChangeRole = async (userId: string, role: UserRole) => {
    try {
      setSaving(true);
      await changeUserRoleUseCase(userId, role);
      await loadUsers();
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (u: User) => {
    const action = u.isActive ? 'desactivar' : 'activar';
    Alert.alert('Confirmar', `¿Deseas ${action} la cuenta de ${u.fullName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: u.isActive ? 'Desactivar' : 'Activar',
        style: u.isActive ? 'destructive' : 'default',
        onPress: async () => {
          try {
            setSaving(true);
            await toggleUserActiveUseCase(u.id, !u.isActive);
            await loadUsers();
            setShowModal(false);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: User }) => {
    const initial    = item.fullName.charAt(0).toUpperCase();
    const roleColors = ROLE_COLORS[item.role];
    return (
      <TouchableOpacity
        style={[s.userCard, { backgroundColor: cardBg, borderColor: border }]}
        onPress={() => { setSelectedUser(item); setShowModal(true); }}
        activeOpacity={0.8}
      >
        {/* Avatar con indicador de estado */}
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { backgroundColor: roleColors.text + '22' }]}>
            <Text style={[s.avatarText, { color: roleColors.text }]}>{initial}</Text>
          </View>
          <View style={[
            s.statusDot,
            { backgroundColor: item.isActive ? '#22c55e' : '#ef4444' },
          ]} />
        </View>

        {/* Info */}
        <View style={s.userInfo}>
          <View style={s.userNameRow}>
            <Text style={[s.userName, { color: textPrimary }]} numberOfLines={1}>
              {item.fullName}
            </Text>
            {!item.isActive && (
              <Text style={s.inactiveLabel}>Inactivo</Text>
            )}
          </View>
          <Text style={[s.userEmail, { color: textSecondary }]} numberOfLines={1}>{item.email}</Text>
          <View style={s.userMeta}>
            <View style={[s.roleChip, { backgroundColor: isDark ? roleColors.text + '22' : roleColors.bg }]}>
              <Text style={[s.roleChipText, { color: roleColors.text }]}>{ROLE_LABELS[item.role]}</Text>
            </View>
            <Text style={[s.userDate, { color: textMuted }]}>Desde {formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Chevron */}
        <Text style={[s.chevron, { color: textMuted }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>

      {/* Header verde redondeado */}
      <View style={[s.topStrip, { backgroundColor: green }]}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerInner}>
            <View>
              <Text style={s.headerSub}>Superadmin</Text>
              <Text style={s.headerTitle}>Usuarios 👥</Text>
            </View>
            <View style={[s.countBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={s.countText}>{filtered.length}</Text>
            </View>
          </View>

          {/* Mini estadísticas */}
          <View style={s.headerStats}>
            {[
              { label: 'Total',     value: headerStats.total,     color: '#ffffff' },
              { label: 'Activos',   value: headerStats.activos,   color: '#bbf7d0' },
              { label: 'Inactivos', value: headerStats.inactivos, color: '#fca5a5' },
            ].map(stat => (
              <View key={stat.label} style={[s.headerStatItem, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[s.headerStatValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.headerStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>

      {/* Búsqueda */}
      <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Text style={[s.searchIcon, { color: textMuted }]}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: textPrimary }]}
          placeholder="Buscar usuario..."
          placeholderTextColor={textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[s.clearBtn, { color: textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros con conteo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FILTER_KEYS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              s.filterChip,
              { borderColor: border, backgroundColor: activeFilter === f.value ? green : cardBg },
            ]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text style={[s.filterChipText, { color: activeFilter === f.value ? '#fff' : textSecondary }]}>
              {f.label} ({filterCounts[f.value]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator color={green} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>👥</Text>
              <Text style={[s.emptyText, { color: textMuted }]}>Sin usuarios en este filtro</Text>
            </View>
          }
        />
      )}

      {/* Modal de acciones */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[s.modalSheet, { backgroundColor: sheetBg }]}>
            {selectedUser && (
              <>
                <View style={[s.sheetHandle, { backgroundColor: isDark ? '#475569' : '#cbd5e1' }]} />

                {/* Avatar + nombre + rol actual */}
                <View style={s.sheetHeader}>
                  <View style={[
                    s.sheetAvatar,
                    { backgroundColor: ROLE_COLORS[selectedUser.role].text + '22' },
                  ]}>
                    <Text style={[s.sheetAvatarText, { color: ROLE_COLORS[selectedUser.role].text }]}>
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.sheetHeaderInfo}>
                    <Text style={[s.sheetTitle, { color: textPrimary }]} numberOfLines={1}>
                      {selectedUser.fullName}
                    </Text>
                    <Text style={[s.sheetEmail, { color: textSecondary }]} numberOfLines={1}>
                      {selectedUser.email}
                    </Text>
                    <View style={[
                      s.sheetRoleChip,
                      { backgroundColor: isDark
                          ? ROLE_COLORS[selectedUser.role].text + '22'
                          : ROLE_COLORS[selectedUser.role].bg,
                      },
                    ]}>
                      <Text style={[s.sheetRoleText, { color: ROLE_COLORS[selectedUser.role].text }]}>
                        {ROLE_LABELS[selectedUser.role]}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Self-account warning */}
                {isSelf(selectedUser) && (
                  <View style={s.selfCard}>
                    <Text style={s.selfCardText}>
                      👤 Esta es tu cuenta — no puedes modificarla
                    </Text>
                  </View>
                )}

                <View style={[s.sheetDivider, { backgroundColor: border }]} />

                {saving ? (
                  <ActivityIndicator color={green} style={{ marginVertical: 24 }} />
                ) : (
                  <>
                    {/* Cambiar rol */}
                    <Text style={[s.sheetGroupLabel, { color: textMuted }]}>Cambiar rol</Text>
                    {(['estudiante', 'nutricionista', 'superadmin'] as UserRole[]).map(role => {
                      const isCurrentRole = selectedUser.role === role;
                      const disabled      = isSelf(selectedUser) || isCurrentRole;
                      return (
                        <TouchableOpacity
                          key={role}
                          style={[
                            s.sheetAction,
                            { backgroundColor: actionBg },
                            isCurrentRole && { borderWidth: 1.5, borderColor: ROLE_COLORS[role].text + '44' },
                            disabled && !isCurrentRole && { opacity: 0.4 },
                          ]}
                          onPress={() => {
                            if (disabled) return;
                            Alert.alert('Cambiar rol', `¿Cambiar a ${ROLE_LABELS[role]}?`, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Cambiar', onPress: () => handleChangeRole(selectedUser.id, role) },
                            ]);
                          }}
                          disabled={disabled}
                        >
                          <Text style={[s.sheetActionText, { color: ROLE_COLORS[role].text }]}>
                            {ROLE_LABELS[role]}
                          </Text>
                          {isCurrentRole && (
                            <Text style={[s.sheetActionMeta, { color: ROLE_COLORS[role].text }]}>
                              ✓ Rol actual
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    <View style={[s.sheetDivider, { backgroundColor: border, marginVertical: 4 }]} />

                    {/* Estado de cuenta */}
                    <Text style={[s.sheetGroupLabel, { color: textMuted }]}>Estado de cuenta</Text>
                    <TouchableOpacity
                      style={[
                        s.sheetAction,
                        { backgroundColor: isDark ? '#1a0000' : '#fef2f2' },
                        isSelf(selectedUser) && { opacity: 0.35 },
                      ]}
                      onPress={() => !isSelf(selectedUser) && handleToggleActive(selectedUser)}
                      disabled={isSelf(selectedUser)}
                    >
                      <Text style={[s.sheetActionText, { color: selectedUser.isActive ? '#ef4444' : '#22c55e' }]}>
                        {selectedUser.isActive ? '🚫 Desactivar cuenta' : '✅ Activar cuenta'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[s.cancelBtn, { borderColor: border }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={[s.cancelText, { color: textSecondary }]}>Cancelar</Text>
                </TouchableOpacity>
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
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    paddingHorizontal: 20, paddingBottom: 18,
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  headerInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 10,
  },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  countBadge:  { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  countText:   { color: '#ffffff', fontSize: 14, fontWeight: '900' },

  headerStats: { flexDirection: 'row', gap: 8, marginTop: 12 },
  headerStatItem: {
    flex: 1, borderRadius: 12,
    paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  headerStatValue: { fontSize: 20, fontWeight: '900' },
  headerStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 0,
    borderRadius: 50, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  clearBtn:    { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },

  filterRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: {
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },

  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900' },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#ffffff',
  },

  userInfo:    { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName:    { fontSize: 15, fontWeight: '800', flex: 1 },
  inactiveLabel: {
    fontSize: 10, fontWeight: '800', color: '#ef4444',
    backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  userEmail: { fontSize: 12, marginTop: 2 },
  userMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  roleChip:     { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  roleChipText: { fontSize: 10, fontWeight: '700' },
  userDate:     { fontSize: 10, fontWeight: '500' },

  chevron: { fontSize: 22, fontWeight: '300', marginLeft: 4 },

  emptyWrap:  { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: 15, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 40, gap: 10,
    elevation: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 10,
  },

  sheetHeader:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  sheetAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sheetAvatarText: { fontSize: 22, fontWeight: '900' },
  sheetHeaderInfo: { flex: 1 },
  sheetTitle:      { fontSize: 17, fontWeight: '900' },
  sheetEmail:      { fontSize: 12, marginTop: 2 },
  sheetRoleChip:   { marginTop: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  sheetRoleText:   { fontSize: 11, fontWeight: '700' },

  selfCard: {
    borderRadius: 12, padding: 12,
    backgroundColor: '#fefce8', borderLeftWidth: 3, borderLeftColor: '#fbbf24',
  },
  selfCardText: { fontSize: 13, fontWeight: '700', color: '#92400e' },

  sheetDivider:    { height: 1, marginVertical: 4 },
  sheetGroupLabel: {
    fontSize: 10, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 4, marginBottom: 2,
  },
  sheetAction: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sheetActionText: { fontSize: 15, fontWeight: '700' },
  sheetActionMeta: { fontSize: 12, fontWeight: '700' },

  cancelBtn: {
    borderRadius: 50, borderWidth: 1.5, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  cancelText: { fontSize: 15, fontWeight: '700' },
});
