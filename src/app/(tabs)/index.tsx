import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/date-strip';
import { Icon } from '@/components/icon';
import { ExerciseRow, MealRow } from '@/components/log-rows';
import { CalorieCard, MacroCards } from '@/components/nutrition';
import { Ring } from '@/components/ring';
import { TabHeader } from '@/components/tab-header';
import { Card, EmptyState, IconButton, SectionTitle, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { addDaysKey, dayKey, longDate, parseDay } from '@/lib/dates';
import { confirmDialog } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { formatVolume } from '@/lib/units';
import type { ExerciseLog, MealLog } from '@/lib/types';
import { calorieBudget, dayBurned, dayNutrients } from '@/store/selectors';
import { useStore } from '@/store/store';
import { useUi } from '@/store/ui';
import { colors, space } from '@/theme';

type Entry = { kind: 'meal'; item: MealLog } | { kind: 'exercise'; item: ExerciseLog };

export default function TodayScreen() {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const meals = useStore((s) => s.meals);
  const exercises = useStore((s) => s.exercises);
  const goals = useStore((s) => s.goals);
  const settings = useStore((s) => s.settings);
  const water = useStore((s) => s.water);
  const profile = useStore((s) => s.profile);
  const addWater = useStore((s) => s.addWater);
  const removeExercise = useStore((s) => s.removeExercise);
  const selectedDay = useUi((s) => s.selectedDay);
  const setSelectedDay = useUi((s) => s.setSelectedDay);

  // If the app stayed open past midnight, move "today" forward.
  const lastToday = useRef(dayKey());
  useFocusEffect(
    useCallback(() => {
      const today = dayKey();
      if (today !== lastToday.current) {
        if (useUi.getState().selectedDay === lastToday.current) setSelectedDay(today);
        lastToday.current = today;
      }
    }, [setSelectedDay]),
  );

  const today = dayKey();
  const totals = dayNutrients(meals, selectedDay);
  const burned = dayBurned(exercises, selectedDay);
  const budget = calorieBudget(goals, settings, burned);
  const waterMl = water[selectedDay] ?? 0;

  const entries: Entry[] = [
    ...meals.filter((m) => m.day === selectedDay).map((item) => ({ kind: 'meal' as const, item })),
    ...exercises.filter((e) => e.day === selectedDay).map((item) => ({ kind: 'exercise' as const, item })),
  ].sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));

  const progressFor = (day: string) => {
    const eaten = dayNutrients(meals, day).calories;
    if (eaten <= 0) return null;
    const dayBudget = calorieBudget(goals, settings, dayBurned(exercises, day));
    return { value: eaten / dayBudget, over: eaten > dayBudget };
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('today.greetingMorning') : hour < 18 ? t('today.greetingDay') : t('today.greetingEvening');
  const title =
    selectedDay === today
      ? t('common.today')
      : selectedDay === addDaysKey(today, -1)
        ? t('common.yesterday')
        : longDate(parseDay(selectedDay), locale);

  const deleteExercise = async (exercise: ExerciseLog) => {
    const ok = await confirmDialog({
      title: t('exercise.deleteTitle'),
      message: `${exercise.name} · −${exercise.calories} ${t('common.kcal')}`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) removeExercise(exercise.id);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <TabHeader title={title} subtitle={profile?.name ? `${greeting}, ${profile.name}` : greeting} />
        <DateStrip selected={selectedDay} onSelect={setSelectedDay} progressFor={progressFor} />

        <View style={styles.content}>
          <CalorieCard eaten={totals.calories} burned={burned} budget={budget} onPress={() => router.push('/goals')} />
          <MacroCards
            eaten={totals}
            goals={{ protein: goals.proteinG, carbs: goals.carbsG, fat: goals.fatG }}
            onPress={() => router.push('/goals')}
          />

          <View style={styles.row}>
            <View style={styles.smallWrap}>
              <Card style={styles.smallCard} onPress={() => router.push('/water')} accessibilityLabel={t('today.water')}>
                <Ring
                  size={44}
                  stroke={5}
                  progress={waterMl / settings.waterGoalMl}
                  color={colors.water}
                  track={colors.waterSoft}>
                  <Icon name="water" size={16} color={colors.water} />
                </Ring>
                <Txt variant="caption" color={colors.textSecondary} style={styles.smallLabel}>
                  {t('today.water')}
                </Txt>
                <Txt variant="headline" numberOfLines={1}>
                  {formatVolume(waterMl, settings.units, locale)}
                </Txt>
                <Txt variant="micro" color={colors.textTertiary}>
                  / {formatVolume(settings.waterGoalMl, settings.units, locale)}
                </Txt>
              </Card>
              <View style={styles.smallAction}>
                <IconButton
                  icon="add"
                  label={t('water.addGlass')}
                  size={34}
                  background={colors.waterSoft}
                  color={colors.water}
                  onPress={() => {
                    haptic.light();
                    addWater(selectedDay, settings.glassMl);
                  }}
                />
              </View>
            </View>

            <View style={styles.smallWrap}>
              <Card style={styles.smallCard} onPress={() => router.push('/exercise')} accessibilityLabel={t('today.exercise')}>
                <View style={[styles.badge, { backgroundColor: colors.proteinSoft }]}>
                  <Icon name="flame" size={20} color={colors.protein} />
                </View>
                <Txt variant="caption" color={colors.textSecondary} style={styles.smallLabel}>
                  {t('today.burned')}
                </Txt>
                <Txt variant="headline">
                  {burned > 0 ? `${burned} ${t('common.kcal')}` : t('today.noExercise')}
                </Txt>
                <Txt variant="micro" color={colors.textTertiary}>
                  {t('today.exercise').toLocaleUpperCase(locale)}
                </Txt>
              </Card>
              <View style={styles.smallAction}>
                <IconButton
                  icon="add"
                  label={t('exercise.title')}
                  size={34}
                  background={colors.proteinSoft}
                  color={colors.protein}
                  onPress={() => router.push('/exercise')}
                />
              </View>
            </View>
          </View>

          <SectionTitle>{t('today.logged')}</SectionTitle>
          {entries.length === 0 ? (
            <EmptyState icon="camera" title={t('today.emptyTitle')} text={t('today.emptyText')} />
          ) : (
            <View style={{ gap: space.sm }}>
              {entries.map((entry) =>
                entry.kind === 'meal' ? (
                  <MealRow
                    key={entry.item.id}
                    meal={entry.item}
                    onPress={() => router.push({ pathname: '/meal/[id]', params: { id: entry.item.id } })}
                  />
                ) : (
                  <ExerciseRow key={entry.item.id} exercise={entry.item} onPress={() => deleteExercise(entry.item)} />
                ),
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, paddingTop: space.md },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  smallWrap: { flex: 1 },
  smallCard: { padding: space.md, gap: 2 },
  smallLabel: { marginTop: space.sm },
  smallAction: { position: 'absolute', top: space.md, right: space.md },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
