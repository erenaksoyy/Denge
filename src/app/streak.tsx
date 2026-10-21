import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { addDays, dayKey, startOfWeek, weekdayShort } from '@/lib/dates';
import { streakInfo } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, space } from '@/theme';

export default function StreakSheet() {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const meals = useStore((s) => s.meals);
  const { current, best, loggedDays } = streakInfo(meals);
  const monday = startOfWeek(new Date());
  const today = dayKey();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.flame}>
        <Icon name="flame" size={44} color={current > 0 ? colors.carbs : colors.textTertiary} />
      </View>
      <Txt variant="title" center>
        {current > 0 ? t('streak.title', { count: current }) : t('streak.zero')}
      </Txt>
      <Txt variant="callout" color={colors.textSecondary} center>
        {current > 0 ? t('streak.message') : t('streak.zeroMessage')}
      </Txt>
      <View style={styles.week}>
        {Array.from({ length: 7 }, (_, i) => {
          const date = addDays(monday, i);
          const key = dayKey(date);
          const logged = loggedDays.has(key);
          return (
            <View key={key} style={styles.day}>
              <Txt variant="micro" color={key === today ? colors.text : colors.textTertiary}>
                {weekdayShort(date, locale).slice(0, 2)}
              </Txt>
              <View style={[styles.dot, logged && { backgroundColor: colors.carbs, borderColor: colors.carbs }]}>
                {logged ? <Icon name="flame" size={14} color={colors.onPrimary} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      {best > 0 ? (
        <Txt variant="caption" color={colors.textTertiary} center>
          {t('streak.best', { count: best })}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space.xl, paddingTop: space.xxl, gap: space.md, alignItems: 'center' },
  flame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.carbsSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: space.lg },
  day: { alignItems: 'center', gap: 6 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
