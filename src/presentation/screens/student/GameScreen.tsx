import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Spacing, BorderRadius } from '../../../infrastructure/theme';

const GREEN       = '#1a6b0a';
const GREEN_DARK  = '#042901';
const CARD_LIGHT  = '#dce7da';

const NIVELES = [
  { id: 1, label: 'Nivel 1', activo: true },
  { id: 2, label: 'Nivel 2', activo: false },
  { id: 3, label: 'Nivel 3', activo: false },
];

export const GameScreen = () => {
  const navigation = useNavigation();

  const handleNivel = (nivel: typeof NIVELES[0]) => {
    if (!nivel.activo) {
      Alert.alert('Bloqueado', 'Completa el nivel anterior para desbloquear este.');
      return;
    }
    Alert.alert('¡Nivel 1!', 'Aquí irá el minijuego de nutrición.');
  };

  return (
    <View style={s.page}>
      <SafeAreaView style={s.safe}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>&#10094;</Text>
          </TouchableOpacity>
          <Image
            source={require('../../../../assets/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        {/* Tarjeta de contenido */}
        <View style={s.card}>
          <Text style={s.introText}>
            En este emocionante juego, tú eres un héroe que debe combatir a monstruos malvados
            utilizando tus conocimientos sobre nutrición.
          </Text>

          <View style={s.levelsList}>
            {NIVELES.map((nivel) => (
              nivel.activo ? (
                <TouchableOpacity
                  key={nivel.id}
                  style={[s.levelBtn, s.levelActive]}
                  activeOpacity={0.85}
                  onPress={() => handleNivel(nivel)}
                >
                  <Text style={s.levelBtnText}>{nivel.label}</Text>
                </TouchableOpacity>
              ) : (
                <View key={nivel.id} style={[s.levelBtn, s.levelLocked]}>
                  <Text style={s.levelBtnText}>{nivel.label}</Text>
                  <Text style={s.lockIcon}>🔒</Text>
                </View>
              )
            ))}
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: GREEN },
  safe:    { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
    marginBottom:   20,
    paddingVertical: 10,
  },
  backBtn: {
    position: 'absolute',
    left:     10,
    padding:  10,
  },
  backBtnText: { color: 'white', fontSize: 40 },
  logo:        { width: 130, height: 75 },
  card: {
    backgroundColor: CARD_LIGHT,
    marginHorizontal: 15,
    borderRadius:    45,
    padding:         35,
    alignItems:      'center',
    gap:             30,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 10 },
    shadowOpacity:   0.2,
    shadowRadius:    25,
    elevation:       10,
  },
  introText: {
    fontSize:   17,
    color:      GREEN_DARK,
    textAlign:  'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  levelsList: {
    width:  '100%',
    gap:    15,
    alignItems: 'center',
  },
  levelBtn: {
    width:          '100%',
    maxWidth:       340,
    height:         85,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.2,
    shadowRadius:   15,
    elevation:      6,
  },
  levelActive: { backgroundColor: GREEN_DARK },
  levelLocked: { backgroundColor: GREEN_DARK, opacity: 0.6 },
  levelBtnText: {
    fontSize:   32,
    fontWeight: '900',
    color:      'white',
  },
  lockIcon: {
    position: 'absolute',
    right:    25,
    fontSize: 28,
  },
});
