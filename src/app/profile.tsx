import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { BigNumber } from '@/components/big-number';
import { Sheet } from '@/components/sheet';
import { Button, Card, Chip, Divider, Header, ListRow, OptionCard, Screen, Segmented, SectionTitle, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { confirmDialog } from '@/lib/dialogs';
import type { ActivityLevel, BmrFormula, DietType, GoalType, Sex } from '@/lib/nutrition';
import type { Language, Profile, Settings, Units } from '@/lib/types';
import {
  cmToFtIn,
  formatHeight,
  formatNumber,
  formatVolume,
  formatWeight,
  ftInToCm,
  lbToKg,
  weightFromValue,
  weightUnit,
  weightValue,
} from '@/lib/units';
import { useStore } from '@/store/store';
import { colors, radius, space } from '@/theme';

type Field = 'name' | 'sex' | 'age' | 'height' | 'goal' | 'target' | 'rate' | 'activity' | 'diet' | 'language' | 'formula';

const DIETS: DietType[] = ['balanced', 'vegetarian', 'vegan', 'highProtein', 'keto', 'lowCarb', 'pescatarian', 'paleo'];
const ACTIVITIES: ActivityLevel[] = ['low', 'moderate', 'high'];
const GOALS: GoalType[] = ['lose', 'maintain', 'gain'];

export default function ProfileScreen() {
  const { t, locale } = useT();
  const profile = useStore((s) => s.profile);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const [field, setField] = useState<Field | null>(null);

  if (!profile) return null;
  const units = settings.units;

  const reset = async () => {
    const ok = await confirmDialog({
      title: t('profile.resetTitle'),
      message: t('profile.resetText'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) resetAll();
  };

  const languageLabel =
    settings.language === 'system' ? t('profile.langSystem') : settings.language === 'tr' ? 'Türkçe' : 'English';

  return (
    <Screen header={<Header title={t('profile.title')} />}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Txt variant="title" color={colors.onPrimary}>
            {(profile.name || 'D').slice(0, 1).toLocaleUpperCase(locale)}
          </Txt>
        </View>
        <Txt variant="title">{profile.name || t('profile.namePlaceholder')}</Txt>
      </View>

      <SectionTitle>{t('profile.personal')}</SectionTitle>
      <Card style={styles.group}>
        <ListRow title={t('profile.name')} value={profile.name || '—'} onPress={() => setField('name')} />
        <Divider />
        <ListRow title={t('profile.sex')} value={t(`onboarding.sex.${profile.sex}`)} onPress={() => setField('sex')} />
        <Divider />
        <ListRow title={t('profile.age')} value={String(profile.age)} onPress={() => setField('age')} />
        <Divider />
        <ListRow title={t('profile.height')} value={formatHeight(profile.heightCm, units, locale)} onPress={() => setField('height')} />
        <Divider />
        <ListRow title={t('profile.weight')} value={formatWeight(profile.weightKg, units, locale)} onPress={() => router.push('/weight')} />
      </Card>

      <SectionTitle>{t('profile.goalSection')}</SectionTitle>
      <Card style={styles.group}>
        <ListRow title={t('profile.goalType')} value={t(`onboarding.goal.${profile.goal}`)} onPress={() => setField('goal')} />
        {profile.goal !== 'maintain' ? (
          <>
            <Divider />
            <ListRow
              title={t('profile.targetWeight')}
              value={formatWeight(profile.targetWeightKg, units, locale)}
              onPress={() => setField('target')}
            />
            <Divider />
            <ListRow
              title={t('profile.rate')}
              value={t('onboarding.rate.perWeek', { value: formatWeight(profile.weeklyRateKg, units, locale) })}
              onPress={() => setField('rate')}
            />
          </>
        ) : null}
        <Divider />
        <ListRow title={t('profile.activity')} value={t(`onboarding.activity.${profile.activity}`)} onPress={() => setField('activity')} />
        <Divider />
        <ListRow title={t('profile.diet')} value={t(`onboarding.diet.${profile.diet}`)} onPress={() => setField('diet')} />
        <Divider />
        <ListRow title={t('profile.goals')} onPress={() => router.push('/goals')} />
        <Divider />
        <ListRow
          title={t('profile.waterGoal')}
          value={formatVolume(settings.waterGoalMl, units, locale)}
          onPress={() => router.push('/water')}
        />
      </Card>

      <SectionTitle>{t('profile.preferences')}</SectionTitle>
      <Card style={[styles.group, { gap: space.md, paddingVertical: space.lg }]}>
        <Txt variant="callout">{t('profile.units')}</Txt>
        <Segmented<Units>
          value={units}
          onChange={(u) => updateSettings({ units: u })}
          options={[
            { value: 'metric', label: t('common.metric') },
            { value: 'imperial', label: t('common.imperial') },
          ]}
        />
      </Card>
      <Card style={[styles.group, { marginTop: space.sm }]}>
        <ListRow title={t('profile.language')} value={languageLabel} icon="globe" onPress={() => setField('language')} />
        <Divider />
        <ListRow
          title={t('profile.formula')}
          value={settings.formula === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'}
          icon="settings"
          onPress={() => setField('formula')}
        />
        <Divider />
        <ListRow
          title={t('profile.addBurned')}
          subtitle={t('profile.addBurnedHint')}
          icon="flame"
          right={
            <Switch
              value={settings.addBurnedToGoal}
              onValueChange={(v) => updateSettings({ addBurnedToGoal: v })}
              trackColor={{ true: colors.brand, false: colors.border }}
            />
          }
        />
      </Card>

      <SectionTitle>{t('profile.data')}</SectionTitle>
      <Card style={styles.group}>
        <ListRow title={t('profile.reset')} icon="trash" destructive onPress={reset} />
      </Card>

      <SectionTitle>{t('profile.about')}</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <Txt variant="callout">Denge · {t('profile.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Txt>
        <Txt variant="caption" color={colors.textSecondary}>
          {t('profile.disclaimer')}
        </Txt>
        <Txt variant="caption" color={colors.textTertiary}>
          {t('profile.credits')}
        </Txt>
      </Card>

      {field ? <EditSheet key={field} field={field} profile={profile} settings={settings} onClose={() => setField(null)} /> : null}
    </Screen>
  );
}

function EditSheet({
  field,
  profile,
  settings,
  onClose,
}: {
  field: Field;
  profile: Profile;
  settings: Settings;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const updateProfile = useStore((s) => s.updateProfile);
  const updateSettings = useStore((s) => s.updateSettings);
  const units = settings.units;

  const [name, setName] = useState(profile.name);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [age, setAge] = useState(profile.age);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [goal, setGoal] = useState<GoalType>(profile.goal);
  const [target, setTarget] = useState(weightValue(profile.targetWeightKg, units));
  const [rate, setRate] = useState(profile.weeklyRateKg || 0.5);
  const [activity, setActivity] = useState<ActivityLevel>(profile.activity);
  const [diet, setDiet] = useState<DietType>(profile.diet);
  const [language, setLanguage] = useState<Language>(settings.language);
  const [formula, setFormula] = useState<BmrFormula>(settings.formula);

  const targetKg = weightFromValue(target, units);
  const targetValid =
    profile.goal === 'lose' ? targetKg < profile.weightKg - 0.1 : profile.goal === 'gain' ? targetKg > profile.weightKg + 0.1 : true;

  const save = () => {
    switch (field) {
      case 'name':
        updateProfile({ name: name.trim() });
        break;
      case 'sex':
        updateProfile({ sex });
        break;
      case 'age':
        updateProfile({ age });
        break;
      case 'height':
        updateProfile({ heightCm: Math.round(heightCm) });
        break;
      case 'goal': {
        const w = profile.weightKg;
        let targetWeightKg = profile.targetWeightKg;
        if (goal === 'maintain') targetWeightKg = w;
        if (goal === 'lose' && targetWeightKg >= w) targetWeightKg = Math.round(w - 5);
        if (goal === 'gain' && targetWeightKg <= w) targetWeightKg = Math.round(w + 5);
        updateProfile({
          goal,
          targetWeightKg,
          weeklyRateKg: goal === 'maintain' ? 0 : profile.weeklyRateKg || (goal === 'gain' ? 0.25 : 0.5),
        });
        break;
      }
      case 'target':
        updateProfile({ targetWeightKg: Math.round(targetKg * 10) / 10 });
        break;
      case 'rate':
        updateProfile({ weeklyRateKg: rate });
        break;
      case 'activity':
        updateProfile({ activity });
        break;
      case 'diet':
        updateProfile({ diet });
        break;
      case 'language':
        updateSettings({ language });
        break;
      case 'formula':
        updateSettings({ formula });
        break;
    }
    onClose();
  };

  const titles: Record<Field, string> = {
    name: t('profile.name'),
    sex: t('profile.sex'),
    age: t('profile.age'),
    height: t('profile.height'),
    goal: t('profile.goalType'),
    target: t('profile.targetWeight'),
    rate: t('profile.rate'),
    activity: t('profile.activity'),
    diet: t('profile.diet'),
    language: t('profile.language'),
    formula: t('profile.formula'),
  };

  let body = null;
  switch (field) {
    case 'name':
      body = (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('profile.namePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          autoFocus
          maxLength={40}
        />
      );
      break;
    case 'sex':
      body = (['male', 'female'] as const).map((s) => (
        <OptionCard key={s} title={t(`onboarding.sex.${s}`)} selected={sex === s} onPress={() => setSex(s)} />
      ));
      break;
    case 'age':
      body = <BigNumber label={titles.age} value={age} onChange={setAge} min={13} max={100} locale={locale} />;
      break;
    case 'height': {
      const { ft, inch } = cmToFtIn(heightCm);
      body =
        units === 'metric' ? (
          <BigNumber label={titles.height} value={Math.round(heightCm)} onChange={setHeightCm} min={120} max={230} unit="cm" locale={locale} />
        ) : (
          <View style={styles.imperial}>
            <Stepper value={ft} min={4} max={7} format={(v) => `${v} ft`} onChange={(v) => setHeightCm(ftInToCm(v, inch))} />
            <Stepper value={inch} min={0} max={11} format={(v) => `${v} in`} onChange={(v) => setHeightCm(ftInToCm(ft, v))} />
          </View>
        );
      break;
    }
    case 'goal':
      body = GOALS.map((g) => (
        <OptionCard key={g} title={t(`onboarding.goal.${g}`)} selected={goal === g} onPress={() => setGoal(g)} />
      ));
      break;
    case 'target':
      body = (
        <>
          <BigNumber
            label={titles.target}
            value={target}
            onChange={setTarget}
            step={units === 'metric' ? 0.5 : 1}
            decimals={1}
            min={units === 'metric' ? 30 : 66}
            max={units === 'metric' ? 300 : 660}
            unit={weightUnit(units)}
            locale={locale}
          />
          {!targetValid ? (
            <Txt variant="caption" color={colors.danger} center>
              {profile.goal === 'lose' ? t('onboarding.target.loseHint') : t('onboarding.target.gainHint')}
            </Txt>
          ) : null}
        </>
      );
      break;
    case 'rate': {
      const options = units === 'metric' ? [0.25, 0.5, 0.75, 1] : [0.5, 1, 1.5, 2].map(lbToKg);
      body = (
        <View style={styles.chips}>
          {options.map((kg) => (
            <Chip
              key={kg}
              label={`${formatNumber(weightValue(kg, units), locale, 2)} ${weightUnit(units)}`}
              selected={Math.abs(rate - kg) < 0.01}
              onPress={() => setRate(kg)}
            />
          ))}
        </View>
      );
      break;
    }
    case 'activity':
      body = ACTIVITIES.map((a) => (
        <OptionCard
          key={a}
          title={t(`onboarding.activity.${a}`)}
          subtitle={t(`onboarding.activity.${a}Hint`)}
          selected={activity === a}
          onPress={() => setActivity(a)}
        />
      ));
      break;
    case 'diet':
      body = DIETS.map((d) => (
        <OptionCard key={d} title={t(`onboarding.diet.${d}`)} selected={diet === d} onPress={() => setDiet(d)} />
      ));
      break;
    case 'language':
      body = (['system', 'tr', 'en'] as const).map((l) => (
        <OptionCard
          key={l}
          title={l === 'system' ? t('profile.langSystem') : l === 'tr' ? 'Türkçe' : 'English'}
          selected={language === l}
          onPress={() => setLanguage(l)}
        />
      ));
      break;
    case 'formula':
      body = (['mifflin', 'harris'] as const).map((f) => (
        <OptionCard key={f} title={t(`profile.${f}`)} selected={formula === f} onPress={() => setFormula(f)} />
      ));
      break;
  }

  return (
    <Sheet visible onClose={onClose} title={titles[field]}>
      <View style={{ gap: space.sm }}>{body}</View>
      <Button title={t('common.save')} disabled={field === 'target' && !targetValid} onPress={save} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: space.sm, marginTop: space.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { paddingVertical: 0 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
  imperial: { flexDirection: 'row', justifyContent: 'space-around' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
