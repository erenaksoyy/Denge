import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { useT } from '@/i18n';
import { addDays, dayKey, longDate, parseDay, weekdayShort } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { colors, radius, space } from '@/theme';

import { Ring } from './ring';
import { Txt } from './ui';

const DAYS = 28;
const ITEM_WIDTH = 46;

/** The last four weeks, ending today. Each day shows its calorie progress. */
export function DateStrip({
  selected,
  onSelect,
  progressFor,
}: {
  selected: string;
  onSelect: (day: string) => void;
  progressFor: (day: string) => { value: number; over: boolean } | null;
}) {
  const { locale } = useT();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const today = dayKey();
  const days = Array.from({ length: DAYS }, (_, i) => dayKey(addDays(parseDay(today), i - DAYS + 1)));

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {days.map((day) => {
        const date = parseDay(day);
        const isSelected = day === selected;
        const progress = progressFor(day);
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={longDate(date, locale)}
            onPress={() => {
              haptic.tap();
              onSelect(day);
            }}
            style={[styles.item, isSelected && styles.itemSelected]}>
            <Txt variant="micro" color={isSelected ? colors.onPrimary : colors.textSecondary}>
              {weekdayShort(date, locale).replace('.', '').slice(0, 3).toLocaleUpperCase(locale)}
            </Txt>
            <Ring
              size={30}
              stroke={2.5}
              progress={progress?.value ?? 0}
              color={progress?.over ? colors.danger : isSelected ? colors.onPrimary : colors.brand}
              track={isSelected ? 'rgba(255,255,255,0.25)' : colors.border}>
              <Txt variant="caption" color={isSelected ? colors.onPrimary : colors.text}>
                {date.getDate()}
              </Txt>
            </Ring>
            <View style={[styles.dot, day === today && { backgroundColor: isSelected ? colors.onPrimary : colors.text }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: 6 },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: radius.md,
  },
  itemSelected: { backgroundColor: colors.primary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
});
