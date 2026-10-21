import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigNumber } from '@/components/big-number';
import { LineChart } from '@/components/charts';
import { Icon } from '@/components/icon';
import { Button, Chip, IconButton, OptionCard, ProgressBar, Screen, Segmented, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { monthDay } from '@/lib/dates';
import { goalTimeline, type ActivityLevel, type DietType, type GoalType } from '@/lib/nutrition';
import type { Obstacle, Units } from '@/lib/types';
import {
  cmToFtIn,
  formatNumber,
  formatWeight,
  ftInToCm,
  lbToKg,
  weightFromValue,
  weightUnit,
  weightValue,
} from '@/lib/units';
import { useOnboarding, type OnboardingDraft } from '@/store/onboarding';
import { colors, space } from '@/theme';

type StepId =
  | 'sex'
  | 'activity'
  | 'height'
  | 'weight'
  | 'age'
  | 'goal'
  | 'target'
  | 'rate'
  | 'diet'
  | 'obstacles'
  | 'journey';

const DIETS: DietType[] = ['balanced', 'vegetarian', 'vegan', 'highProtein', 'keto', 'lowCarb', 'pescatarian', 'paleo'];
const OBSTACLES: Obstacle[] = ['consistency', 'habits', 'support', 'time', 'inspiration'];
const ACTIVITIES: ActivityLevel[] = ['low', 'moderate', 'high'];
const GOALS: GoalType[] = ['lose', 'maintain', 'gain'];
const RATES_KG = [0.25, 0.5, 0.75, 1];
const RATES_LB = [0.5, 1, 1.5, 2];
const RATE_LABELS = ['slow', 'recommended', 'fast', 'veryFast'] as const;

function isValid(step: StepId, d: OnboardingDraft): boolean {
  switch (step) {
    case 'sex':
      return d.sex !== null;
    case 'activity':
      return d.activity !== null;
    case 'height':
      return d.heightCm >= 100 && d.heightCm <= 250;
    case 'weight':
      return d.weightKg >= 30 && d.weightKg <= 300;
    case 'age':
      return d.age >= 13 && d.age <= 100;
    case 'goal':
      return d.goal !== null;
    case 'target':
      return d.goal === 'lose' ? d.targetWeightKg < d.weightKg - 0.1 : d.targetWeightKg > d.weightKg + 0.1;
    case 'rate':
      return d.weeklyRateKg > 0;
    case 'diet':
      return d.diet !== null;
    default:
      return true;
  }
}

export default function OnboardingSteps() {
  const { t, locale } = useT();
  const draft = useOnboarding((s) => s.draft);
  const update = useOnboarding((s) => s.update);
  const [index, setIndex] = useState(0);
  const [now] = useState(() => Date.now());

  // Until a goal is chosen, assume the target and pace steps will follow so the step count stays stable.
  const hasTarget = draft.goal !== 'maintain';
  const steps: StepId[] = [
    'sex',
    'activity',
    'height',
    'weight',
    'age',
    'goal',
    ...(hasTarget ? (['target', 'rate'] as const) : []),
    'diet',
    'obstacles',
    'journey',
  ];
  const position = Math.min(index, steps.length - 1);
  const step = steps[position];
  const units = draft.units;

  const next = () => {
    if (position < steps.length - 1) setIndex(position + 1);
    else router.push('/onboarding/plan');
  };
  const back = () => (position === 0 ? router.back() : setIndex(position - 1));

  const chooseGoal = (goal: GoalType) => {
    const delta = goal === 'lose' ? -5 : goal === 'gain' ? 5 : 0;
    update({
      goal,
      targetWeightKg: Math.max(30, Math.round(draft.weightKg + delta)),
      weeklyRateKg: goal === 'gain' ? 0.25 : 0.5,
    });
  };

  const unitToggle = (
    <Segmented<Units>
      value={units}
      onChange={(u) => update({ units: u })}
      options={[
        { value: 'metric', label: t('common.metric') },
        { value: 'imperial', label: t('common.imperial') },
      ]}
      style={{ marginBottom: space.xl }}
    />
  );

  let title = '';
  let subtitle: string | undefined;
  let body: ReactNode = null;

  switch (step) {
    case 'sex':
      title = t('onboarding.sex.title');
      subtitle = t('onboarding.sex.subtitle');
      body = (
        <View style={styles.options}>
          {(['male', 'female'] as const).map((sex) => (
            <OptionCard
              key={sex}
              title={t(`onboarding.sex.${sex}`)}
              selected={draft.sex === sex}
              onPress={() => update({ sex })}
            />
          ))}
        </View>
      );
      break;
    case 'activity':
      title = t('onboarding.activity.title');
      subtitle = t('onboarding.activity.subtitle');
      body = (
        <View style={styles.options}>
          {ACTIVITIES.map((a) => (
            <OptionCard
              key={a}
              title={t(`onboarding.activity.${a}`)}
              subtitle={t(`onboarding.activity.${a}Hint`)}
              selected={draft.activity === a}
              onPress={() => update({ activity: a })}
            />
          ))}
        </View>
      );
      break;
    case 'height': {
      title = t('onboarding.height.title');
      const { ft, inch } = cmToFtIn(draft.heightCm);
      body = (
        <View>
          {unitToggle}
          {units === 'metric' ? (
            <BigNumber
              label={title}
              value={Math.round(draft.heightCm)}
              onChange={(v) => update({ heightCm: v })}
              min={120}
              max={230}
              unit="cm"
              locale={locale}
            />
          ) : (
            <View style={styles.imperialHeight}>
              <View style={styles.imperialPart}>
                <Txt variant="caption" color={colors.textSecondary}>
                  {t('units.ft')}
                </Txt>
                <Stepper value={ft} min={4} max={7} onChange={(v) => update({ heightCm: ftInToCm(v, inch) })} />
              </View>
              <View style={styles.imperialPart}>
                <Txt variant="caption" color={colors.textSecondary}>
                  {t('units.in')}
                </Txt>
                <Stepper value={inch} min={0} max={11} onChange={(v) => update({ heightCm: ftInToCm(ft, v) })} />
              </View>
            </View>
          )}
        </View>
      );
      break;
    }
    case 'weight':
      title = t('onboarding.weight.title');
      body = (
        <View>
          {unitToggle}
          <BigNumber
            label={title}
            value={weightValue(draft.weightKg, units)}
            onChange={(v) => update({ weightKg: weightFromValue(v, units) })}
            step={units === 'metric' ? 0.5 : 1}
            decimals={1}
            min={units === 'metric' ? 30 : 66}
            max={units === 'metric' ? 300 : 660}
            unit={weightUnit(units)}
            locale={locale}
          />
        </View>
      );
      break;
    case 'age':
      title = t('onboarding.age.title');
      body = (
        <BigNumber
          label={title}
          value={draft.age}
          onChange={(v) => update({ age: v })}
          min={13}
          max={100}
          locale={locale}
        />
      );
      break;
    case 'goal':
      title = t('onboarding.goal.title');
      subtitle = t('onboarding.goal.subtitle');
      body = (
        <View style={styles.options}>
          {GOALS.map((g) => (
            <OptionCard key={g} title={t(`onboarding.goal.${g}`)} selected={draft.goal === g} onPress={() => chooseGoal(g)} />
          ))}
        </View>
      );
      break;
    case 'target': {
      title = t('onboarding.target.title');
      subtitle = draft.goal === 'lose' ? t('onboarding.target.loseHint') : t('onboarding.target.gainHint');
      const diffKg = draft.targetWeightKg - draft.weightKg;
      body = (
        <View style={{ gap: space.lg }}>
          <BigNumber
            label={title}
            value={weightValue(draft.targetWeightKg, units)}
            onChange={(v) => update({ targetWeightKg: weightFromValue(v, units) })}
            step={units === 'metric' ? 0.5 : 1}
            decimals={1}
            min={units === 'metric' ? 30 : 66}
            max={units === 'metric' ? 300 : 660}
            unit={weightUnit(units)}
            locale={locale}
          />
          <Txt variant="callout" color={isValid('target', draft) ? colors.textSecondary : colors.danger} center>
            {t('onboarding.target.diff', {
              value: `${diffKg > 0 ? '+' : diffKg < 0 ? '−' : ''}${formatWeight(Math.abs(diffKg), units, locale)}`,
            })}
          </Txt>
        </View>
      );
      break;
    }
    case 'rate': {
      title = t('onboarding.rate.title');
      subtitle = t('onboarding.rate.subtitle');
      const options = units === 'metric' ? RATES_KG.map((kg) => ({ kg, shown: kg })) : RATES_LB.map((lb) => ({ kg: lbToKg(lb), shown: lb }));
      const selected = options.reduce((best, o) =>
        Math.abs(o.kg - draft.weeklyRateKg) < Math.abs(best.kg - draft.weeklyRateKg) ? o : best,
      );
      const labelIndex = options.indexOf(selected);
      const timeline = goalTimeline(draft.weightKg, draft.targetWeightKg, draft.weeklyRateKg);
      body = (
        <View style={{ gap: space.xl }}>
          <Txt variant="number" center>
            {t('onboarding.rate.perWeek', {
              value: `${formatNumber(selected.shown, locale, 2)} ${weightUnit(units)}`,
            })}
          </Txt>
          <View style={styles.chips}>
            {options.map((o) => (
              <Chip
                key={o.shown}
                label={`${formatNumber(o.shown, locale, 2)} ${weightUnit(units)}`}
                selected={o === selected}
                onPress={() => update({ weeklyRateKg: o.kg })}
              />
            ))}
          </View>
          <Txt variant="headline" center color={labelIndex === 3 ? colors.danger : colors.text}>
            {t(`onboarding.rate.${RATE_LABELS[labelIndex]}`)}
          </Txt>
          {timeline ? (
            <Txt variant="callout" color={colors.textSecondary} center>
              {t('onboarding.plan.reachBy', {
                weight: formatWeight(draft.targetWeightKg, units, locale),
                date: monthDay(timeline.targetDate, locale),
              })}
            </Txt>
          ) : null}
        </View>
      );
      break;
    }
    case 'diet':
      title = t('onboarding.diet.title');
      subtitle = t('onboarding.diet.subtitle');
      body = (
        <View style={styles.options}>
          {DIETS.map((d) => (
            <OptionCard key={d} title={t(`onboarding.diet.${d}`)} selected={draft.diet === d} onPress={() => update({ diet: d })} />
          ))}
        </View>
      );
      break;
    case 'obstacles':
      title = t('onboarding.obstacles.title');
      subtitle = t('onboarding.obstacles.subtitle');
      body = (
        <View style={styles.options}>
          {OBSTACLES.map((o) => {
            const selected = draft.obstacles.includes(o);
            return (
              <OptionCard
                key={o}
                title={t(`onboarding.obstacles.${o}`)}
                selected={selected}
                onPress={() =>
                  update({
                    obstacles: selected ? draft.obstacles.filter((x) => x !== o) : [...draft.obstacles, o],
                  })
                }
              />
            );
          })}
        </View>
      );
      break;
    case 'journey': {
      const timeline = hasTarget ? goalTimeline(draft.weightKg, draft.targetWeightKg, draft.weeklyRateKg) : null;
      if (!timeline) {
        title = t('onboarding.journey.maintainTitle');
        subtitle = t('onboarding.journey.maintainText');
        body = (
          <View style={styles.maintain}>
            <Icon name="heart" size={56} color={colors.brand} />
          </View>
        );
        break;
      }
      title = t('onboarding.journey.title');
      subtitle = t('onboarding.journey.subtitle');
      const mid = (draft.weightKg + draft.targetWeightKg) / 2;
      body = (
        <View style={styles.journey}>
          <LineChart
            showScale={false}
            points={[
              { x: now, y: draft.weightKg },
              { x: timeline.midpointDate.getTime(), y: mid },
              { x: timeline.targetDate.getTime(), y: draft.targetWeightKg },
            ]}
            formatValue={(v) => formatWeight(v, units, locale)}
          />
          <View style={styles.journeyLabels}>
            {[
              { label: t('onboarding.journey.today'), date: new Date(now), weight: draft.weightKg },
              { label: t('onboarding.journey.halfway'), date: timeline.midpointDate, weight: mid },
              { label: t('onboarding.journey.goal'), date: timeline.targetDate, weight: draft.targetWeightKg },
            ].map((p) => (
              <View key={p.label} style={{ alignItems: 'center', flex: 1 }}>
                <Txt variant="headline">{formatWeight(p.weight, units, locale)}</Txt>
                <Txt variant="caption" color={colors.textSecondary}>
                  {p.label}
                </Txt>
                <Txt variant="micro" color={colors.textTertiary}>
                  {monthDay(p.date, locale)}
                </Txt>
              </View>
            ))}
          </View>
        </View>
      );
      break;
    }
  }

  return (
    <Screen
      header={
        <View style={styles.top}>
          <IconButton icon="chevronLeft" label={t('common.back')} onPress={back} />
          <View style={{ flex: 1 }}>
            <ProgressBar value={(position + 1) / steps.length} height={6} />
          </View>
          <Txt variant="caption" color={colors.textSecondary}>
            {t('onboarding.step', { current: position + 1, total: steps.length })}
          </Txt>
        </View>
      }
      footer={<Button title={t('common.continue')} disabled={!isValid(step, draft)} onPress={next} />}>
      <View style={styles.heading}>
        <Txt variant="title" style={{ fontSize: 28, lineHeight: 34 }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="callout" color={colors.textSecondary}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  heading: { gap: space.sm, marginTop: space.lg, marginBottom: space.xl },
  options: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  imperialHeight: { flexDirection: 'row', justifyContent: 'space-around' },
  imperialPart: { alignItems: 'center', gap: space.sm },
  maintain: { alignItems: 'center', marginTop: space.xxl },
  journey: { backgroundColor: colors.card, borderRadius: 20, padding: space.lg, gap: space.lg },
  journeyLabels: { flexDirection: 'row' },
});
