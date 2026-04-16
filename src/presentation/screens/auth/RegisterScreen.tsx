import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
  ImageBackground, ScrollView,
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

const BG_IMAGE = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1200&auto=format&fit=crop';
const GREEN_DARK = '#042901';
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
    if (!consent) { Alert.alert('Requerido', 'Debes aceptar el tratamiento de datos.'); return; }
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

  const handleBack = () => step === 2 ? setStep(1) : navigation.navigate('Login');

  // Encabezado reutilizable en ambos pasos
  const CardHeader = () => (
    <>
      <View style={s.cardTop}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Image
          source={require('../../../../assets/logo1.0.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <View style={s.backBtn} />
      </View>

      <View style={s.stepsRow}>
        <View style={s.stepItem}>
          <View style={[s.stepCircle, s.stepActive]}>
            <Text style={[s.stepNum, s.stepNumActive]}>1</Text>
          </View>
          <Text style={[s.stepLabel, s.stepLabelActive]}>Datos</Text>
        </View>
        <View style={[s.stepConnector, step === 2 && s.stepConnectorActive]} />
        <View style={s.stepItem}>
          <View style={[s.stepCircle, step === 2 && s.stepActive]}>
            <Text style={[s.stepNum, step === 2 && s.stepNumActive]}>2</Text>
          </View>
          <Text style={[s.stepLabel, step === 2 && s.stepLabelActive]}>Términos</Text>
        </View>
      </View>

      <View style={s.titleRow}>
        <Text style={s.title}>{step === 1 ? 'Crear cuenta' : 'Casi listo'}</Text>
        <Text style={s.subtitle}>
          {step === 1 ? 'Ingresa tus datos para comenzar' : 'Revisa y acepta los términos'}
        </Text>
      </View>
    </>
  );

  return (
    <ImageBackground source={{ uri: BG_IMAGE }} style={s.bg} resizeMode="cover">
      <View style={s.overlay} />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >

          {step === 1 ? (
            /* ── PASO 1: centrado sin scroll ── */
            <View style={s.centered}>
              <View style={s.card}>
                <CardHeader />
                <View style={s.fields}>
                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>Nombre completo</Text>
                    <TextInput
                      style={s.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Tu nombre"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>Correo electrónico</Text>
                    <TextInput
                      style={s.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="ejemplo@uao.edu.co"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>Contraseña</Text>
                    <TextInput
                      style={s.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      secureTextEntry
                    />
                  </View>
                  <View style={s.fieldGroup}>
                    <Text style={s.fieldLabel}>Confirmar contraseña</Text>
                    <TextInput
                      style={s.input}
                      value={confirmPass}
                      onChangeText={setConfirmPass}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      secureTextEntry
                    />
                  </View>
                  <TouchableOpacity style={s.btnPrimary} onPress={handleNext} activeOpacity={0.88}>
                    <Text style={s.btnPrimaryText}>Continuar →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={s.linkText}>
                      ¿Ya tienes cuenta?{' '}
                      <Text style={s.linkBold}>Inicia sesión</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          ) : (
            /* ── PASO 2: con scroll porque tiene más contenido ── */
            <ScrollView
              contentContainerStyle={s.scrollCentered}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={s.card}>
                <CardHeader />
                <View style={s.fields}>

                  {/* Intro HU_2.3.2 */}
                  <View style={s.consentHeader}>
                    <Text style={s.consentHeaderTitle}>Antes de continuar</Text>
                    <Text style={s.consentHeaderSub}>
                      Lee cómo usamos tu información. Tienes control total sobre tus datos en todo momento.
                    </Text>
                  </View>

                  {/* Qué datos recopilamos */}
                  <View style={s.summaryBox}>
                    <Text style={s.summaryTitle}>¿Qué datos recopilamos?</Text>
                    {[
                      { icon: '👤', title: 'Identidad', text: 'Nombre y correo para identificarte en la plataforma.' },
                      { icon: '📏', title: 'Salud', text: 'Peso, talla e IMC para personalizar las sugerencias.' },
                      { icon: '🍎', title: 'Actividad', text: 'Historial de sugerencias aceptadas o descartadas.' },
                      { icon: '🔒', title: 'Protección', text: 'Tus datos están cifrados y nunca se comparten con terceros.' },
                    ].map(item => (
                      <View key={item.title} style={s.summaryRow}>
                        <View style={s.summaryIconWrap}>
                          <Text style={s.summaryIcon}>{item.icon}</Text>
                        </View>
                        <View style={s.summaryTextWrap}>
                          <Text style={s.summaryItemTitle}>{item.title}</Text>
                          <Text style={s.summaryText}>{item.text}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Para qué se usan */}
                  <View style={s.infoBox}>
                    <Text style={s.infoTitle}>¿Para qué se usan?</Text>
                    <Text style={s.infoText}>
                      Exclusivamente para generar sugerencias alimentarias personalizadas
                      y mostrarte tu progreso. No se usan para publicidad ni se comparten
                      con terceros bajo ninguna circunstancia.
                    </Text>
                  </View>

                  {/* Cómo son protegidos */}
                  <View style={s.infoBox}>
                    <Text style={s.infoTitle}>¿Cómo son protegidos?</Text>
                    <Text style={s.infoText}>
                      Tus datos se almacenan cifrados en servidores seguros. Puedes
                      eliminarlos en cualquier momento desde tu perfil en máximo 3 pasos.
                    </Text>
                  </View>

                  {/* Aviso legal HU_5.2.1 */}
                  <View style={s.disclaimerBox}>
                    <Text style={s.disclaimerText}>
                      ⚠️ Las sugerencias tienen carácter educativo e informativo.
                      No reemplazan la consulta con un profesional de salud.
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
                      He leído y acepto el tratamiento de mis datos personales con
                      fines educativos. Entiendo que puedo eliminarlos cuando quiera.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.btnPrimary, !consent && s.btnDisabled]}
                    onPress={handleRegister}
                    disabled={!consent || loading}
                    activeOpacity={0.88}
                  >
                    {loading
                      ? <ActivityIndicator color={GREEN_DARK} />
                      : <Text style={s.btnPrimaryText}>Crear cuenta</Text>
                    }
                  </TouchableOpacity>

                </View>
              </View>
            </ScrollView>
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,107,10,0.88)',
  },
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Paso 1 — centrado
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // Paso 2 — scroll
  scrollCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // Card glass
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Top row
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 34, color: 'rgba(255,255,255,0.7)', lineHeight: 38 },
  logo: { width: 100, height: 56 },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stepActive: { backgroundColor: WHITE, borderColor: WHITE },
  stepNum: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
  stepNumActive: { color: GREEN_DARK },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  stepLabelActive: { color: WHITE },
  stepConnector: {
    flex: 1,
    maxWidth: 50,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
  },
  stepConnectorActive: { backgroundColor: WHITE },

  // Título
  titleRow: { gap: 4 },
  title: { fontSize: 26, fontWeight: '900', color: WHITE },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  // Fields
  fields: { gap: 12 },
  fieldGroup: { gap: 5 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: WHITE,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  // Botones
  btnPrimary: {
    backgroundColor: WHITE,
    borderRadius: BorderRadius.full,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnDisabled: { backgroundColor: 'rgba(255,255,255,0.25)' },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  linkText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  linkBold: { color: WHITE, fontWeight: '800', textDecorationLine: 'underline' },

  // ── Paso 2 ──
  consentHeader: { gap: 4 },
  consentHeaderTitle: { fontSize: 18, fontWeight: '900', color: WHITE },
  consentHeaderSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },

  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryIcon: { fontSize: 16 },
  summaryTextWrap: { flex: 1, gap: 2 },
  summaryItemTitle: { fontSize: 13, fontWeight: '800', color: WHITE },
  summaryText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },

  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: WHITE },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },

  disclaimerBox: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  disclaimerText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },

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
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: WHITE, borderColor: WHITE },
  checkmark: { color: GREEN_DARK, fontSize: 14, fontWeight: '900' },
  consentText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
});