import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BigNumber } from '@/components/big-number';
import { Button, Card, Header, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { formatWeight, weightFromValue, weightUnit, weightValue } from '@/lib/units';
import { useStore } from '@/store/store';
import { showToast } from '@/store/ui';
import { colors, space } from '@/theme';

export default function WeightScreen() {
  const { t, locale } = useT();
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const units = useStore((s) => s.settings.units);
  const logWeight = useStore((s) => s.logWeight);
  const [value, setValue] = useState(() => weightValue(profile?.weightKg ?? 70, units));
  const last = weights[weights.length - 1];

  return (
    <Screen
      topInset={false}
      header={<Header close title={t('weight.title')} />}
      footer={
        <Button
          title={t('weight.save')}
          onPress={() => {
            logWeight(Math.round(weightFromValue(value, units) * 10) / 10);
            haptic.success();
            showToast(t('weight.updated'));
            router.back();
          }}
        />
      }>
      <View style={{ marginTop: space.xxl, gap: space.xl }}>
        <BigNumber
          label={t('weight.title')}
          value={value}
          onChange={setValue}
          step={units === 'metric' ? 0.1 : 0.2}
          decimals={1}
          min={units === 'metric' ? 30 : 66}
          max={units === 'metric' ? 300 : 660}
          unit={weightUnit(units)}
          locale={locale}
        />
        {last ? (
          <Txt variant="callout" color={colors.textSecondary} center>
            {t('weight.lastEntry', { value: formatWeight(last.kg, units, locale) })}
          </Txt>
        ) : null}
        <Card>
          <Txt variant="caption" color={colors.textSecondary}>
            {t('weight.autoUpdate')}
          </Txt>
        </Card>
      </View>
    </Screen>
  );
}
