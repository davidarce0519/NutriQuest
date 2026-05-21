import React, { useEffect, useRef } from 'react';
import {
  Animated, Dimensions, Modal, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../../infrastructure/theme/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PADDING = 8;
const CARD_H = 240;
const CARD_MARGIN = 20;

export interface TargetMeasure {
  x?: number; y?: number;
  width: number; height: number;
  pageX: number; pageY: number;
}

export interface TooltipProps {
  visible: boolean;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  position?: 'top' | 'bottom';
  targetMeasure?: TargetMeasure;
  icon?: string;
}

export const OnboardingTooltip: React.FC<TooltipProps> = ({
  visible, title, description, step, totalSteps,
  onNext, onSkip, targetMeasure, icon,
}) => {
  const { isDark } = useTheme();
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecond = isDark ? '#94a3b8' : '#64748b';
  const green = isDark ? '#22c55e' : '#1a6b0a';

  const spotlightTop = targetMeasure ? targetMeasure.pageY - PADDING : SCREEN_H / 2 - 44;
  const spotlightH = targetMeasure ? targetMeasure.height + PADDING * 2 : 80;
  const spotlightW = targetMeasure ? targetMeasure.width + PADDING * 2 : SCREEN_W - 64;
  const spotlightX = targetMeasure ? Math.max(0, targetMeasure.pageX - PADDING) : 32;
  const spotlightBot = spotlightTop + spotlightH;

  const spaceBelow = SCREEN_H - spotlightBot;
  const spaceAbove = spotlightTop;

  let cardStyle: object;
  let arrowIsUp = false;
  let arrowIsDown = false;

  if (spaceBelow >= CARD_H + CARD_MARGIN) {
    cardStyle = { top: spotlightBot + 16 };
    arrowIsUp = true;
  } else if (spaceAbove >= CARD_H + CARD_MARGIN) {
    cardStyle = { bottom: SCREEN_H - spotlightTop + 16 };
    arrowIsDown = true;
  } else {
    cardStyle = { top: SCREEN_H / 2 - CARD_H / 2 };
  }

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const spotlightPulse = useRef(new Animated.Value(1)).current;
  const iconBounce = useRef(new Animated.Value(0.8)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!visible) {
      pulseRef.current?.stop();
      overlayOpacity.setValue(0);
      cardOpacity.setValue(0);
      return;
    }
    Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    cardSlide.setValue(30);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(cardSlide, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
    spotlightPulse.setValue(1);
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(spotlightPulse, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(spotlightPulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();
    if (icon) {
      iconBounce.setValue(0.8);
      Animated.spring(iconBounce, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }).start();
    }
    return () => pulseRef.current?.stop();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(cardOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      if (icon) {
        iconBounce.setValue(0.8);
        Animated.spring(iconBounce, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }).start();
      }
      Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [step]);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <View style={s.root}>
        <Animated.View style={[s.overlayTop, { height: Math.max(0, spotlightTop), opacity: overlayOpacity }]} />
        <View style={[s.spotlightRow, { top: spotlightTop, height: spotlightH }]}>
          <Animated.View style={[s.overlaySide, { width: spotlightX, opacity: overlayOpacity }]} />
          <Animated.View style={[
            s.spotlight,
            { width: spotlightW, height: spotlightH, borderColor: green },
            { transform: [{ scale: spotlightPulse }] },
          ]}>
            {icon ? (
              <Animated.Text style={[s.spotlightIcon, { transform: [{ scale: iconBounce }] }]}>
                {icon}
              </Animated.Text>
            ) : null}
          </Animated.View>
          <Animated.View style={[s.overlaySide, { flex: 1, opacity: overlayOpacity }]} />
        </View>
        <Animated.View style={[s.overlayBottom, { top: spotlightBot, opacity: overlayOpacity }]} />
        <Animated.View style={[
          s.card, { backgroundColor: cardBg },
          cardStyle,
          { transform: [{ translateY: cardSlide }], opacity: cardOpacity },
        ]}>
          {arrowIsUp && <View style={[s.arrowUp, { borderBottomColor: cardBg }]} />}
          {arrowIsDown && <View style={[s.arrowDown, { borderTopColor: cardBg }]} />}
          <View style={[s.stepChip, { backgroundColor: green + '18' }]}>
            <Text style={[s.stepText, { color: green }]}>{step} de {totalSteps}</Text>
          </View>
          <Text style={[s.cardTitle, { color: textPrimary }]}>{title}</Text>
          <Text style={[s.cardDesc, { color: textSecond }]}>{description}</Text>
          <View style={s.dotsRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[s.dot, {
                backgroundColor: i < step ? green : green + '30',
                width: i + 1 === step ? 20 : 8,
              }]} />
            ))}
          </View>
          <View style={s.actions}>
            <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.skipText, { color: textSecond }]}>Saltar tour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.nextBtn, { backgroundColor: green }]} onPress={onNext} activeOpacity={0.85}>
              <Text style={s.nextBtnText}>{step === totalSteps ? '¡Entendido! ✓' : 'Siguiente →'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  overlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  overlayBottom: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  spotlightRow: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row',
  },
  overlaySide: { backgroundColor: 'rgba(0,0,0,0.75)' },
  spotlight: {
    borderRadius: 16, borderWidth: 2,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  spotlightIcon: { fontSize: 28 },
  card: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 20, padding: 18, gap: 10,
    borderTopWidth: 3, borderTopColor: '#1a6b0a',
    elevation: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12,
    maxHeight: 260,
  },
  arrowUp: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    position: 'absolute', top: -12, alignSelf: 'center',
  },
  arrowDown: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    position: 'absolute', bottom: -12, alignSelf: 'center',
  },
  stepChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  stepText: { fontSize: 11, fontWeight: '800' },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  cardDesc: { fontSize: 14, lineHeight: 21 },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  skipText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, elevation: 3 },
  nextBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});