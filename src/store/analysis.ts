import { Platform } from 'react-native';

import { currentLang } from '@/i18n';
import { ApiError, api } from '@/lib/api';
import { haptic } from '@/lib/haptics';
import { readImageBase64, type PreparedImage } from '@/lib/images';
import { ingredientsFromAi, uid } from '@/lib/meal';
import type { MealError } from '@/lib/types';

import { useStore } from './store';

// Photos waiting for (or retrying) analysis. Kept in memory so large base64 data never hits storage.
const pending = new Map<string, { base64: string; mimeType: string }>();

export function toMealError(error: unknown): MealError {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'notConfigured':
        return 'notConfigured';
      case 'tooLarge':
        return 'tooLarge';
      case 'network':
      case 'timeout':
        return 'network';
      case 'aiFailed':
      case 'rateLimited':
        return 'aiFailed';
      default:
        return 'unknown';
    }
  }
  return 'unknown';
}

/** Adds a "processing" meal right away and analyzes the photo in the background. */
export function startPhotoAnalysis(image: PreparedImage, mode: 'meal' | 'label', day: string): string {
  const id = uid();
  useStore.getState().addMeal({
    id,
    day,
    createdAt: new Date().toISOString(),
    source: mode === 'label' ? 'label' : 'scan',
    status: 'processing',
    name: '',
    servings: 1,
    imageUri: image.storedUri,
    healthScore: null,
    ingredients: [],
  });
  pending.set(id, { base64: image.base64, mimeType: image.mimeType });
  void run(id, mode);
  return id;
}

export function canRetry(mealId: string, imageUri: string | null): boolean {
  return pending.has(mealId) || (Platform.OS !== 'web' && !!imageUri?.startsWith('file:'));
}

export async function retryPhotoAnalysis(mealId: string): Promise<void> {
  const meal = useStore.getState().meals.find((m) => m.id === mealId);
  if (!meal) return;
  if (!pending.has(mealId) && meal.imageUri) {
    const base64 = await readImageBase64(meal.imageUri);
    if (base64) pending.set(mealId, { base64, mimeType: 'image/jpeg' });
  }
  if (!pending.has(mealId)) return;
  useStore.getState().updateMeal(mealId, { status: 'processing', error: undefined });
  await run(mealId, meal.source === 'label' ? 'label' : 'meal');
}

async function run(id: string, mode: 'meal' | 'label') {
  const image = pending.get(id);
  if (!image) return;
  const { updateMeal } = useStore.getState();
  try {
    const result = await api.analyzeFood({
      imageBase64: image.base64,
      mimeType: image.mimeType,
      mode,
      lang: currentLang(),
    });
    const ingredients = ingredientsFromAi(result.ingredients);
    if (!result.isFood || ingredients.length === 0) {
      updateMeal(id, { status: 'failed', error: 'noFood', name: result.name || '' });
      haptic.warning();
      return;
    }
    updateMeal(id, {
      status: 'done',
      name: result.name,
      healthScore: result.healthScore,
      confidence: result.confidence,
      ingredients,
      error: undefined,
    });
    pending.delete(id);
    haptic.success();
  } catch (error) {
    updateMeal(id, { status: 'failed', error: toMealError(error) });
    haptic.warning();
  }
}
