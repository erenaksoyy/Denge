import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigNumber } from '@/components/big-number';
import { NutrientTiles } from '@/components/nutrition';
import { Button, Card, EmptyState, Header, Screen, Segmented, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { goHome } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { ingredientFromFood, roundNutrients, scaleNutrients, uid } from '@/lib/meal';
import { formatNumber } from '@/lib/units';
import { useStore } from '@/store/store';
import { showToast, useUi } from '@/store/ui';
import { colors, radius, space } from '@/theme';

export default function FoodEntry() {
  const { t, locale } = useT();
  const pending = useUi((s) => s.pendingFood);
  const selectedDay = useUi((s) => s.selectedDay);
  const addMeal = useStore((s) => s.addMeal);
  const updateMeal = useStore((s) => s.updateMeal);

  const servingG = pending?.food.servingG;
  const [unit, setUnit] = useState<'grams' | 'serving'>(servingG ? 'serving' : 'grams');
  const [grams, setGrams] = useState(servingG ?? 100);
  const [servings, setServings] = useState(1);

  if (!pending) {
    return (
      <Screen topInset={false} header={<Header close />}>
        <EmptyState icon="search" title={t('search.noResults')} />
      </Screen>
    );
  }

  const { food, addToMealId } = pending;
  const amount = unit === 'serving' && servingG ? servingG * servings : grams;
  const totals = roundNutrients(scaleNutrients(food.per100, amount / 100));

  const save = () => {
    const ingredient = ingredientFromFood(food, amount);
    haptic.success();
    if (addToMealId) {
      const meal = useStore.getState().meals.find((m) => m.id === addToMealId);
      if (meal) updateMeal(addToMealId, { ingredients: [...meal.ingredients, ingredient] });
      router.dismissTo({ pathname: '/meal/[id]', params: { id: addToMealId } });
      return;
    }
    addMeal({
      id: uid(),
      day: selectedDay,
      createdAt: new Date().toISOString(),
      source: pending.source,
      status: 'done',
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      servings: 1,
      imageUri: food.imageUrl ?? null,
      healthScore: null,
      ingredients: [ingredient],
    });
    showToast(t('saved.added', { name: food.name }));
    goHome();
  };

  return (
    <Screen
      topInset={false}
      header={<Header title={t('entry.title')} />}
      footer={<Button title={addToMealId ? t('entry.addToMeal') : t('entry.addToLog')} icon="add" onPress={save} />}>
      <View style={styles.titleRow}>
        {food.imageUrl ? <Image source={{ uri: food.imageUrl }} style={styles.image} contentFit="cover" /> : null}
        <View style={{ flex: 1 }}>
          <Txt variant="title">{food.name}</Txt>
          {food.brand ? (
            <Txt variant="callout" color={colors.textSecondary}>
              {food.brand}
            </Txt>
          ) : null}
        </View>
      </View>

      {servingG ? (
        <Segmented
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'serving', label: t('entry.serving') },
            { value: 'grams', label: t('entry.grams') },
          ]}
          style={{ marginBottom: space.lg }}
        />
      ) : null}

      <Card style={{ gap: space.md, marginBottom: space.lg }}>
        {unit === 'serving' && servingG ? (
          <>
            <View style={styles.servingRow}>
              <Txt variant="headline" style={{ flex: 1 }}>
                {food.servingLabel ?? t('entry.serving')}
              </Txt>
              <Stepper
                value={servings}
                step={0.5}
                min={0.5}
                max={20}
                format={(v) => `${formatNumber(v, locale, 1)} ×`}
                onChange={setServings}
              />
            </View>
            <Txt variant="caption" color={colors.textSecondary}>
              {t('entry.servingOf', { grams: Math.round(servingG) })} · {t('entry.total')}: {Math.round(amount)} g
            </Txt>
          </>
        ) : (
          <BigNumber label={t('entry.grams')} value={grams} onChange={setGrams} step={10} min={1} max={3000} unit="g" locale={locale} />
        )}
      </Card>

      <NutrientTiles value={totals} />

      <Txt variant="caption" color={colors.textTertiary} style={{ marginTop: space.lg }}>
        {t('entry.per100')}: {food.per100.calories} {t('common.kcal')} · {t('common.protein')}{' '}
        {formatNumber(food.per100.protein, locale, 1)} g · {t('common.carbs')} {formatNumber(food.per100.carbs, locale, 1)} g ·{' '}
        {t('common.fat')} {formatNumber(food.per100.fat, locale, 1)} g
      </Txt>
      {food.source === 'off' ? (
        <Txt variant="micro" color={colors.textTertiary} style={{ marginTop: space.sm }}>
          {t('search.offCredit')}
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  image: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.cardMuted },
  servingRow: { flexDirection: 'row', alignItems: 'center' },
});
