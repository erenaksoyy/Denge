import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { useOnboarding } from '@/store/onboarding';
import { colors, radius, space } from '@/theme';

const FEATURES: { icon: IconName; key: 'feature1' | 'feature2' | 'feature3' | 'feature4'; color: string }[] = [
  { icon: 'camera', key: 'feature1', color: colors.brand },
  { icon: 'barcode', key: 'feature2', color: colors.fat },
  { icon: 'water', key: 'feature3', color: colors.water },
  { icon: 'sparkles', key: 'feature4', color: colors.fasting },
];

export default function Welcome() {
  const { t } = useT();
  const reset = useOnboarding((s) => s.reset);

  return (
    <Screen
      footer={
        <>
          <Button
            title={t('onboarding.welcome.start')}
            onPress={() => {
              reset();
              router.push('/onboarding/steps');
            }}
          />
          <Txt variant="caption" color={colors.textTertiary} center>
            {t('onboarding.welcome.privacy')}
          </Txt>
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Txt variant="largeTitle" color={colors.onPrimary}>
            D
          </Txt>
        </View>
        <Txt variant="micro" color={colors.textSecondary} style={{ letterSpacing: 2 }}>
          DENGE
        </Txt>
        <Txt variant="largeTitle" style={styles.title}>
          {t('onboarding.welcome.title')}
        </Txt>
        <Txt variant="body" color={colors.textSecondary}>
          {t('onboarding.welcome.subtitle')}
        </Txt>
      </View>
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.key} style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: `${f.color}1F` }]}>
              <Icon name={f.icon} size={20} color={f.color} />
            </View>
            <Txt variant="callout" style={{ flex: 1 }}>
              {t(`onboarding.welcome.${f.key}`)}
            </Txt>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.md, marginTop: space.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 36, lineHeight: 42 },
  features: { marginTop: space.xxl, gap: space.sm },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
