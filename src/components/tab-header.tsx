import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { streakInfo } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, radius, space } from '@/theme';

import { Icon } from './icon';
import { IconButton, Txt } from './ui';

/** Large title used at the top of each tab, with the streak and profile buttons. */
export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { t } = useT();
  const meals = useStore((s) => s.meals);
  const streak = streakInfo(meals).current;
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Txt variant="caption" color={colors.textSecondary}>
            {subtitle}
          </Txt>
        ) : null}
        <Txt variant="largeTitle" numberOfLines={1}>
          {title}
        </Txt>
      </View>
      {right}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={streak > 0 ? t('streak.title', { count: streak }) : t('streak.zero')}
        onPress={() => {
          haptic.tap();
          router.push('/streak');
        }}
        style={({ pressed }) => [styles.streak, pressed && { opacity: 0.7 }]}>
        <Icon name="flame" size={16} color={streak > 0 ? colors.carbs : colors.textTertiary} />
        <Txt variant="callout">{streak}</Txt>
      </Pressable>
      <IconButton icon="person" label={t('profile.title')} onPress={() => router.push('/profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
});
