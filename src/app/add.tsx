import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { dayKey, longDate, parseDay } from '@/lib/dates';
import { notify } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { PermissionDeniedError, pickPhoto } from '@/lib/images';
import { startPhotoAnalysis } from '@/store/analysis';
import { useUi } from '@/store/ui';
import { colors, radius, shadow, space } from '@/theme';

type Action = {
  key: string;
  icon: IconName;
  title: string;
  hint: string;
  color: string;
  run: () => void | Promise<void>;
};

export default function AddSheet() {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const selectedDay = useUi((s) => s.selectedDay);
  const [busy, setBusy] = useState<string | null>(null);

  const photo = (source: 'camera' | 'library', mode: 'meal' | 'label') => async () => {
    try {
      setBusy(`${source}-${mode}`);
      const image = await pickPhoto(source);
      if (!image) return;
      startPhotoAnalysis(image, mode, selectedDay);
      haptic.success();
      router.back();
    } catch (error) {
      if (error instanceof PermissionDeniedError) notify(t('errors.cameraDenied'));
      else notify(t('errors.unknown'));
    } finally {
      setBusy(null);
    }
  };

  const go = (href: Href) => () => router.replace(href);

  const primary: Action[] = [
    { key: 'camera-meal', icon: 'camera', title: t('add.scan'), hint: t('add.scanHint'), color: colors.brand, run: photo('camera', 'meal') },
    { key: 'library-meal', icon: 'gallery', title: t('add.gallery'), hint: t('add.galleryHint'), color: colors.fasting, run: photo('library', 'meal') },
  ];
  const actions: Action[] = [
    { key: 'search', icon: 'search', title: t('add.search'), hint: t('add.searchHint'), color: colors.text, run: go('/search') },
    { key: 'barcode', icon: 'barcode', title: t('add.barcode'), hint: t('add.barcodeHint'), color: colors.fat, run: go('/barcode') },
    { key: 'camera-label', icon: 'label', title: t('add.label'), hint: t('add.labelHint'), color: colors.carbs, run: photo('camera', 'label') },
    { key: 'saved', icon: 'bookmarkFill', title: t('add.saved'), hint: t('add.savedHint'), color: colors.carbs, run: go('/saved') },
    { key: 'exercise', icon: 'run', title: t('add.exercise'), hint: t('add.exerciseHint'), color: colors.protein, run: go('/exercise') },
    { key: 'water', icon: 'water', title: t('add.water'), hint: t('add.waterHint'), color: colors.water, run: go('/water') },
    { key: 'weight', icon: 'scale', title: t('add.weight'), hint: t('add.weightHint'), color: colors.brand, run: go('/weight') },
    { key: 'recipes', icon: 'recipe', title: t('add.recipes'), hint: t('add.recipesHint'), color: colors.fasting, run: go('/recipes') },
    { key: 'manual', icon: 'manual', title: t('add.manual'), hint: t('add.manualHint'), color: colors.textSecondary, run: go('/manual') },
  ];

  const tile = (a: Action, big = false) => (
    <Pressable
      key={a.key}
      accessibilityRole="button"
      accessibilityLabel={a.title}
      disabled={busy !== null}
      onPress={() => {
        haptic.tap();
        void a.run();
      }}
      style={({ pressed }) => [styles.tile, big && styles.bigTile, pressed && { opacity: 0.7 }]}>
      <View style={[styles.tileIcon, { backgroundColor: `${a.color}1A` }, big && styles.bigIcon]}>
        {busy === a.key ? <ActivityIndicator color={a.color} /> : <Icon name={a.icon} size={big ? 26 : 20} color={a.color} />}
      </View>
      <Txt variant={big ? 'headline' : 'callout'} numberOfLines={1}>
        {a.title}
      </Txt>
      <Txt variant="caption" color={colors.textTertiary} numberOfLines={1}>
        {a.hint}
      </Txt>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}>
      <Txt variant="title">{t('add.title')}</Txt>
      {selectedDay !== dayKey() ? (
        <Txt variant="callout" color={colors.textSecondary}>
          {t('add.forDay', { day: longDate(parseDay(selectedDay), locale) })}
        </Txt>
      ) : null}
      <View style={styles.primaryRow}>{primary.map((a) => tile(a, true))}</View>
      <View style={styles.grid}>{actions.map((a) => tile(a))}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingTop: space.xl, gap: space.md },
  primaryRow: { flexDirection: 'row', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 4,
    ...shadow,
  },
  bigTile: { flexBasis: '45%', padding: space.lg },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  bigIcon: { width: 48, height: 48, borderRadius: 14 },
});
