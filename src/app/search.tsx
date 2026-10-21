import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { MealThumb } from '@/components/log-rows';
import { Header, Screen, SectionTitle, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { api } from '@/lib/api';
import { goHome, notify } from '@/lib/dialogs';
import { localFoodById, POPULAR_FOOD_IDS, searchLocalFoods } from '@/lib/foods-data';
import { haptic } from '@/lib/haptics';
import { ingredientsFromAi, mealNutrients, uid } from '@/lib/meal';
import type { FoodItem, MealLog } from '@/lib/types';
import { toMealError } from '@/store/analysis';
import { useStore } from '@/store/store';
import { showToast, useUi } from '@/store/ui';
import { colors, radius, space } from '@/theme';

export default function SearchScreen() {
  const { addTo } = useLocalSearchParams<{ addTo?: string }>();
  const { t, lang } = useT();
  const meals = useStore((s) => s.meals);
  const addMeal = useStore((s) => s.addMeal);
  const updateMeal = useStore((s) => s.updateMeal);
  const selectedDay = useUi((s) => s.selectedDay);
  const setPendingFood = useUi((s) => s.setPendingFood);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ query: string; items: FoodItem[] } | null>(null);
  const [estimating, setEstimating] = useState(false);

  const q = query.trim();
  const local = searchLocalFoods(q, lang);
  const popular = POPULAR_FOOD_IDS.flatMap((id) => localFoodById(id, lang) ?? []);

  const products = result?.query === q ? result.items : [];
  const searching = q.length >= 3 && result?.query !== q;

  useEffect(() => {
    if (q.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .searchFoods(q, lang, controller.signal)
        .then((res) => setResult({ query: q, items: res.items }))
        .catch(() => {
          if (!controller.signal.aborted) setResult({ query: q, items: [] });
        });
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, lang]);

  const recent: MealLog[] = [];
  const seenNames = new Set<string>();
  for (const m of [...meals].reverse()) {
    if (m.status !== 'done' || seenNames.has(m.name)) continue;
    seenNames.add(m.name);
    recent.push(m);
    if (recent.length >= 6) break;
  }

  const openFood = (food: FoodItem) => {
    setPendingFood({ food, source: food.source === 'off' ? 'barcode' : 'search', addToMealId: addTo });
    router.push('/food-entry');
  };

  const relog = (meal: MealLog) => {
    addMeal({
      ...meal,
      id: uid(),
      day: selectedDay,
      createdAt: new Date().toISOString(),
      ingredients: meal.ingredients.map((i) => ({ ...i, id: uid() })),
    });
    haptic.success();
    showToast(t('saved.added', { name: meal.name }));
    goHome();
  };

  const estimate = async () => {
    setEstimating(true);
    try {
      const result = await api.estimateFood({ query: q, lang });
      const ingredients = ingredientsFromAi(result.ingredients);
      if (!result.isFood || ingredients.length === 0) {
        notify(t('errors.noFood'));
        return;
      }
      haptic.success();
      if (addTo) {
        const target = useStore.getState().meals.find((m) => m.id === addTo);
        if (target) updateMeal(addTo, { ingredients: [...target.ingredients, ...ingredients] });
        router.back();
        return;
      }
      const id = uid();
      addMeal({
        id,
        day: selectedDay,
        createdAt: new Date().toISOString(),
        source: 'ai_text',
        status: 'done',
        name: result.name || q,
        servings: 1,
        imageUri: null,
        healthScore: result.healthScore,
        confidence: result.confidence,
        ingredients,
      });
      router.replace({ pathname: '/meal/[id]', params: { id } });
    } catch (error) {
      notify(t(`errors.${toMealError(error)}`));
    } finally {
      setEstimating(false);
    }
  };

  return (
    <Screen topInset={false} header={<Header close title={addTo ? t('search.addTitle') : t('search.title')} />}>
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel={t('search.placeholder')}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel={t('common.close')}>
            <Icon name="close" size={16} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      {q.length >= 2 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.aiRow', { query: q })}
          disabled={estimating}
          onPress={estimate}
          style={({ pressed }) => [styles.aiRow, pressed && { opacity: 0.7 }]}>
          <View style={styles.aiIcon}>
            {estimating ? <ActivityIndicator color={colors.fasting} /> : <Icon name="sparkles" size={18} color={colors.fasting} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="headline" numberOfLines={2}>
              {estimating ? t('search.aiWorking') : t('search.aiRow', { query: q })}
            </Txt>
            <Txt variant="caption" color={colors.textSecondary}>
              {t('search.aiHint')}
            </Txt>
          </View>
        </Pressable>
      ) : null}

      {q.length === 0 ? (
        <>
          {!addTo && recent.length ? (
            <>
              <SectionTitle>{t('search.recent')}</SectionTitle>
              <View style={styles.list}>
                {recent.map((m) => (
                  <Pressable
                    key={m.id}
                    accessibilityRole="button"
                    accessibilityLabel={m.name}
                    onPress={() => relog(m)}
                    style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
                    <MealThumb uri={m.imageUri} size={40} />
                    <Txt variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                      {m.name}
                    </Txt>
                    <Txt variant="caption" color={colors.textSecondary}>
                      {mealNutrients(m).calories} {t('common.kcal')}
                    </Txt>
                    <Icon name="add" size={18} color={colors.text} />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          <SectionTitle>{t('search.popular')}</SectionTitle>
          <FoodList items={popular} onPress={openFood} />
        </>
      ) : (
        <>
          {local.length ? (
            <>
              <SectionTitle>{t('search.local')}</SectionTitle>
              <FoodList items={local} onPress={openFood} />
            </>
          ) : null}
          {q.length >= 3 ? (
            <>
              <SectionTitle action={searching ? <ActivityIndicator color={colors.textSecondary} /> : null}>
                {t('search.products')}
              </SectionTitle>
              {products.length ? (
                <>
                  <FoodList items={products} onPress={openFood} />
                  <Txt variant="micro" color={colors.textTertiary} style={{ marginTop: space.md }}>
                    {t('search.offCredit')}
                  </Txt>
                </>
              ) : !searching ? (
                <Txt variant="callout" color={colors.textSecondary}>
                  {t('search.noResults')}
                </Txt>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function FoodList({ items, onPress }: { items: FoodItem[]; onPress: (food: FoodItem) => void }) {
  const { t } = useT();
  return (
    <View style={styles.list}>
      {items.map((food) => (
        <Pressable
          key={food.id}
          accessibilityRole="button"
          accessibilityLabel={food.name}
          onPress={() => onPress(food)}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}>
          {food.imageUrl ? (
            <Image source={{ uri: food.imageUrl }} style={styles.productImage} contentFit="cover" />
          ) : null}
          <View style={{ flex: 1 }}>
            <Txt variant="callout" numberOfLines={1}>
              {food.name}
            </Txt>
            <Txt variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {[food.brand, food.servingLabel && food.servingG ? `${food.servingLabel}` : null, t('search.per100', { kcal: food.per100.calories })]
                .filter(Boolean)
                .join(' · ')}
            </Txt>
          </View>
          <Icon name="chevronRight" size={14} color={colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, height: '100%' },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.fastingSoft,
    borderRadius: radius.lg,
    padding: space.md,
    marginTop: space.md,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: space.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  productImage: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.cardMuted },
});
