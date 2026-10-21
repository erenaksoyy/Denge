import { Platform } from 'react-native';

export const colors = {
  bg: '#F3F3F5',
  card: '#FFFFFF',
  cardMuted: '#F7F7F9',
  text: '#111113',
  textSecondary: '#6B6B73',
  textTertiary: '#A1A1AA',
  border: '#E6E6EA',
  primary: '#111113',
  onPrimary: '#FFFFFF',
  brand: '#1FA971',
  brandSoft: '#E2F5EC',
  protein: '#EF5F45',
  proteinSoft: '#FDE8E3',
  carbs: '#EE9F2E',
  carbsSoft: '#FCF0DC',
  fat: '#3F8DE0',
  fatSoft: '#E3EFFC',
  water: '#2A9BEA',
  waterSoft: '#E1F1FD',
  fasting: '#7A5AF5',
  fastingSoft: '#EDE8FE',
  danger: '#E5484D',
  dangerSoft: '#FCE7E8',
  warning: '#F2A523',
  success: '#1FA971',
  overlay: 'rgba(17, 17, 19, 0.4)',
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const type = {
  largeTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.4 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  callout: { fontSize: 15, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '500' },
  micro: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  number: { fontSize: 34, fontWeight: '700', letterSpacing: -0.8 },
} as const;

export const shadow = Platform.select({
  ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 1 },
  default: { boxShadow: '0 4px 14px rgba(0,0,0,0.05)' },
});

export type MacroKey = 'protein' | 'carbs' | 'fat';

export const macroColor: Record<MacroKey, { main: string; soft: string }> = {
  protein: { main: colors.protein, soft: colors.proteinSoft },
  carbs: { main: colors.carbs, soft: colors.carbsSoft },
  fat: { main: colors.fat, soft: colors.fatSoft },
};
