import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Header, OptionCard, Screen, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import type { FastPlanId } from '@/lib/types';
import { FAST_PLAN_HOURS, useStore } from '@/store/store';
import { colors, space } from '@/theme';

const PLANS: { id: FastPlanId; title: string; text: string }[] = [
  { id: 'circadian', title: 'fasting.plans.circadian', text: 'fasting.plans.circadianText' },
  { id: '16_8', title: 'fasting.plans.p16_8', text: 'fasting.plans.p16_8Text' },
  { id: '18_6', title: 'fasting.plans.p18_6', text: 'fasting.plans.p18_6Text' },
  { id: '20_4', title: 'fasting.plans.p20_4', text: 'fasting.plans.p20_4Text' },
  { id: '36h', title: 'fasting.plans.p36h', text: 'fasting.plans.p36hText' },
  { id: 'custom', title: 'fasting.plans.custom', text: 'fasting.plans.customText' },
];

export default function FastingPlans() {
  const { t } = useT();
  const fasting = useStore((s) => s.fasting);
  const setFastPlan = useStore((s) => s.setFastPlan);
  const [planId, setPlanId] = useState<FastPlanId>(fasting.planId);
  const [hours, setHours] = useState(fasting.customHours);

  return (
    <Screen
      topInset={false}
      header={<Header close title={t('fasting.choosePlan')} />}
      footer={
        <Button
          title={t('common.save')}
          onPress={() => {
            setFastPlan(planId, hours);
            haptic.success();
            router.back();
          }}
        />
      }>
      <View style={{ gap: space.sm }}>
        {PLANS.map((p) => (
          <OptionCard
            key={p.id}
            title={`${t(p.title as 'fasting.plans.p16_8')}${p.id !== 'custom' ? ` · ${FAST_PLAN_HOURS[p.id]} ${t('common.hours')}` : ''}`}
            subtitle={t(p.text as 'fasting.plans.p16_8Text')}
            selected={planId === p.id}
            onPress={() => setPlanId(p.id)}
          />
        ))}
      </View>
      {planId === 'custom' ? (
        <Card style={styles.custom}>
          <Txt variant="headline" style={{ flex: 1 }}>
            {t('fasting.customHours')}
          </Txt>
          <Stepper value={hours} min={10} max={48} onChange={setHours} format={(v) => `${v} ${t('common.hours')}`} />
        </Card>
      ) : null}
      <Txt variant="caption" color={colors.textTertiary} style={{ marginTop: space.lg }}>
        {t('fasting.info.p4')}
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  custom: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
});
