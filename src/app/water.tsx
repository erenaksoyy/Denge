import { StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/charts';
import { Icon } from '@/components/icon';
import { Ring } from '@/components/ring';
import { Card, Header, IconButton, Screen, SectionTitle, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { addDays, dayKey, startOfWeek, weekdayShort } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { flOzToMl, formatVolume, volumeUnit, volumeValue } from '@/lib/units';
import { useStore } from '@/store/store';
import { useUi } from '@/store/ui';
import { colors, space } from '@/theme';

export default function WaterScreen() {
  const { t, locale } = useT();
  const water = useStore((s) => s.water);
  const settings = useStore((s) => s.settings);
  const addWater = useStore((s) => s.addWater);
  const updateSettings = useStore((s) => s.updateSettings);
  const selectedDay = useUi((s) => s.selectedDay);

  const ml = water[selectedDay] ?? 0;
  const { units, waterGoalMl, glassMl } = settings;
  const imperial = units === 'imperial';
  const reached = ml >= waterGoalMl;

  const monday = startOfWeek(new Date());
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = dayKey(date);
    return { label: weekdayShort(date, locale).slice(0, 2), value: water[key] ?? 0, highlight: key === selectedDay };
  });

  const change = (delta: number) => {
    haptic.light();
    addWater(selectedDay, delta);
  };

  return (
    <Screen topInset={false} header={<Header close title={t('water.title')} />}>
      <View style={styles.hero}>
        <Ring size={220} stroke={18} progress={ml / waterGoalMl} color={colors.water} track={colors.waterSoft}>
          <Icon name="water" size={30} color={colors.water} />
          <Txt variant="number">{volumeValue(ml, units).toLocaleString(locale)}</Txt>
          <Txt variant="caption" color={colors.textSecondary}>
            {t('water.of', { goal: formatVolume(waterGoalMl, units, locale) })}
          </Txt>
        </Ring>
        {reached ? (
          <Txt variant="callout" color={colors.water}>
            {t('water.reached')}
          </Txt>
        ) : null}
        <View style={styles.buttons}>
          <IconButton icon="minus" label={t('water.removeGlass')} size={56} onPress={() => change(-glassMl)} disabled={ml <= 0} />
          <View style={styles.glass}>
            <Txt variant="headline">{formatVolume(glassMl, units, locale)}</Txt>
            <Txt variant="micro" color={colors.textTertiary}>
              {t('water.glass').toLocaleUpperCase(locale)}
            </Txt>
          </View>
          <IconButton
            icon="add"
            label={t('water.addGlass')}
            size={56}
            background={colors.water}
            color={colors.onPrimary}
            onPress={() => change(glassMl)}
          />
        </View>
      </View>

      <Card style={{ gap: space.md }}>
        <View style={styles.row}>
          <Txt variant="headline" style={{ flex: 1 }}>
            {t('water.goal')}
          </Txt>
          <Stepper
            value={volumeValue(waterGoalMl, units)}
            step={imperial ? 8 : 250}
            min={imperial ? 32 : 1000}
            max={imperial ? 200 : 6000}
            format={(v) => `${v.toLocaleString(locale)} ${volumeUnit(units)}`}
            onChange={(v) => updateSettings({ waterGoalMl: Math.round(imperial ? flOzToMl(v) : v) })}
          />
        </View>
        <View style={styles.row}>
          <Txt variant="headline" style={{ flex: 1 }}>
            {t('water.glass')}
          </Txt>
          <Stepper
            value={volumeValue(glassMl, units)}
            step={imperial ? 2 : 50}
            min={imperial ? 4 : 100}
            max={imperial ? 34 : 1000}
            format={(v) => `${v.toLocaleString(locale)} ${volumeUnit(units)}`}
            onChange={(v) => updateSettings({ glassMl: Math.round(imperial ? flOzToMl(v) : v) })}
          />
        </View>
      </Card>

      <SectionTitle>{t('water.week')}</SectionTitle>
      <Card>
        <BarChart data={week} goal={waterGoalMl} color={colors.water} overColor={colors.water} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.lg, marginVertical: space.xl },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  glass: { alignItems: 'center', minWidth: 90 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
