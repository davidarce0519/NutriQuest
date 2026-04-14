import { TextStyle } from 'react-native';

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  xxl:  26,
  xxxl: 32,
};

export const FontWeight: Record<string, TextStyle['fontWeight']> = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
};

export const LineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
};

export const Typography = {
  h1: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold,     lineHeight: FontSize.xxxl * 1.2 } as TextStyle,
  h2: { fontSize: FontSize.xxl,  fontWeight: FontWeight.bold,     lineHeight: FontSize.xxl  * 1.2 } as TextStyle,
  h3: { fontSize: FontSize.xl,   fontWeight: FontWeight.semibold, lineHeight: FontSize.xl   * 1.3 } as TextStyle,
  h4: { fontSize: FontSize.lg,   fontWeight: FontWeight.semibold, lineHeight: FontSize.lg   * 1.3 } as TextStyle,
  body:    { fontSize: FontSize.base, fontWeight: FontWeight.regular, lineHeight: FontSize.base * 1.5 } as TextStyle,
  bodySm:  { fontSize: FontSize.sm,   fontWeight: FontWeight.regular, lineHeight: FontSize.sm   * 1.5 } as TextStyle,
  caption: { fontSize: FontSize.xs,   fontWeight: FontWeight.regular, lineHeight: FontSize.xs   * 1.4 } as TextStyle,
  label:   { fontSize: FontSize.sm,   fontWeight: FontWeight.medium,  lineHeight: FontSize.sm   * 1.4 } as TextStyle,
  button:  { fontSize: FontSize.base, fontWeight: FontWeight.semibold, lineHeight: FontSize.base * 1.4 } as TextStyle,
};
