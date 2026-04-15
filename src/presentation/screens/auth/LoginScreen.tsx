import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, ImageBackground, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Spacing, BorderRadius } from '../../../infrastructure/theme';
import { loginUseCase } from '../../../domain/usecases/auth';
import { authRepository } from '../../../data/repositories/authRepository';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
import { AuthStackParams } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParams, 'Login'>;

const BG_IMAGE = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1200&auto=format&fit=crop';

export const LoginScreen = () => {
  const navigation  = useNavigation<Nav>();
  const { setUser } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
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
          style={s.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.logoSection}>
            <Image
              source={require('../../../../assets/logo.png')}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          {!showForm ? (
            <View style={s.actions}>
              <TouchableOpacity style={s.btnIniciar} onPress={() => setShowForm(true)}>
                <Text style={s.btnIniciarText}>Iniciar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.termsLink}>No tienes cuenta? Regístrate</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.form}>
              <Text style={s.formTitle}>Ingresar</Text>
              <Text style={s.label}>Email:</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
                placeholder="ejemplo@email.com"
              />
              <Text style={s.label}>Contraseña:</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#888"
              />
              <TouchableOpacity style={s.btnSubmit} onPress={handleLogin} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#333" />
                  : <Text style={s.btnSubmitText}>Ingresar</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.termsLink}>Registrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowForm(false)} style={s.backBtn}>
                <Text style={s.backBtnText}>← Volver</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const s = StyleSheet.create({
  bg:        { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,107,10,0.88)',
  },
  safe:      { flex: 1 },
  container: { flex: 1, justifyContent: 'flex-end', paddingBottom: 60, paddingHorizontal: Spacing.xl },
  logoSection: {
    position:  'absolute',
    top: 0, left: 0, right: 0,
    alignItems: 'center',
    paddingTop: 80,
  },
  logo:      { width: 200, height: 120 },
  actions:   { alignItems: 'center', gap: Spacing.base },
  btnIniciar: {
    backgroundColor: '#d1d1d1',
    paddingVertical: 15,
    width: '80%',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  btnIniciarText: { fontSize: 18, fontWeight: '600', color: '#333' },
  termsLink: {
    color: 'white',
    textDecorationLine: 'underline',
    fontSize: 15,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  form:      { gap: Spacing.sm },
  formTitle: {
    color: 'white',
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  label:     { color: 'white', fontSize: 18, marginBottom: 4 },
  input: {
    backgroundColor: '#dcdcdc',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  btnSubmit: {
    backgroundColor: '#dcdcdc',
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 50,
    marginTop: Spacing.sm,
    elevation: 5,
  },
  btnSubmitText: { fontSize: 20, fontWeight: '600', color: '#222' },
  backBtn:     { alignItems: 'center', marginTop: Spacing.sm },
  backBtnText: { color: 'white', fontSize: 15, textDecorationLine: 'underline' },
});
