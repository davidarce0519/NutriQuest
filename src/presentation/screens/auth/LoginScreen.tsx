import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, ImageBackground, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BorderRadius } from '../../../infrastructure/theme';
import { loginUseCase } from '../../../domain/usecases/auth';
import { authRepository } from '../../../data/repositories/authRepository';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { AuthStackParams } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParams, 'Login'>;

const BG_IMAGE = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1200&auto=format&fit=crop';
const GREEN_DARK = '#042901';
const WHITE = '#ffffff';

export const LoginScreen = () => {
  const navigation = useNavigation<Nav>();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { user } = await loginUseCase(email, password);
      if (user) {
        const profile = await authRepository.getProfile(user.id);
        setUser(profile);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: BG_IMAGE }} style={s.bg} resizeMode="cover">
      <View style={s.overlay} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Todo el contenido centrado verticalmente */}
          <View style={s.centered}>

            {!showForm ? (
              /* ── LANDING ── */
              <View style={s.card}>
                {/* Logo dentro de la card */}
                <View style={s.logoWrap}>
                  <Image
                    source={require('../../../../assets/logo1.0.png')}
                    style={s.logo}
                    resizeMode="contain"
                  />
                </View>

                <View style={s.divider} />

                <Text style={s.landingTitle}>Bienvenido</Text>
                <Text style={s.landingSub}>
                  Toma mejores decisiones alimentarias durante tus semanas más exigentes.
                </Text>

                <TouchableOpacity
                  style={s.btnPrimary}
                  onPress={() => setShowForm(true)}
                  activeOpacity={0.88}
                >
                  <Text style={s.btnPrimaryText}>Iniciar sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.btnSecondary}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.88}
                >
                  <Text style={s.btnSecondaryText}>Crear cuenta nueva</Text>
                </TouchableOpacity>
              </View>

            ) : (
              /* ── FORMULARIO ── */
              <View style={s.card}>
                {/* Logo pequeño arriba */}
                <View style={s.logoWrapSm}>
                  <Image
                    source={require('../../../../assets/logo1.0.png')}
                    style={s.logoSm}
                    resizeMode="contain"
                  />
                </View>

                <TouchableOpacity style={s.backRow} onPress={() => setShowForm(false)}>
                  <Text style={s.backArrow}>‹</Text>
                  <Text style={s.backText}>Volver</Text>
                </TouchableOpacity>

                <Text style={s.formTitle}>Ingresar</Text>
                <Text style={s.formSub}>Accede a tu cuenta NutriQuest</Text>

                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Correo electrónico</Text>
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="ejemplo@uao.edu.co"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Contraseña</Text>
                  <TextInput
                    style={s.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="Tu contraseña"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                <TouchableOpacity
                  style={s.btnPrimary}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading
                    ? <ActivityIndicator color={GREEN_DARK} />
                    : <Text style={s.btnPrimaryText}>Ingresar</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  style={s.registerLink}
                >
                  <Text style={s.registerLinkText}>
                    ¿No tienes cuenta?{' '}
                    <Text style={s.registerLinkBold}>Regístrate aquí</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
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

  // Centrado vertical real
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // Card glass
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Logo grande (landing)
  logoWrap: { alignItems: 'center', paddingVertical: 8 },
  logo: { width: 180, height: 100 },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 2,
  },

  // Logo pequeño (form)
  logoWrapSm: { alignItems: 'center', marginBottom: -4 },
  logoSm: { width: 100, height: 56 },

  // Landing
  landingTitle: { fontSize: 26, fontWeight: '900', color: WHITE },
  landingSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 21,
  },
  legalText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // Form
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: -4 },
  backArrow: { fontSize: 30, color: 'rgba(255,255,255,0.6)', lineHeight: 34 },
  backText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  formTitle: { fontSize: 28, fontWeight: '900', color: WHITE },
  formSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: -6 },

  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  btnSecondary: {
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnSecondaryText: { fontSize: 16, fontWeight: '700', color: WHITE },

  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  registerLinkBold: { color: WHITE, fontWeight: '800', textDecorationLine: 'underline' },
});