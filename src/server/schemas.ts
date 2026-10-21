import { z } from 'zod';

// ---- Model output ----

export const aiIngredientSchema = z.object({
  name: z.string().describe('Short name of the food item'),
  grams: z.number().min(0).describe('Estimated weight in grams (ml for drinks)'),
  calories: z.number().min(0).describe('kcal for this amount'),
  protein: z.number().min(0).describe('grams of protein for this amount'),
  carbs: z.number().min(0).describe('grams of carbohydrate for this amount'),
  fat: z.number().min(0).describe('grams of fat for this amount'),
});

export const foodAnalysisSchema = z.object({
  isFood: z.boolean().describe('False when there is no food or drink'),
  name: z.string().describe('Short name for the whole meal, at most 5 words'),
  healthScore: z.number().int().min(1).max(10).describe('Overall nutritional quality from 1 to 10'),
  confidence: z.enum(['low', 'medium', 'high']),
  ingredients: z.array(aiIngredientSchema).max(30),
});

export const exerciseSchema = z.object({
  isExercise: z.boolean(),
  name: z.string().describe('Short activity name, at most 4 words'),
  minutes: z.number().int().min(0).max(1440),
  intensity: z.enum(['low', 'medium', 'high']),
  calories: z.number().int().min(0).max(5000),
});

// ---- Request bodies ----

const lang = z.enum(['tr', 'en']).catch('en');

export const analyzeFoodBody = z.object({
  imageBase64: z.string().min(100).max(12_000_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  mode: z.enum(['meal', 'label']).default('meal'),
  lang,
});

export const fixMealBody = z.object({
  name: z.string().max(200),
  ingredients: z.array(aiIngredientSchema).max(40),
  instruction: z.string().trim().min(2).max(600),
  lang,
});

export const estimateFoodBody = z.object({
  query: z.string().trim().min(2).max(300),
  lang,
});

export const exerciseBody = z.object({
  description: z.string().trim().min(2).max(600),
  sex: z.enum(['male', 'female']),
  age: z.number().min(10).max(110),
  weightKg: z.number().min(25).max(400),
  lang,
});

const nutrients = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export const coachBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(4000) }))
    .min(1)
    .max(40),
  context: z.object({
    profile: z.object({
      sex: z.enum(['male', 'female']),
      age: z.number(),
      heightCm: z.number(),
      weightKg: z.number(),
      targetWeightKg: z.number(),
      goal: z.enum(['lose', 'maintain', 'gain']),
      diet: z.string().max(40),
      activity: z.string().max(20),
      obstacles: z.array(z.string().max(40)).max(10),
    }),
    goals: z.object({ calories: z.number(), proteinG: z.number(), carbsG: z.number(), fatG: z.number() }),
    today: nutrients.extend({ burned: z.number(), waterMl: z.number() }),
    meals: z.array(z.object({ name: z.string().max(120), calories: z.number() })).max(30),
  }),
  lang,
});

export type FoodAnalysisOut = z.infer<typeof foodAnalysisSchema>;
export type ExerciseOut = z.infer<typeof exerciseSchema>;
export type CoachBody = z.infer<typeof coachBody>;
