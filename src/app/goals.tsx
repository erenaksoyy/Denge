import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigNumber } from '@/components/big-number';
import { Button, Card, Header, Screen, Segmented, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { macroPercents } from '@/lib/meal';
import { macroGrams } from '@/lib/nutrition';
import { planGoals, useStore } from '@/store/store';
import { showToast } from '@/store/ui';
import { colors, macroColor, space, type MacroKey } from '@/theme';

/** Rounds each percentage to a multiple of 5 and makes the three add up to 100. */
function normalizeSplit(p: Record<MacroKey, number>): Record<MacroKey, number> {
  const r = (v: number) => Math.max(0, Math.round(v / 5) * 5);
  const protein = r(p.protein);
  const fat = r(p.fat);
  return { protein, fat, carbs: Math.max(0, 100 - protein - fat) };
}

export default function GoalsScreen() {
  const { t, locale } = useT();
  const goals = useStore((s) => s.goals);
  const settings = useStore((s) => s.settings);
  const profile = useStore((s) => s.profile);
  const setCustomGoals = useStore((s) => s.setCustomGoals);
  const resetToAutoGoals = useStore((s) => s.resetToAutoGoals);

  const [mode, setMode] = useState(settings.goalsMode);
  const [calories, setCalories] = useState(goals.calories);
  const [split, setSplit] = useState(() =>
    normalizeSplit(macroPercents({ calories: goals.calories, protein: goals.proteinG, carbs: goals.carbsG, fat: goals.fatG })),
  );

  const auto = profile ? planGoals(profile, settings.formula) : goals;
  const sum = split.protein + split.carbs + split.fat;
  const grams = macroGrams(calories, split);
  const labels: Record<MacroKey, string> = {
    protein: t('common.protein'),
    carbs: t('common.carbsLong'),
    fat: t('common.fat'),
  };

  const save = () => {
    if (mode === 'auto') resetToAutoGoals();
    else setCustomGoals({ calories, proteinG: grams.protein, carbsG: grams.carbs, fatG: grams.fat });
    haptic.success();
    showToast(t('goals.saved'));
    router.back();
  };

  return (
    <Screen
      header={<Header title={t('goals.title')} />}
      footer={<Button title={t('common.save')} disabled={mode === 'custom' && sum !== 100} onPress={save} />}>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'auto', label: t('goals.auto') },
          { value: 'custom', label: t('goals.custom') },
        ]}
      />
      <Txt variant="callout" color={colors.textSecondary} style={{ marginVertical: space.md }}>
        {mode === 'auto' ? t('goals.autoText') : t('goals.customText')}
      </Txt>

      {mode === 'auto' ? (
        <View style={{ gap: space.sm }}>
          <Card style={styles.row}>
            <Txt variant="headline" style={{ flex: 1 }}>
              {t('goals.calories')}
            </Txt>
            <Txt variant="title">
              {auto.calories.toLocaleString(locale)} {t('common.kcal')}
            </Txt>
          </Card>
          {(['protein', 'carbs', 'fat'] as const).map((key) => (
            <Card key={key} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: macroColor[key].main }]} />
              <Txt variant="headline" style={{ flex: 1 }}>
                {labels[key]}
              </Txt>
              <Txt variant="headline">
                {key === 'protein' ? auto.proteinG : key === 'carbs' ? auto.carbsG : auto.fatG} g
              </Txt>
            </Card>
          ))}
        </View>
      ) : (
        <View style={{ gap: space.md }}>
          <Card style={{ gap: space.md }}>
            <Txt variant="headline">{t('goals.calories')}</Txt>
            <BigNumber
              label={t('goals.calories')}
              value={calories}
              onChange={setCalories}
              step={50}
              min={1000}
              max={6000}
              unit={t('common.kcal')}
              locale={locale}
            />
          </Card>
          <Card style={{ gap: space.md }}>
            <Txt variant="headline">{t('goals.split')}</Txt>
            {(['protein', 'carbs', 'fat'] as const).map((key) => (
              <View key={key} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: macroColor[key].main }]} />
                <View style={{ flex: 1 }}>
                  <Txt variant="callout">{labels[key]}</Txt>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {grams[key]} g
                  </Txt>
                </View>
                <Stepper
                  value={split[key]}
                  step={5}
                  min={0}
                  max={100}
                  format={(v) => `%${v}`}
                  onChange={(v) => setSplit({ ...split, [key]: v })}
                />
              </View>
            ))}
            <Txt variant="callout" color={sum === 100 ? colors.textSecondary : colors.danger}>
              {sum === 100 ? t('goals.sum', { sum }) : t('goals.sumError')}
            </Txt>
          </Card>
          <Button
            title={t('goals.recalc')}
            variant="secondary"
            icon="refresh"
            onPress={() => {
              setCalories(auto.calories);
              setSplit(
                normalizeSplit(macroPercents({ calories: auto.calories, protein: auto.proteinG, carbs: auto.carbsG, fat: auto.fatG })),
              );
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
