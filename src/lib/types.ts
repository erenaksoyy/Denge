import type {
  ActivityLevel,
  BmrFormula,
  DietType,
  ExerciseKind,
  GoalType,
  Intensity,
  Sex,
} from './nutrition';

export type Units = 'metric' | 'imperial';
export type Language = 'system' | 'tr' | 'en';
export type Obstacle = 'consistency' | 'habits' | 'support' | 'time' | 'inspiration';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  startWeightKg: number;
  targetWeightKg: number;
  goal: GoalType;
  activity: ActivityLevel;
  weeklyRateKg: number;
  diet: DietType;
  obstacles: Obstacle[];
  createdAt: string;
}

export interface Goals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Settings {
  units: Units;
  language: Language;
  formula: BmrFormula;
  addBurnedToGoal: boolean;
  goalsMode: 'auto' | 'custom';
  waterGoalMl: number;
  glassMl: number;
}

export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient extends Nutrients {
  id: string;
  name: string;
  /** Weight in grams. Null when unknown (e.g. manual entries); then only servings scale it. */
  grams: number | null;
}

export type MealSource =
  | 'scan'
  | 'label'
  | 'barcode'
  | 'search'
  | 'ai_text'
  | 'manual'
  | 'saved'
  | 'recipe';

export type MealStatus = 'processing' | 'done' | 'failed';

export type MealError =
  | 'noFood'
  | 'network'
  | 'notConfigured'
  | 'aiFailed'
  | 'interrupted'
  | 'tooLarge'
  | 'unknown';

export interface MealLog {
  id: string;
  day: string;
  createdAt: string;
  source: MealSource;
  status: MealStatus;
  name: string;
  servings: number;
  imageUri: string | null;
  healthScore: number | null;
  ingredients: Ingredient[];
  confidence?: 'low' | 'medium' | 'high';
  error?: MealError;
}

export interface SavedFood {
  id: string;
  name: string;
  imageUri: string | null;
  healthScore: number | null;
  ingredients: Ingredient[];
  servings: number;
  savedAt: string;
  /** The meal this was saved from, so the bookmark icon can reflect it. */
  fromMealId?: string;
}

export interface ExerciseLog {
  id: string;
  day: string;
  createdAt: string;
  kind: ExerciseKind | 'custom';
  name: string;
  intensity: Intensity;
  minutes: number;
  calories: number;
  source: 'preset' | 'ai';
}

export interface WeightEntry {
  id: string;
  day: string;
  kg: number;
  createdAt: string;
}

export type FastPlanId = 'circadian' | '16_8' | '18_6' | '20_4' | '36h' | 'custom';

export interface ActiveFast {
  start: string;
  goalHours: number;
}

export interface FastRecord extends ActiveFast {
  id: string;
  end: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
  status: 'done' | 'streaming' | 'error';
  error?: string;
}

/** A food from the database. Nutrients are per 100 g (or 100 ml). */
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  per100: Nutrients;
  servingG?: number;
  servingLabel?: string;
  source: 'local' | 'off';
  imageUrl?: string;
}

// ---- Shapes exchanged with the API routes ----

export interface AiIngredient {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodAnalysis {
  isFood: boolean;
  name: string;
  healthScore: number;
  confidence: 'low' | 'medium' | 'high';
  ingredients: AiIngredient[];
}

export interface ExerciseEstimate {
  isExercise: boolean;
  name: string;
  minutes: number;
  intensity: Intensity;
  calories: number;
}

export interface CoachContext {
  profile: Pick<
    Profile,
    'sex' | 'age' | 'heightCm' | 'weightKg' | 'targetWeightKg' | 'goal' | 'diet' | 'activity' | 'obstacles'
  >;
  goals: Goals;
  today: Nutrients & { burned: number; waterMl: number };
  meals: { name: string; calories: number }[];
}
