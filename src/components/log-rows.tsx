import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { timeHM } from '@/lib/dates';
import { mealNutrients } from '@/lib/meal';
import type { ExerciseLog, MealLog } from '@/lib/types';
import { colors, radius, shadow, space } from '@/theme';

import { Icon, type IconName } from './icon';
import { MacroLine } from './nutrition';
import { Txt } from './ui';

export function MealThumb({ uri, size = 56 }: { uri: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: 14 }} contentFit="cover" />;
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size }]}>
      <Icon name="food" size={size * 0.4} color={colors.textSecondary} />
    </View>
  );
}

const PROCESSING_KEYS = ['today.processing1', 'today.processing2', 'today.processing3', 'today.processing4'] as const;

export function MealRow({ meal, onPress }: { meal: MealLog; onPress: () => void }) {
  const { t, locale } = useT();
  const [step, setStep] = useState(0);
  const processing = meal.status === 'processing';

  useEffect(() => {
    if (!processing) return;
    const id = setInterval(() => setStep((s) => (s + 1) % PROCESSING_KEYS.length), 1800);
    return () => clearInterval(id);
  }, [processing]);

  const totals = mealNutrients(meal);
  const errorText = meal.error ? t(`errors.${meal.error}`) : t('errors.unknown');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={processing ? t('meal.analyzing') : meal.name || t('today.failedTitle')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View>
        <MealThumb uri={meal.imageUri} />
        {processing ? (
          <View style={styles.thumbOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        {processing ? (
          <>
            <Txt variant="headline">{t('meal.analyzing')}</Txt>
            <Txt variant="caption" color={colors.textSecondary}>
              {t(PROCESSING_KEYS[step])}
            </Txt>
          </>
        ) : meal.status === 'failed' ? (
          <>
            <Txt variant="headline" color={colors.danger}>
              {t('today.failedTitle')}
            </Txt>
            <Txt variant="caption" color={colors.textSecondary} numberOfLines={2}>
              {errorText}
            </Txt>
          </>
        ) : (
          <>
            <View style={styles.titleLine}>
              <Txt variant="headline" numberOfLines={1} style={{ flex: 1 }}>
                {meal.name}
              </Txt>
              <Txt variant="caption" color={colors.textTertiary}>
                {timeHM(meal.createdAt, locale)}
              </Txt>
            </View>
            <View style={styles.kcalLine}>
              <Icon name="flame" size={14} color={colors.text} />
              <Txt variant="callout">
                {totals.calories} {t('common.kcal')}
              </Txt>
            </View>
            <MacroLine value={totals} />
          </>
        )}
      </View>
    </Pressable>
  );
}

const EXERCISE_ICON: Record<ExerciseLog['kind'], IconName> = {
  run: 'run',
  walk: 'walk',
  cycle: 'cycle',
  swim: 'swim',
  weights: 'weights',
  hiit: 'hiit',
  custom: 'flame',
};

export function ExerciseRow({ exercise, onPress }: { exercise: ExerciseLog; onPress?: () => void }) {
  const { t, locale } = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.placeholder, { backgroundColor: colors.proteinSoft }]}>
        <Icon name={EXERCISE_ICON[exercise.kind]} size={24} color={colors.protein} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.titleLine}>
          <Txt variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            {exercise.name}
          </Txt>
          <Txt variant="caption" color={colors.textTertiary}>
            {timeHM(exercise.createdAt, locale)}
          </Txt>
        </View>
        <Txt variant="callout">
          −{exercise.calories} {t('common.kcal')}
        </Txt>
        <Txt variant="caption" color={colors.textSecondary}>
          {exercise.minutes} {t('common.min')} · {t(`exercise.${exercise.intensity}`)}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kcalLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
