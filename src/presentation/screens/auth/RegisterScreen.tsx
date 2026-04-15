import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { registerUseCase, acceptDataConsentUseCase } from '../../../domain/usecases/auth';
import { authRepository } from '../../../data/repositories/authRepository';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { AuthStackParams } from '../../navigation/AuthNavigator';
import { BorderRadius } from '../../../infrastructure/theme';

type Nav = NativeStackNavigationProp<AuthStackParams, 'Register'>;

const GREEN = '#1a6b0a';
const GREEN_DARK = '#042901';
const GREEN_LIGHT = '#c1d9b7';
const WHITE = '#ffffff';

export const RegisterScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!fullName.trim()) { Alert.alert('Error', 'Ingresa tu nombre completo.'); return; }
    if (!email.trim() || !email.includes('@')) { Alert.alert('Error', 'Ingresa un email válido.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirmPass) { Alert.alert('Error', 'Las contraseñas no coinciden.'); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!consent) {
      Alert.alert('Requerido', 'Debes aceptar el tratamiento de datos para continuar.');
      return;
    }
    try {
      setLoading(true);
      const { user } = await registerUseCase(email, password, fullName);
      if (user) {
        await acceptDataConsentUseCase(user.id);
        const profile = await authRepository.getProfile(user.id);
        setUser(profile);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.topStrip} />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => step === 2 ? setStep(1) : navigation.navigate('Login')}
              >
                <Text style={s.backBtnText}>‹</Text>
              </TouchableOpacity>
              <Image
                source={require('../../../../assets/logo.png')}
                style={s.logo}
                resizeMode="contain"
              />
            </View>

            {/* Título */}
            <Text style={s.title}>Crear cuenta</Text>
            <Text style={s.subtitle}>
              {step === 1
                ? 'Ingresa tus datos para comenzar'
                : 'Revisa y acepta los términos'}
            </Text>

            {/* Steps indicator */}
            <View style={s.stepsRow}>
              <View style={[s.stepDot, s.stepDotActive]} />
              <View style={s.stepLine} />
              <View style={[s.stepDot, step === 2 && s.stepDotActive]} />
            </View>

            {step === 1 ? (
              /* ── PASO 1: Datos ── */
              <View style={s.formCard}>

                <Text style={s.fieldLabel}>Nombre completo</Text>
                <TextInput
                  style={s.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Tu nombre"
                  placeholderTextColor="#aaa"
                  autoCapitalize="words"
                />

                <Text style={s.fieldLabel}>Correo electrónico</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ejemplo@email.com"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={s.fieldLabel}>Contraseña</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                />

                <Text style={s.fieldLabel}>Confirmar contraseña</Text>
                <TextInput
                  style={s.input}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                />

                <TouchableOpacity style={s.mainBtn} onPress={handleNext} activeOpacity={0.88}>
                  <Text style={s.mainBtnText}>Continuar →</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={s.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>

              </View>
            ) : (
              /* ── PASO 2: Consentimiento ── */
              <View style={s.formCard}>

                {/* Resumen HU_2.3.2 */}
                <View style={s.summaryBox}>
                  <Text style={s.summaryTitle}>¿Qué datos recopilamos?</Text>
                  {[
                    { icon: '👤', text: 'Nombre y correo electrónico para identificarte.' },
                    { icon: '📏', text: 'Datos de salud opcionales (peso, talla, IMC) para personalizar sugerencias.' },
                    { icon: '🍎', text: 'Historial de sugerencias aceptadas o descartadas.' },
                    { icon: '🔒', text: 'Tus datos están cifrados y nunca se comparten con terceros.' },
                  ].map((item) => (
                    <View key={item.text} style={s.summaryRow}>
                      <Text style={s.summaryIcon}>{item.icon}</Text>
                      <Text style={s.summaryText}>{item.text}</Text>
                    </View>
                  ))}
                </View>

                {/* Aviso legal HU_5.2.1 */}
                <View style={s.disclaimerBox}>
                  <Text style={s.disclaimerText}>
                    ⚠️ Las sugerencias tienen carácter educativo e informativo. No reemplazan la consulta profesional personalizada.
                  </Text>
                </View>

                {/* Checkbox HU_2.1.2 */}
                <TouchableOpacity
                  style={s.consentRow}
                  onPress={() => setConsent(!consent)}
                  activeOpacity={0.8}
                >
                  <View style={[s.checkbox, consent && s.checkboxActive]}>
                    {consent && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <Text style={s.consentText}>
                    Acepto el tratamiento de mis datos personales con fines educativos y puedo eliminarlos cuando quiera.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.mainBtn, !consent && s.mainBtnDisabled]}
                  onPress={handleRegister}
                  disabled={!consent || loading}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color={WHITE} />
                    : <Text style={s.mainBtnText}>Crear cuenta ✓</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={s.linkText}>← Volver a datos</Text>
                </TouchableOpacity>

              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  topStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
    backgroundColor: GREEN,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 44, color: WHITE, lineHeight: 48, fontWeight: '300' },
  logo: { width: 90, height: 54 },

  // Título
  title: { fontSize: 30, fontWeight: '900', color: WHITE },
  subtitle: { fontSize: 14, color: GREEN_LIGHT },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: { backgroundColor: WHITE },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    maxWidth: 40,
  },

  // Card formulario
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 22,
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: -4 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: GREEN_DARK,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  mainBtn: {
    backgroundColor: GREEN_DARK,
    borderRadius: BorderRadius.full,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    elevation: 3,
  },
  mainBtnDisabled: { backgroundColor: '#cbd5e1' },
  mainBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  linkText: { fontSize: 13, color: '#64748b', textAlign: 'center', textDecorationLine: 'underline' },

  // Paso 2
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: GREEN_DARK, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  summaryIcon: { fontSize: 16, marginTop: 1 },
  summaryText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
  disclaimerBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  disclaimerText: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: GREEN, borderColor: GREEN },
  checkmark: { color: WHITE, fontSize: 14, fontWeight: '900' },
  consentText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },
});