import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NutrientTiles } from '@/components/nutrition';
import { Button, Card, Divider, EmptyState, Header, Screen, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { goHome } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { mealNutrients, uid } from '@/lib/meal';
import { RECIPES, recipeIngredients } from '@/lib/recipes-data';
import { formatNumber } from '@/lib/units';
import { useStore } from '@/store/store';
import { showToast, useUi } from '@/store/ui';
import { colors, radius, space } from '@/theme';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, locale } = useT();
  const addMeal = useStore((s) => s.addMeal);
  const selectedDay = useUi((s) => s.selectedDay);
  const [servings, setServings] = useState(1);
  const recipe = RECIPES.find((r) => r.id === id);

  if (!recipe) {
    return (
      <Screen header={<Header />}>
        <EmptyState icon="recipe" title={t('recipes.empty')} />
      </Screen>
    );
  }

  const ingredients = recipeIngredients(recipe, servings, lang);
  const totals = mealNutrients({ ingredients, servings: 1 });
  const text = recipe[lang];

  const log = () => {
    addMeal({
      id: uid(),
      day: selectedDay,
      createdAt: new Date().toISOString(),
      source: 'recipe',
      status: 'done',
      name: text.name,
      servings: 1,
      imageUri: null,
      healthScore: null,
      ingredients,
    });
    haptic.success();
    showToast(t('recipes.logged'));
    goHome();
  };

  return (
    <Screen header={<Header />} footer={<Button title={t('recipes.log')} icon="add" onPress={log} />}>
      <View style={[styles.cover, { backgroundColor: recipe.tint }]}>
        <Txt style={styles.emoji}>{recipe.emoji}</Txt>
      </View>
      <Txt variant="title" style={{ marginTop: space.lg }}>
        {text.name}
      </Txt>
      <Txt variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
        {t('recipes.minutes', { count: recipe.minutes })}
      </Txt>

      <Card style={styles.servings}>
        <Txt variant="headline" style={{ flex: 1 }}>
          {t('recipes.servings')}
        </Txt>
        <Stepper
          value={servings}
          step={0.5}
          min={0.5}
          max={12}
          format={(v) => formatNumber(v, locale, 1)}
          onChange={setServings}
        />
      </Card>

      <NutrientTiles value={totals} />

      <Card style={{ marginTop: space.md, paddingVertical: space.sm }}>
        <Txt variant="headline" style={{ paddingVertical: space.sm }}>
          {t('recipes.ingredients')}
        </Txt>
        {ingredients.map((ing, i) => (
          <View key={ing.id}>
            {i > 0 ? <Divider /> : null}
            <View style={styles.ingredient}>
              <Txt variant="callout" style={{ flex: 1 }}>
                {ing.name}
              </Txt>
              <Txt variant="callout" color={colors.textSecondary}>
                {ing.grams} g
              </Txt>
            </View>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: space.md, gap: space.md }}>
        <Txt variant="headline">{t('recipes.steps')}</Txt>
        {text.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNumber}>
              <Txt variant="caption" color={colors.onPrimary}>
                {i + 1}
              </Txt>
            </View>
            <Txt variant="body" style={{ flex: 1 }}>
              {step}
            </Txt>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 180, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 88, lineHeight: 104 },
  servings: { flexDirection: 'row', alignItems: 'center', marginVertical: space.lg },
  ingredient: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  step: { flexDirection: 'row', gap: space.md },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
