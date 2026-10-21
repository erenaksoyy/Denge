import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarChart, LineChart } from '@/components/charts';
import { Icon } from '@/components/icon';
import { MacroLine } from '@/components/nutrition';
import { TabHeader } from '@/components/tab-header';
import { Button, Card, ProgressBar, Segmented, SectionTitle, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { addDays, monthDayShort, parseDay, weekdayShort } from '@/lib/dates';
import { bmi, bmiCategory, type BmiCategory } from '@/lib/nutrition';
import { formatNumber, formatWeight } from '@/lib/units';
import { streakInfo, weekSummary } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, radius, space } from '@/theme';

type Range = '1m' | '3m' | '6m' | '1y' | 'all';
const RANGE_DAYS: Record<Range, number | null> = { '1m': 30, '3m': 90, '6m': 182, '1y': 365, all: null };

const BMI_COLORS: Record<BmiCategory, string> = {
  underweight: colors.fat,
  healthy: colors.brand,
  overweight: colors.warning,
  obese: colors.danger,
};

export default function ProgressScreen() {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const meals = useStore((s) => s.meals);
  const goals = useStore((s) => s.goals);
  const units = useStore((s) => s.settings.units);
  const [range, setRange] = useState<Range>('3m');
  const [weeksAgo, setWeeksAgo] = useState(0);

  if (!profile) return null;

  // ---- Weight goal ----
  const start = profile.startWeightKg;
  const current = profile.weightKg;
  const target = profile.targetWeightKg;
  const totalChange = Math.abs(target - start);
  const done = totalChange > 0 ? Math.min(1, Math.max(0, (start - current) / (start - target))) : 1;
  const reached = profile.goal !== 'maintain' && (target < start ? current <= target : current >= target);

  // ---- BMI ----
  const bmiValue = bmi(current, profile.heightCm);
  const category = bmiCategory(bmiValue);
  const marker = Math.min(1, Math.max(0, (bmiValue - 15) / (40 - 15)));

  // ---- Weight chart ----
  const days = RANGE_DAYS[range];
  const since = days ? addDays(new Date(), -days).getTime() : 0;
  const points = weights
    .map((w) => ({ x: parseDay(w.day).getTime(), y: w.kg }))
    .filter((p) => p.x >= since)
    .sort((a, b) => a.x - b.x);

  // ---- Nutrition ----
  const week = weekSummary(meals, weeksAgo);
  const logged = week.filter((d) => d.calories > 0);
  const total = week.reduce((sum, d) => sum + d.calories, 0);
  const avg = logged.length ? Math.round(total / logged.length) : 0;
  const avgMacros = {
    protein: logged.length ? logged.reduce((s, d) => s + d.protein, 0) / logged.length : 0,
    carbs: logged.length ? logged.reduce((s, d) => s + d.carbs, 0) / logged.length : 0,
    fat: logged.length ? logged.reduce((s, d) => s + d.fat, 0) / logged.length : 0,
  };

  const streak = streakInfo(meals);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <TabHeader title={t('progress.title')} />
        <View style={styles.content}>
          <View style={styles.row}>
            <Card style={styles.half}>
              <Txt variant="caption" color={colors.textSecondary}>
                {t('progress.currentWeight')}
              </Txt>
              <Txt variant="title">{formatWeight(current, units, locale)}</Txt>
              <Button title={t('progress.logWeight')} small onPress={() => router.push('/weight')} style={{ marginTop: space.sm }} />
            </Card>
            <Card style={styles.half}>
              <Txt variant="caption" color={colors.textSecondary}>
                {t('progress.goalWeight')}
              </Txt>
              <Txt variant="title">{formatWeight(target, units, locale)}</Txt>
              <Button
                title={t('progress.editGoal')}
                small
                variant="secondary"
                onPress={() => router.push('/profile')}
                style={{ marginTop: space.sm, backgroundColor: colors.cardMuted }}
              />
            </Card>
          </View>

          {profile.goal !== 'maintain' ? (
            <Card style={{ marginTop: space.sm, gap: space.sm }}>
              <View style={styles.between}>
                <Txt variant="headline">
                  {reached
                    ? t('progress.reached')
                    : t('progress.toGo', { value: formatWeight(Math.abs(current - target), units, locale) })}
                </Txt>
                <Txt variant="caption" color={colors.textSecondary}>
                  {t('progress.progressPct', { pct: Math.round(done * 100) })}
                </Txt>
              </View>
              <ProgressBar value={done} color={colors.brand} height={10} />
              <View style={styles.between}>
                <Txt variant="micro" color={colors.textTertiary}>
                  {formatWeight(start, units, locale)}
                </Txt>
                <Txt variant="micro" color={colors.textTertiary}>
                  {formatWeight(target, units, locale)}
                </Txt>
              </View>
            </Card>
          ) : null}

          <SectionTitle>{t('progress.bmiTitle')}</SectionTitle>
          <Card style={{ gap: space.md }}>
            <View style={styles.between}>
              <Txt variant="number">{formatNumber(bmiValue, locale, 1)}</Txt>
              <View style={[styles.badge, { backgroundColor: `${BMI_COLORS[category]}22` }]}>
                <Txt variant="callout" color={BMI_COLORS[category]}>
                  {t(`progress.bmi.${category}`)}
                </Txt>
              </View>
            </View>
            <View>
              <View style={styles.bmiBar}>
                <View style={[styles.bmiSegment, { flex: 3.5, backgroundColor: colors.fat }]} />
                <View style={[styles.bmiSegment, { flex: 6.5, backgroundColor: colors.brand }]} />
                <View style={[styles.bmiSegment, { flex: 5, backgroundColor: colors.warning }]} />
                <View style={[styles.bmiSegment, { flex: 10, backgroundColor: colors.danger }]} />
              </View>
              <View style={[styles.marker, { left: `${marker * 100}%` }]} />
            </View>
            <View style={styles.between}>
              {(['underweight', 'healthy', 'overweight', 'obese'] as const).map((c) => (
                <Txt key={c} variant="micro" color={colors.textTertiary}>
                  {t(`progress.bmi.${c}`)}
                </Txt>
              ))}
            </View>
            <Txt variant="caption" color={colors.textSecondary}>
              {t('progress.bmiNote')}
            </Txt>
          </Card>

          <SectionTitle>{t('progress.weightChart')}</SectionTitle>
          <Card style={{ gap: space.md }}>
            <Segmented<Range>
              value={range}
              onChange={setRange}
              options={[
                { value: '1m', label: t('progress.range1m') },
                { value: '3m', label: t('progress.range3m') },
                { value: '6m', label: t('progress.range6m') },
                { value: '1y', label: t('progress.range1y') },
                { value: 'all', label: t('progress.rangeAll') },
              ]}
            />
            {points.length >= 2 ? (
              <LineChart
                points={points}
                target={profile.goal !== 'maintain' ? target : undefined}
                formatValue={(v) => formatWeight(v, units, locale)}
                formatX={(x) => monthDayShort(new Date(x), locale)}
              />
            ) : (
              <Txt variant="callout" color={colors.textSecondary}>
                {t('progress.noWeights')}
              </Txt>
            )}
          </Card>

          <SectionTitle>{t('progress.nutrition')}</SectionTitle>
          <Card style={{ gap: space.md }}>
            <Segmented<string>
              value={String(weeksAgo)}
              onChange={(v) => setWeeksAgo(Number(v))}
              options={[
                { value: '3', label: t('progress.weeksAgo', { count: 3 }) },
                { value: '2', label: t('progress.weeksAgo', { count: 2 }) },
                { value: '1', label: t('progress.lastWeek') },
                { value: '0', label: t('progress.thisWeek') },
              ]}
            />
            <BarChart
              data={week.map((d) => ({ label: weekdayShort(d.date, locale).slice(0, 2), value: d.calories }))}
              goal={goals.calories}
            />
            {logged.length ? (
              <>
                <View style={styles.stats}>
                  <View>
                    <Txt variant="title">{formatNumber(total, locale)}</Txt>
                    <Txt variant="micro" color={colors.textTertiary}>
                      {t('progress.total').toLocaleUpperCase(locale)} · {t('common.kcal')}
                    </Txt>
                  </View>
                  <View>
                    <Txt variant="title">{formatNumber(avg, locale)}</Txt>
                    <Txt variant="micro" color={colors.textTertiary}>
                      {t('progress.dailyAvg').toLocaleUpperCase(locale)} · {t('common.kcal')}
                    </Txt>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {t('progress.avgMacros')}
                  </Txt>
                  <MacroLine value={avgMacros} />
                </View>
              </>
            ) : (
              <Txt variant="callout" color={colors.textSecondary}>
                {t('progress.noNutrition')}
              </Txt>
            )}
          </Card>

          <SectionTitle>{t('progress.streak')}</SectionTitle>
          <Card style={styles.streak} onPress={() => router.push('/streak')}>
            <View style={styles.flame}>
              <Icon name="flame" size={26} color={colors.carbs} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="title">{t('progress.streakDays', { count: streak.current })}</Txt>
              <Txt variant="caption" color={colors.textSecondary}>
                {t('progress.best', { count: streak.best })}
              </Txt>
            </View>
            <Icon name="chevronRight" size={14} color={colors.textTertiary} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg },
  row: { flexDirection: 'row', gap: space.sm },
  half: { flex: 1, gap: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill },
  bmiBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  bmiSegment: { height: 10 },
  marker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 18,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  stats: { flexDirection: 'row', gap: space.xxl },
  streak: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flame: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.carbsSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
