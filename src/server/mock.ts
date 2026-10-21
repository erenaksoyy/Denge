// Canned answers used when AI_MOCK=1, so the app can be tried without a Gemini API key.
import type { ExerciseOut, FoodAnalysisOut } from './schemas';

type Lang = 'tr' | 'en';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function mockMeal(lang: Lang): FoodAnalysisOut {
  const tr = lang === 'tr';
  return {
    isFood: true,
    name: tr ? 'Izgara tavuk, pilav ve salata' : 'Grilled chicken, rice and salad',
    healthScore: 8,
    confidence: 'medium',
    ingredients: [
      { name: tr ? 'Izgara tavuk göğsü' : 'Grilled chicken breast', grams: 140, calories: 231, protein: 43.4, carbs: 0, fat: 5 },
      { name: tr ? 'Pirinç pilavı' : 'Rice pilaf', grams: 150, calories: 233, protein: 4.2, carbs: 42, fat: 5.3 },
      { name: tr ? 'Çoban salata' : 'Shepherd’s salad', grams: 120, calories: 60, protein: 1.2, carbs: 5.4, fat: 4.2 },
    ],
  };
}

export function mockLabel(lang: Lang): FoodAnalysisOut {
  return {
    isFood: true,
    name: lang === 'tr' ? 'Yulaflı bisküvi' : 'Oat biscuits',
    healthScore: 5,
    confidence: 'high',
    ingredients: [
      { name: lang === 'tr' ? 'Yulaflı bisküvi (1 porsiyon)' : 'Oat biscuits (1 serving)', grams: 30, calories: 141, protein: 2.4, carbs: 19.5, fat: 6 },
    ],
  };
}

export function mockEstimate(query: string, lang: Lang): FoodAnalysisOut {
  return {
    isFood: true,
    name: query.slice(0, 40),
    healthScore: 6,
    confidence: 'low',
    ingredients: [
      { name: query.slice(0, 40) || (lang === 'tr' ? 'Yemek' : 'Food'), grams: 250, calories: 320, protein: 14, carbs: 38, fat: 12 },
    ],
  };
}

export function mockFix(name: string, ingredients: FoodAnalysisOut['ingredients'], lang: Lang): FoodAnalysisOut {
  const extra = { name: lang === 'tr' ? 'Ayran' : 'Ayran (yogurt drink)', grams: 200, calories: 76, protein: 3.4, carbs: 5.6, fat: 4 };
  return { isFood: true, name, healthScore: 7, confidence: 'medium', ingredients: [...ingredients, extra] };
}

export function mockExercise(lang: Lang): ExerciseOut {
  return {
    isExercise: true,
    name: lang === 'tr' ? 'Ağırlık ve yürüyüş' : 'Weights and walking',
    minutes: 60,
    intensity: 'medium',
    calories: 330,
  };
}

export function mockCoachReply(lang: Lang): string {
  return lang === 'tr'
    ? 'Bugün hedefine göre güzel gidiyorsun! Akşam için **ızgara tavuk (150 g), bulgur pilavı (1 porsiyon) ve bol yeşillikli salata** önerebilirim; yaklaşık 520 kcal ve 45 g protein eder.\n- Salatana 1 yemek kaşığı zeytinyağı ekleyebilirsin.\n- Tatlı istersen bir kase süzme yoğurda birkaç çilek kat.\n\n(Bu bir deneme cevabıdır: AI_MOCK açık.)'
    : 'You’re doing well against your goal today! For dinner, try **grilled chicken (150 g), a serving of bulgur pilaf and a big green salad**, about 520 kcal and 45 g of protein.\n- Add a tablespoon of olive oil to the salad.\n- Craving something sweet? Have Greek yogurt with a few strawberries.\n\n(This is a sample reply: AI_MOCK is on.)';
}
