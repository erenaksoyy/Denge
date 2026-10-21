import { round } from './units';
import type { AiIngredient, FoodItem, Ingredient, MealLog, Nutrients } from './types';

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export const ZERO: Nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function roundNutrients(n: Nutrients): Nutrients {
  return {
    calories: Math.round(n.calories),
    protein: round(n.protein, 1),
    carbs: round(n.carbs, 1),
    fat: round(n.fat, 1),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
    }),
    { ...ZERO },
  );
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    calories: n.calories * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
  };
}

/** Totals for one meal log, including the servings multiplier. */
export function mealNutrients(meal: Pick<MealLog, 'ingredients' | 'servings'>): Nutrients {
  return roundNutrients(scaleNutrients(sumNutrients(meal.ingredients), meal.servings || 1));
}

/** Changes an ingredient's weight and scales its nutrients proportionally. */
export function scaleIngredient(ing: Ingredient, grams: number): Ingredient {
  if (!ing.grams || ing.grams <= 0) return { ...ing, grams };
  const f = grams / ing.grams;
  return { ...ing, ...roundNutrients(scaleNutrients(ing, f)), grams };
}

export function ingredientFromFood(food: FoodItem, grams: number, name = food.name): Ingredient {
  return {
    id: uid(),
    name,
    grams: Math.round(grams),
    ...roundNutrients(scaleNutrients(food.per100, grams / 100)),
  };
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

export function ingredientsFromAi(list: AiIngredient[]): Ingredient[] {
  return list
    .filter((i) => i.name?.trim())
    .map((i) => ({
      id: uid(),
      name: i.name.trim(),
      grams: num(i.grams) ? Math.round(num(i.grams)) : null,
      ...roundNutrients({
        calories: num(i.calories),
        protein: num(i.protein),
        carbs: num(i.carbs),
        fat: num(i.fat),
      }),
    }));
}

export function ingredientsToAi(list: Ingredient[]): AiIngredient[] {
  return list.map((i) => ({
    name: i.name,
    grams: i.grams ?? 0,
    calories: i.calories,
    protein: i.protein,
    carbs: i.carbs,
    fat: i.fat,
  }));
}

/** Percent of calories that come from each macro. */
export function macroPercents(n: Nutrients): { protein: number; carbs: number; fat: number } {
  const kcal = n.protein * 4 + n.carbs * 4 + n.fat * 9;
  if (kcal <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round(((n.protein * 4) / kcal) * 100),
    carbs: Math.round(((n.carbs * 4) / kcal) * 100),
    fat: Math.round(((n.fat * 9) / kcal) * 100),
  };
}
