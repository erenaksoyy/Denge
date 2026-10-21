import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, Card, Chip, Header, OptionCard, Screen, Segmented, SectionTitle, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { api } from '@/lib/api';
import { goHome, notify } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { uid } from '@/lib/meal';
import { exerciseCalories, MET, type ExerciseKind, type Intensity } from '@/lib/nutrition';
import type { ExerciseEstimate } from '@/lib/types';
import { formatWeight } from '@/lib/units';
import { toMealError } from '@/store/analysis';
import { useStore } from '@/store/store';
import { showToast, useUi } from '@/store/ui';
import { colors, radius, space } from '@/theme';

const KINDS: { kind: ExerciseKind; icon: IconName }[] = [
  { kind: 'run', icon: 'run' },
  { kind: 'walk', icon: 'walk' },
  { kind: 'cycle', icon: 'cycle' },
  { kind: 'swim', icon: 'swim' },
  { kind: 'weights', icon: 'weights' },
  { kind: 'hiit', icon: 'hiit' },
];
const INTENSITIES: Intensity[] = ['low', 'medium', 'high'];
const DURATIONS = [15, 30, 45, 60, 90];

export default function ExerciseScreen() {
  const { t, lang, locale } = useT();
  const profile = useStore((s) => s.profile);
  const units = useStore((s) => s.settings.units);
  const addExercise = useStore((s) => s.addExercise);
  const selectedDay = useUi((s) => s.selectedDay);

  const [mode, setMode] = useState<'preset' | 'describe'>('preset');
  const [kind, setKind] = useState<ExerciseKind>('run');
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const [minutes, setMinutes] = useState(30);
  const [text, setText] = useState('');
  const [estimate, setEstimate] = useState<ExerciseEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const weightKg = profile?.weightKg ?? 70;
  const presetCalories = exerciseCalories(MET[kind][intensity], weightKg, minutes);

  const save = (entry: { kind: ExerciseKind | 'custom'; name: string; intensity: Intensity; minutes: number; calories: number; source: 'preset' | 'ai' }) => {
    addExercise({ id: uid(), day: selectedDay, createdAt: new Date().toISOString(), ...entry });
    haptic.success();
    showToast(t('exercise.added'));
    goHome();
  };

  const calculate = async () => {
    if (!profile) return;
    setLoading(true);
    setEstimate(null);
    try {
      const result = await api.analyzeExercise({
        description: text.trim(),
        sex: profile.sex,
        age: profile.age,
        weightKg: profile.weightKg,
        lang,
      });
      if (!result.isExercise || result.calories <= 0) notify(t('exercise.notExercise'));
      else setEstimate(result);
    } catch (error) {
      notify(t(`errors.${toMealError(error)}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      topInset={false}
      header={<Header close title={t('exercise.title')} />}
      footer={
        mode === 'preset' ? (
          <Button
            title={t('exercise.add')}
            onPress={() =>
              save({ kind, name: t(`exercise.${kind}`), intensity, minutes, calories: presetCalories, source: 'preset' })
            }
          />
        ) : estimate ? (
          <Button
            title={t('exercise.add')}
            onPress={() =>
              save({
                kind: 'custom',
                name: estimate.name,
                intensity: estimate.intensity,
                minutes: estimate.minutes,
                calories: estimate.calories,
                source: 'ai',
              })
            }
          />
        ) : (
          <Button
            title={loading ? t('exercise.calculating') : t('exercise.calculate')}
            icon="sparkles"
            loading={loading}
            disabled={text.trim().length < 3}
            onPress={calculate}
          />
        )
      }>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'preset', label: t('exercise.preset') },
          { value: 'describe', label: t('exercise.describe') },
        ]}
      />

      {mode === 'preset' ? (
        <>
          <View style={styles.grid}>
            {KINDS.map((k) => {
              const selected = k.kind === kind;
              return (
                <Pressable
                  key={k.kind}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    haptic.tap();
                    setKind(k.kind);
                  }}
                  style={[styles.kind, selected && styles.kindSelected]}>
                  <Icon name={k.icon} size={26} color={selected ? colors.onPrimary : colors.protein} />
                  <Txt variant="callout" color={selected ? colors.onPrimary : colors.text}>
                    {t(`exercise.${k.kind}`)}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          <SectionTitle>{t('exercise.intensity')}</SectionTitle>
          <View style={{ gap: space.sm }}>
            {INTENSITIES.map((i) => (
              <OptionCard
                key={i}
                title={t(`exercise.${i}`)}
                subtitle={t(`exercise.${i}Hint`)}
                selected={intensity === i}
                onPress={() => setIntensity(i)}
              />
            ))}
          </View>

          <SectionTitle>{t('exercise.duration')}</SectionTitle>
          <View style={styles.chips}>
            {DURATIONS.map((d) => (
              <Chip key={d} label={`${d} ${t('common.min')}`} selected={minutes === d} onPress={() => setMinutes(d)} />
            ))}
          </View>
          <Card style={styles.durationCard}>
            <Txt variant="headline" style={{ flex: 1 }}>
              {t('exercise.duration')}
            </Txt>
            <Stepper
              value={minutes}
              step={5}
              min={5}
              max={600}
              format={(v) => `${v} ${t('common.min')}`}
              onChange={setMinutes}
            />
          </Card>

          <Card style={styles.estimate}>
            <Icon name="flame" size={22} color={colors.protein} />
            <View style={{ flex: 1 }}>
              <Txt variant="title">{t('exercise.estimate', { kcal: presetCalories })}</Txt>
              <Txt variant="caption" color={colors.textSecondary}>
                {t('exercise.basedOnWeight', { weight: formatWeight(weightKg, units, locale) })}
              </Txt>
            </View>
          </Card>
        </>
      ) : (
        <View style={{ gap: space.lg, marginTop: space.lg }}>
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              setEstimate(null);
            }}
            placeholder={t('exercise.describePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
            style={styles.textArea}
            accessibilityLabel={t('exercise.describe')}
          />
          {estimate ? (
            <Card style={{ gap: space.md }}>
              <View style={styles.resultHeader}>
                <Icon name="sparkles" size={18} color={colors.fasting} />
                <Txt variant="caption" color={colors.textSecondary}>
                  {t('exercise.result')}
                </Txt>
              </View>
              <Txt variant="title">{estimate.name}</Txt>
              <Txt variant="callout" color={colors.textSecondary}>
                {estimate.minutes} {t('common.min')} · {t(`exercise.${estimate.intensity}`)}
              </Txt>
              <View style={styles.resultRow}>
                <Txt variant="headline" style={{ flex: 1 }}>
                  {t('common.kcal')}
                </Txt>
                <Stepper
                  value={estimate.calories}
                  step={10}
                  min={0}
                  max={5000}
                  onChange={(calories) => setEstimate({ ...estimate, calories })}
                />
              </View>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  kind: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  kindSelected: { backgroundColor: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  durationCard: { flexDirection: 'row', alignItems: 'center' },
  estimate: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  textArea: {
    minHeight: 140,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
});
