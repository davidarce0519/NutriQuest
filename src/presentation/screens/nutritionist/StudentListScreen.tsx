// HU pendiente: módulo de seguimiento de estudiantes (fuera de alcance v1.0)
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../infrastructure/theme/ThemeContext';
import { getStudentProfilesUseCase } from '../../../domain/usecases/auth';
import { User } from '../../../domain/models';

const GREEN       = '#1a6b0a';
const GREEN_DARK  = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const WHITE       = '#ffffff';
const BG          = '#f5f5f0';

export const StudentListScreen = () => {
  const { isDark } = useTheme();

  const bg            = isDark ? '#0f172a' : BG;
  const cardBg        = isDark ? '#1e293b' : WHITE;
  const border        = isDark ? '#334155' : '#e2e8f0';
  const textPrimary   = isDark ? '#f1f5f9' : '#334155';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted     = isDark ? '#475569' : '#94a3b8';
  const green         = isDark ? '#22c55e' : GREEN;
  const greenDark     = isDark ? '#16a34a' : GREEN_DARK;
  const greenLight    = isDark ? '#4ade80' : GREEN_LIGHT;

  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getStudentProfilesUseCase()
      .then(setStudents)
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los estudiantes.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      st => st.fullName.toLowerCase().includes(q) || st.email.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return '—'; }
  };

  const renderItem = ({ item }: { item: User }) => {
    const initial = item.fullName.charAt(0).toUpperCase();
    return (
      <View style={[s.studentCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={[s.avatar, { backgroundColor: greenDark }]}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={s.studentInfo}>
          <Text style={[s.studentName, { color: textPrimary }]}>{item.fullName}</Text>
          <Text style={[s.studentEmail, { color: textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
          <Text style={[s.studentDate, { color: textMuted }]}>
            Registrado: {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>

      {/* Header verde redondeado */}
      <View style={[s.topStrip, { backgroundColor: green }]}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerInner}>
            <View>
              <Text style={[s.headerSub, { color: greenLight }]}>Panel nutricionista</Text>
              <Text style={s.headerTitle}>Estudiantes 👥</Text>
            </View>
            <View style={[s.countBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={s.countText}>{filtered.length}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Búsqueda */}
      <View style={[s.searchWrap, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[s.searchIcon, { color: textMuted }]}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: textPrimary }]}
          placeholder="Buscar por nombre o email..."
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
              <Text style={s.emptyEmoji}>{searchQuery ? '🔍' : '👥'}</Text>
              <Text style={[s.emptyText, { color: textMuted }]}>
                {searchQuery ? 'Sin resultados para tu búsqueda' : 'No hay estudiantes registrados'}
              </Text>
            </View>
          }
        />
      )}
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
  headerSub:   { fontSize: 12, fontWeight: '600' },
  headerTitle: { color: WHITE, fontSize: 28, fontWeight: '900' },
  countBadge:  { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  countText:   { color: WHITE, fontSize: 14, fontWeight: '900' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    borderRadius: 50, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  clearBtn:    { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },

  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 14, borderWidth: 1,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:   { color: WHITE, fontSize: 18, fontWeight: '900' },
  studentInfo:  { flex: 1 },
  studentName:  { fontSize: 15, fontWeight: '800' },
  studentEmail: { fontSize: 12, marginTop: 2 },
  studentDate:  { fontSize: 11, marginTop: 2 },

  emptyWrap:  { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { fontSize: 15, fontWeight: '600' },
});
