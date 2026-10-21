import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BigNumber } from '@/components/big-number';
import { Icon } from '@/components/icon';
import { HealthScore, MacroLine, NutrientTiles } from '@/components/nutrition';
import { Sheet } from '@/components/sheet';
import { Button, Card, Divider, EmptyState, Header, IconButton, Screen, Stepper, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { ApiError, api } from '@/lib/api';
import { timeHM } from '@/lib/dates';
import { confirmDialog, notify } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { ingredientsFromAi, ingredientsToAi, mealNutrients, scaleIngredient, uid } from '@/lib/meal';
import type { Ingredient, MealSource } from '@/lib/types';
import { formatNumber } from '@/lib/units';
import { canRetry, retryPhotoAnalysis, toMealError } from '@/store/analysis';
import { useStore } from '@/store/store';
import { showToast } from '@/store/ui';
import { colors, radius, space } from '@/theme';

const SOURCE_KEY: Record<MealSource, string> = {
  scan: 'meal.sourceScan',
  label: 'meal.sourceLabel',
  barcode: 'meal.sourceBarcode',
  search: 'meal.sourceSearch',
  ai_text: 'meal.sourceAiText',
  manual: 'meal.sourceManual',
  saved: 'meal.sourceSaved',
  recipe: 'meal.sourceRecipe',
};

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, locale } = useT();
  const meal = useStore((s) => s.meals.find((m) => m.id === id));
  const saved = useStore((s) => s.saved);
  const updateMeal = useStore((s) => s.updateMeal);
  const removeMeal = useStore((s) => s.removeMeal);
  const saveFood = useStore((s) => s.saveFood);
  const removeSaved = useStore((s) => s.removeSaved);

  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [fixOpen, setFixOpen] = useState(false);
  const [fixText, setFixText] = useState('');
  const [fixing, setFixing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (!meal) {
    return (
      <Screen header={<Header />}>
        <EmptyState icon="food" title={t('meal.noIngredients')} />
      </Screen>
    );
  }

  const totals = mealNutrients(meal);
  const savedEntry = saved.find((f) => f.fromMealId === meal.id);

  const toggleSaved = () => {
    if (savedEntry) {
      removeSaved(savedEntry.id);
      showToast(t('meal.unsavedToast'));
    } else {
      saveFood({
        id: uid(),
        name: meal.name,
        imageUri: meal.imageUri,
        healthScore: meal.healthScore,
        ingredients: meal.ingredients,
        servings: meal.servings,
        savedAt: new Date().toISOString(),
        fromMealId: meal.id,
      });
      showToast(t('meal.savedToast'));
    }
    haptic.success();
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: t('meal.deleteTitle'),
      message: t('meal.deleteText'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    removeMeal(meal.id);
    router.back();
  };

  const applyFix = async () => {
    setFixing(true);
    try {
      const result = await api.fixMeal({
        name: meal.name,
        ingredients: ingredientsToAi(meal.ingredients),
        instruction: fixText.trim(),
        lang,
      });
      const ingredients = ingredientsFromAi(result.ingredients);
      if (ingredients.length) {
        updateMeal(meal.id, {
          name: result.name || meal.name,
          healthScore: result.healthScore,
          confidence: result.confidence,
          ingredients,
        });
        haptic.success();
      }
      setFixOpen(false);
      setFixText('');
    } catch (error) {
      notify(t(`errors.${toMealError(error)}`), error instanceof ApiError ? undefined : String(error));
    } finally {
      setFixing(false);
    }
  };

  const retry = async () => {
    setRetrying(true);
    await retryPhotoAnalysis(meal.id);
    setRetrying(false);
  };

  const updateIngredient = (next: Ingredient) =>
    updateMeal(meal.id, { ingredients: meal.ingredients.map((i) => (i.id === next.id ? next : i)) });

  const removeIngredient = (ingredientId: string) =>
    updateMeal(meal.id, { ingredients: meal.ingredients.filter((i) => i.id !== ingredientId) });

  return (
    <Screen
      header={
        <Header
          right={
            meal.status === 'done' ? (
              <>
                <IconButton
                  icon={savedEntry ? 'bookmarkFill' : 'bookmark'}
                  label={t('meal.save')}
                  onPress={toggleSaved}
                  color={savedEntry ? colors.carbs : colors.text}
                />
                <IconButton icon="trash" label={t('common.delete')} onPress={remove} color={colors.danger} />
              </>
            ) : (
              <IconButton icon="trash" label={t('common.delete')} onPress={remove} color={colors.danger} />
            )
          }
        />
      }>
      {meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.hero} contentFit="cover" /> : null}

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Txt variant="title" style={{ flex: 1 }}>
            {meal.status === 'processing' ? t('meal.analyzing') : meal.name || t('today.failedTitle')}
          </Txt>
          {meal.status === 'done' ? (
            <IconButton icon="pencil" label={t('meal.rename')} size={34} onPress={() => setRenaming(meal.name)} />
          ) : null}
        </View>
        <Txt variant="caption" color={colors.textSecondary}>
          {timeHM(meal.createdAt, locale)} · {t(SOURCE_KEY[meal.source] as 'meal.sourceScan')}
        </Txt>
        {meal.status === 'done' && meal.confidence === 'low' ? (
          <View style={styles.warning}>
            <Icon name="info" size={14} color={colors.warning} />
            <Txt variant="caption" color={colors.warning}>
              {t('meal.confidenceLow')}
            </Txt>
          </View>
        ) : null}
      </View>

      {meal.status === 'processing' ? (
        <Card style={styles.center}>
          <ActivityIndicator color={colors.text} />
          <Txt variant="callout" color={colors.textSecondary}>
            {t('today.processing1')}
          </Txt>
        </Card>
      ) : null}

      {meal.status === 'failed' ? (
        <Card style={{ gap: space.md }}>
          <Txt variant="callout" color={colors.textSecondary}>
            {t(`errors.${meal.error ?? 'unknown'}`)}
          </Txt>
          {canRetry(meal.id, meal.imageUri) ? (
            <Button title={t('meal.failedRetry')} icon="refresh" loading={retrying} onPress={retry} />
          ) : null}
          <Button
            title={t('meal.enterManually')}
            variant="secondary"
            icon="manual"
            onPress={() => router.replace({ pathname: '/manual', params: { replace: meal.id } })}
          />
        </Card>
      ) : null}

      {meal.status === 'done' ? (
        <View style={{ gap: space.md }}>
          <Card style={styles.servings}>
            <Txt variant="headline" style={{ flex: 1 }}>
              {t('meal.servings')}
            </Txt>
            <Stepper
              value={meal.servings}
              step={0.25}
              min={0.25}
              max={10}
              format={(v) => `${formatNumber(v, locale, 2)} ×`}
              onChange={(servings) => updateMeal(meal.id, { servings })}
            />
          </Card>

          <NutrientTiles value={totals} />

          {meal.healthScore ? <HealthScore score={meal.healthScore} /> : null}

          <Card style={{ paddingVertical: space.sm }}>
            <Txt variant="headline" style={{ paddingVertical: space.sm }}>
              {t('meal.ingredients')}
            </Txt>
            {meal.ingredients.map((ing, i) => (
              <View key={ing.id}>
                {i > 0 ? <Divider /> : null}
                <IngredientRow ingredient={ing} onPress={() => setEditing(ing)} />
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('meal.addIngredient')}
              onPress={() => router.push({ pathname: '/search', params: { addTo: meal.id } })}
              style={({ pressed }) => [styles.addIngredient, pressed && { opacity: 0.6 }]}>
              <Icon name="add" size={16} color={colors.textSecondary} />
              <Txt variant="callout" color={colors.textSecondary}>
                {t('meal.addIngredient')}
              </Txt>
            </Pressable>
          </Card>

          <Button title={t('meal.fix')} icon="wand" variant="secondary" onPress={() => setFixOpen(true)} />
        </View>
      ) : null}

      <IngredientEditor
        ingredient={editing}
        onClose={() => setEditing(null)}
        onSave={(next) => {
          updateIngredient(next);
          setEditing(null);
        }}
        onRemove={(ingredientId) => {
          removeIngredient(ingredientId);
          setEditing(null);
        }}
      />

      <Sheet visible={renaming !== null} onClose={() => setRenaming(null)} title={t('meal.rename')}>
        <TextInput
          value={renaming ?? ''}
          onChangeText={setRenaming}
          style={styles.input}
          autoFocus
          maxLength={80}
          returnKeyType="done"
        />
        <Button
          title={t('common.save')}
          disabled={!renaming?.trim()}
          onPress={() => {
            updateMeal(meal.id, { name: renaming?.trim() ?? meal.name });
            setRenaming(null);
          }}
        />
      </Sheet>

      <Sheet visible={fixOpen} onClose={() => !fixing && setFixOpen(false)} title={t('meal.fixTitle')} subtitle={t('meal.fixHint')}>
        <TextInput
          value={fixText}
          onChangeText={setFixText}
          placeholder={t('meal.fixPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, styles.multiline]}
          multiline
          maxLength={500}
          autoFocus
        />
        <Button
          title={fixing ? t('meal.fixing') : t('meal.fixApply')}
          icon="wand"
          loading={fixing}
          disabled={fixText.trim().length < 2}
          onPress={applyFix}
        />
      </Sheet>
    </Screen>
  );
}

function IngredientRow({ ingredient, onPress }: { ingredient: Ingredient; onPress: () => void }) {
  const { t } = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ingredient.name}
      onPress={onPress}
      style={({ pressed }) => [styles.ingredient, pressed && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <Txt variant="callout" numberOfLines={2}>
          {ingredient.name}
        </Txt>
        <View style={styles.ingredientMeta}>
          <Txt variant="caption" color={colors.textSecondary}>
            {ingredient.calories} {t('common.kcal')}
          </Txt>
          <MacroLine value={ingredient} />
        </View>
      </View>
      {ingredient.grams ? (
        <Txt variant="callout" color={colors.textSecondary}>
          {ingredient.grams} g
        </Txt>
      ) : null}
      <Icon name="pencil" size={14} color={colors.textTertiary} />
    </Pressable>
  );
}

function IngredientEditor({
  ingredient,
  onClose,
  onSave,
  onRemove,
}: {
  ingredient: Ingredient | null;
  onClose: () => void;
  onSave: (next: Ingredient) => void;
  onRemove: (id: string) => void;
}) {
  const { t, locale } = useT();
  const [draft, setDraft] = useState<Ingredient | null>(null);
  const current = draft && ingredient && draft.id === ingredient.id ? draft : ingredient;

  return (
    <Sheet
      visible={ingredient !== null}
      onClose={() => {
        setDraft(null);
        onClose();
      }}
      title={t('meal.editIngredient')}>
      {current ? (
        <>
          <TextInput
            value={current.name}
            onChangeText={(name) => setDraft({ ...current, name })}
            style={styles.input}
            maxLength={80}
            accessibilityLabel={t('meal.ingredientName')}
          />
          {current.grams ? (
            <BigNumber
              label={t('meal.ingredientGrams')}
              value={current.grams}
              step={10}
              min={1}
              max={3000}
              unit="g"
              locale={locale}
              // Scale from the saved ingredient so repeated taps don't accumulate rounding.
              onChange={(grams) => setDraft({ ...scaleIngredient(ingredient ?? current, grams), name: current.name })}
            />
          ) : null}
          <NutrientTiles value={current} />
          <Button
            title={t('common.save')}
            disabled={!current.name.trim()}
            onPress={() => {
              setDraft(null);
              onSave({ ...current, name: current.name.trim() });
            }}
          />
          <Button
            title={t('meal.removeIngredient')}
            variant="danger"
            icon="trash"
            onPress={() => {
              setDraft(null);
              onRemove(current.id);
            }}
          />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 230, borderRadius: radius.lg, marginBottom: space.lg },
  titleBlock: { gap: 4, marginBottom: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  center: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  servings: { flexDirection: 'row', alignItems: 'center' },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  ingredientMeta: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 2 },
  addIngredient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.md },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
});
