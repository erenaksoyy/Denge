import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { colors, space } from '@/theme';

import { Icon, type IconName } from './icon';
import { Txt } from './ui';

const ICONS: Record<string, IconName> = {
  index: 'home',
  progress: 'chart',
  fasting: 'fasting',
  coach: 'sparkles',
};

/** Four tabs with a round "+" button in the middle that opens the log menu. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useT();

  const tab = (route: (typeof state.routes)[number], index: number) => {
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        haptic.tap();
        navigateToTab(route.key);
      }
    };
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={onPress}
        style={styles.tab}>
        <Icon name={ICONS[route.name] ?? 'home'} size={22} color={focused ? colors.text : colors.textTertiary} />
        <Txt variant="micro" color={focused ? colors.text : colors.textTertiary}>
          {label}
        </Txt>
      </Pressable>
    );
  };

  const half = Math.ceil(state.routes.length / 2);
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.slice(0, half).map((r, i) => tab(r, i))}
      <View style={styles.addSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.add')}
          onPress={() => {
            haptic.light();
            router.push('/add');
          }}
          style={({ pressed }) => [styles.add, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="add" size={28} color={colors.onPrimary} />
        </Pressable>
      </View>
      {state.routes.slice(half).map((r, i) => tab(r, i + half))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  addSlot: { flex: 1, alignItems: 'center' },
  add: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.bg,
  },
});
