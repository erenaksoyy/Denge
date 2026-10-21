import { Pressable, StyleSheet, View } from 'react-native';

import { MealThumb } from '@/components/log-rows';
import { MacroLine } from '@/components/nutrition';
import { EmptyState, Header, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { confirmDialog, goHome } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { mealNutrients, uid } from '@/lib/meal';
import type { SavedFood } from '@/lib/types';
import { useStore } from '@/store/store';
import { showToast, useUi } from '@/store/ui';
import { colors, radius, shadow, space } from '@/theme';

export default function SavedFoods() {
  const { t } = useT();
  const saved = useStore((s) => s.saved);
  const addMeal = useStore((s) => s.addMeal);
  const removeSaved = useStore((s) => s.removeSaved);
  const selectedDay = useUi((s) => s.selectedDay);

  const log = (food: SavedFood) => {
    addMeal({
      id: uid(),
      day: selectedDay,
      createdAt: new Date().toISOString(),
      source: 'saved',
      status: 'done',
      name: food.name,
      servings: food.servings,
      imageUri: food.imageUri,
      healthScore: food.healthScore,
      ingredients: food.ingredients.map((i) => ({ ...i, id: uid() })),
    });
    haptic.success();
    showToast(t('saved.added', { name: food.name }));
    goHome();
  };

  const remove = async (food: SavedFood) => {
    const ok = await confirmDialog({
      title: t('saved.removeTitle'),
      message: food.name,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) removeSaved(food.id);
  };

  return (
    <Screen topInset={false} header={<Header close title={t('saved.title')} />}>
      {saved.length === 0 ? (
        <EmptyState icon="bookmark" title={t('saved.emptyTitle')} text={t('saved.emptyText')} />
      ) : (
        <View style={{ gap: space.sm }}>
          <Txt variant="caption" color={colors.textSecondary}>
            {t('saved.hint')}
          </Txt>
          {saved.map((food) => {
            const totals = mealNutrients(food);
            return (
              <Pressable
                key={food.id}
                accessibilityRole="button"
                accessibilityLabel={food.name}
                onPress={() => log(food)}
                onLongPress={() => void remove(food)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                <MealThumb uri={food.imageUri} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt variant="headline" numberOfLines={1}>
                    {food.name}
                  </Txt>
                  <Txt variant="callout">
                    {totals.calories} {t('common.kcal')}
                  </Txt>
                  <MacroLine value={totals} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow,
  },
});
