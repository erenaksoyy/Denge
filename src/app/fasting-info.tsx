import { View } from 'react-native';

import { Card, Header, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { colors, space } from '@/theme';

const SECTIONS = ['p1', 'p2', 'p3', 'p4'] as const;

export default function FastingInfo() {
  const { t } = useT();
  return (
    <Screen topInset={false} header={<Header close title={t('fasting.infoTitle')} />}>
      <View style={{ gap: space.md }}>
        {SECTIONS.map((key) => (
          <Card key={key} style={{ gap: space.sm }}>
            <Txt variant="headline">{t(`fasting.info.${key}Title`)}</Txt>
            <Txt variant="body" color={colors.textSecondary}>
              {t(`fasting.info.${key}`)}
            </Txt>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
