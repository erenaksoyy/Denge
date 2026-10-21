import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Ring } from '@/components/ring';
import { Button, Card, ProgressBar, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { monthDay } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { calcPlan, goalTimeline } from '@/lib/nutrition';
import type { Profile } from '@/lib/types';
import { formatNumber, formatWeight } from '@/lib/units';
import { useOnboarding } from '@/store/onboarding';
import { useStore } from '@/store/store';
import { colors, macroColor, radius, space } from '@/theme';

const DURATION_MS = 2600;

export default function PlanScreen() {
  const { t, locale } = useT();
  const draft = useOnboarding((s) => s.draft);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / DURATION_MS) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(id);
        haptic.success();
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  const goal = draft.goal ?? 'maintain';
  const profile: Profile = {
    name: '',
    sex: draft.sex ?? 'male',
    age: draft.age,
    heightCm: Math.round(draft.heightCm),
    weightKg: Math.round(draft.weightKg * 10) / 10,
    startWeightKg: Math.round(draft.weightKg * 10) / 10,
    targetWeightKg: goal === 'maintain' ? draft.weightKg : Math.round(draft.targetWeightKg * 10) / 10,
    goal,
    activity: draft.activity ?? 'moderate',
    weeklyRateKg: goal === 'maintain' ? 0 : draft.weeklyRateKg,
    diet: draft.diet ?? 'balanced',
    obstacles: draft.obstacles,
    createdAt: new Date().toISOString(),
  };
  const plan = calcPlan(profile, 'mifflin');
  const timeline = goalTimeline(profile.weightKg, profile.targetWeightKg, profile.weeklyRateKg);

  if (pct < 100) {
    const steps = [t('onboarding.plan.step1'), t('onboarding.plan.step2'), t('onboarding.plan.step3')];
    return (
      <Screen scroll={false}>
        <View style={styles.loading}>
          <Txt variant="number" style={{ fontSize: 56 }}>
            %{pct}
          </Txt>
          <Txt variant="title" center>
            {t('onboarding.plan.preparing')}
          </Txt>
          <View style={{ alignSelf: 'stretch' }}>
            <ProgressBar value={pct / 100} height={8} color={colors.brand} />
          </View>
          <View style={styles.loadingSteps}>
            {steps.map((label, i) => {
              const done = pct >= ((i + 1) / steps.length) * 100 - 1;
              return (
                <View key={label} style={styles.loadingStep}>
                  <View style={[styles.check, done && { backgroundColor: colors.brand }]}>
                    {done ? <Icon name="check" size={12} color={colors.onPrimary} /> : null}
                  </View>
                  <Txt variant="callout" color={done ? colors.text : colors.textTertiary}>
                    {label}
                  </Txt>
                </View>
              );
            })}
          </View>
        </View>
      </Screen>
    );
  }

  const macros = [
    { key: 'protein' as const, label: t('common.protein'), grams: plan.proteinG },
    { key: 'carbs' as const, label: t('common.carbsLong'), grams: plan.carbsG },
    { key: 'fat' as const, label: t('common.fat'), grams: plan.fatG },
  ];

  return (
    <Screen
      footer={<Button title={t('onboarding.plan.start')} onPress={() => completeOnboarding(profile, { units: draft.units })} />}>
      <View style={styles.readyHeader}>
        <View style={styles.badge}>
          <Icon name="check" size={28} color={colors.onPrimary} />
        </View>
        <Txt variant="largeTitle" center>
          {t('onboarding.plan.ready')}
        </Txt>
        <Txt variant="callout" color={colors.textSecondary} center>
          {timeline
            ? t('onboarding.plan.reachBy', {
                weight: formatWeight(profile.targetWeightKg, draft.units, locale),
                date: monthDay(timeline.targetDate, locale),
              })
            : t('onboarding.plan.maintainBy')}
        </Txt>
      </View>

      <Card style={styles.caloriesCard}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="caption" color={colors.textSecondary}>
            {t('onboarding.plan.daily')}
          </Txt>
          <Txt variant="number">{formatNumber(plan.calories, locale)}</Txt>
          <Txt variant="callout" color={colors.textSecondary}>
            {t('common.kcal')}
          </Txt>
        </View>
        <Ring size={88} stroke={10} progress={1} color={colors.primary}>
          <Icon name="flame" size={26} />
        </Ring>
      </Card>

      <View style={styles.macros}>
        {macros.map((m) => (
          <View key={m.key} style={[styles.macro, { backgroundColor: macroColor[m.key].soft }]}>
            <Txt variant="title" color={macroColor[m.key].main}>
              {m.grams}g
            </Txt>
            <Txt variant="caption" color={colors.textSecondary}>
              {m.label}
            </Txt>
          </View>
        ))}
      </View>

      {plan.clampedToMinimum ? (
        <Txt variant="caption" color={colors.warning} style={{ marginTop: space.md }}>
          {t('onboarding.plan.clamped', { kcal: plan.calories })}
        </Txt>
      ) : null}

      <Card style={{ marginTop: space.lg, gap: space.md }}>
        <Txt variant="headline">{t('onboarding.plan.tipsTitle')}</Txt>
        {(['tip1', 'tip2', 'tip3', 'tip4'] as const).map((tip) => (
          <View key={tip} style={styles.tip}>
            <Icon name="check" size={16} color={colors.brand} />
            <Txt variant="callout" style={{ flex: 1 }}>
              {t(`onboarding.plan.${tip}`)}
            </Txt>
          </View>
        ))}
      </Card>

      <Txt variant="caption" color={colors.textTertiary} style={{ marginTop: space.md }}>
        {t('onboarding.plan.formulaNote', { formula: 'Mifflin-St Jeor' })}
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  loadingSteps: { alignSelf: 'stretch', gap: space.md, marginTop: space.lg },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyHeader: { alignItems: 'center', gap: space.sm, marginTop: space.xl, marginBottom: space.xl },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  caloriesCard: { flexDirection: 'row', alignItems: 'center' },
  macros: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  macro: { flex: 1, borderRadius: radius.lg, padding: space.md, gap: 2 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
