import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { BmiCategory, NutritionalGoal, PhysicalActivityLevel } from '../../domain/models';

export interface StudentAvatarProps {
  bmiCategory?: BmiCategory;
  currentLevel?: number;
  streakDays?: number;
  nutritionalGoal?: NutritionalGoal;
  activityLevel?: PhysicalActivityLevel;
  size?: number;
  animated?: boolean;
}

const avatarImageFor = (cat?: BmiCategory) => {
  switch (cat) {
    case 'Bajo peso':  return require('../../../assets/peso_bajo.png');
    case 'Sobrepeso':  return require('../../../assets/peso_sobrepeso.png');
    case 'Obesidad':   return require('../../../assets/peso_obeso.png');
    default:           return require('../../../assets/peso_normal.png');
  }
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  bmiCategory,
  currentLevel: _currentLevel = 1,
  streakDays = 0,
  nutritionalGoal: _nutritionalGoal,
  activityLevel: _activityLevel,
  size = 200,
  animated = true,
}) => {
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const auraAnim   = useRef(new Animated.Value(1)).current;

  const hasAura     = streakDays >= 3;
  const strongPulse = streakDays >= 7;
  const goldenAura  = streakDays >= 14;

  const auraColor   = goldenAura ? '#fbbf24' : '#22c55e';
  const auraOpacity = goldenAura ? 0.35 : strongPulse ? 0.3 : 0.2;

  // Flotación + respiración (siempre activas si animated)
  useEffect(() => {
    if (!animated) return;

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1.0,  duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );

    float.start();
    breath.start();

    return () => {
      float.stop();
      breath.stop();
    };
  }, [animated, floatAnim, breathAnim]);

  // Pulso del aura (solo si streakDays >= 7)
  useEffect(() => {
    if (!animated || !strongPulse) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(auraAnim, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(auraAnim, { toValue: 1.0,  duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [animated, strongPulse, auraAnim]);

  return (
    <View style={{ width: size, height: size * 1.4, alignItems: 'center', justifyContent: 'center' }}>
      {hasAura && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: size * 0.45,
            backgroundColor: auraColor,
            opacity: auraOpacity,
            transform: [{ scale: auraAnim }],
          }}
        />
      )}

      <Animated.View
        style={{
          transform: [
            { translateY: floatAnim },
            { scale: breathAnim },
          ],
        }}
      >
        <Image
          source={avatarImageFor(bmiCategory)}
          style={{ width: size, height: size * 1.3 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};
