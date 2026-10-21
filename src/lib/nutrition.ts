// Pure nutrition math. No React Native imports, so it can be unit-tested with plain Node.

export type Sex = 'male' | 'female';
export type ActivityLevel = 'low' | 'moderate' | 'high';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type DietType =
  | 'balanced'
  | 'vegetarian'
  | 'vegan'
  | 'highProtein'
  | 'keto'
  | 'lowCarb'
  | 'pescatarian'
  | 'paleo';
export type BmrFormula = 'mifflin' | 'harris';
export type Intensity = 'low' | 'medium' | 'high';

export interface BodyProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  goal: GoalType;
  activity: ActivityLevel;
  weeklyRateKg: number;
  diet: DietType;
}

export interface MacroSplit {
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionPlan {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  split: MacroSplit;
  /** Weeks needed to reach the target weight. 0 when maintaining. */
  weeks: number;
  /** True when the safety floor raised the calorie target. */
  clampedToMinimum: boolean;
}

/** Workouts per week: 0-2, 3-5, 6+. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  low: 1.2,
  moderate: 1.55,
  high: 1.9,
};

/** ~7700 kcal per kg of body fat, spread over 7 days. */
export const KCAL_PER_KG_WEEKLY_RATE = 1100;

/** Common safety floors for unsupervised diets. */
export const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

export const KCAL_PER_GRAM: Record<keyof MacroSplit, number> = { protein: 4, carbs: 4, fat: 9 };

/** Percent of daily calories (carbs / protein / fat) for each diet style. */
export const DIET_SPLITS: Record<DietType, MacroSplit> = {
  balanced: { carbs: 50, protein: 25, fat: 25 },
  vegetarian: { carbs: 50, protein: 25, fat: 25 },
  pescatarian: { carbs: 50, protein: 25, fat: 25 },
  vegan: { carbs: 55, protein: 25, fat: 20 },
  highProtein: { carbs: 35, protein: 35, fat: 30 },
  keto: { carbs: 5, protein: 25, fat: 70 },
  lowCarb: { carbs: 25, protein: 35, fat: 40 },
  paleo: { carbs: 30, protein: 30, fat: 40 },
};

export function calcBmr(
  p: Pick<BodyProfile, 'sex' | 'age' | 'heightCm' | 'weightKg'>,
  formula: BmrFormula = 'mifflin',
): number {
  const { sex, age, heightCm, weightKg } = p;
  if (formula === 'harris') {
    return sex === 'male'
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calcTdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activity];
}

export function macroGrams(calories: number, split: MacroSplit): MacroSplit {
  return {
    protein: Math.round((calories * split.protein) / 100 / KCAL_PER_GRAM.protein),
    carbs: Math.round((calories * split.carbs) / 100 / KCAL_PER_GRAM.carbs),
    fat: Math.round((calories * split.fat) / 100 / KCAL_PER_GRAM.fat),
  };
}

export function weeksToGoal(currentKg: number, targetKg: number, weeklyRateKg: number): number {
  const diff = Math.abs(targetKg - currentKg);
  if (diff < 0.05 || weeklyRateKg <= 0) return 0;
  return diff / weeklyRateKg;
}

export interface GoalTimeline {
  days: number;
  targetDate: Date;
  midpointDate: Date;
}

export function goalTimeline(
  currentKg: number,
  targetKg: number,
  weeklyRateKg: number,
  start: Date = new Date(),
): GoalTimeline | null {
  const weeks = weeksToGoal(currentKg, targetKg, weeklyRateKg);
  if (weeks <= 0) return null;
  const days = Math.max(1, Math.ceil(weeks * 7));
  const midDays = Math.max(1, Math.round(days / 2));
  return { days, targetDate: addDays(start, days), midpointDate: addDays(start, midDays) };
}

export function calcPlan(p: BodyProfile, formula: BmrFormula = 'mifflin'): NutritionPlan {
  const bmr = calcBmr(p, formula);
  const tdee = calcTdee(bmr, p.activity);
  const goal = effectiveGoal(p);
  const weeks = goal === 'maintain' ? 0 : weeksToGoal(p.weightKg, p.targetWeightKg, p.weeklyRateKg);

  let calories = tdee;
  if (goal === 'lose') calories = tdee - KCAL_PER_KG_WEEKLY_RATE * p.weeklyRateKg;
  if (goal === 'gain') calories = tdee + KCAL_PER_KG_WEEKLY_RATE * p.weeklyRateKg;

  const floor = MIN_CALORIES[p.sex];
  const clampedToMinimum = calories < floor;
  calories = Math.round(Math.max(calories, floor));

  const split = DIET_SPLITS[p.diet];
  const grams = macroGrams(calories, split);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    proteinG: grams.protein,
    carbsG: grams.carbs,
    fatG: grams.fat,
    split,
    weeks,
    clampedToMinimum,
  };
}

/** The goal the numbers actually imply (e.g. "lose" with a higher target behaves like "gain"). */
export function effectiveGoal(p: Pick<BodyProfile, 'goal' | 'weightKg' | 'targetWeightKg'>): GoalType {
  if (p.goal === 'maintain') return 'maintain';
  if (Math.abs(p.targetWeightKg - p.weightKg) < 0.05) return 'maintain';
  return p.targetWeightKg < p.weightKg ? 'lose' : 'gain';
}

export function bmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese';

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'healthy';
  if (value < 30) return 'overweight';
  return 'obese';
}

export type ExerciseKind = 'run' | 'walk' | 'cycle' | 'swim' | 'weights' | 'hiit';

/** MET values (Compendium of Physical Activities, rounded). */
export const MET: Record<ExerciseKind, Record<Intensity, number>> = {
  run: { low: 7.0, medium: 9.8, high: 12.3 },
  walk: { low: 2.8, medium: 3.5, high: 5.0 },
  cycle: { low: 4.0, medium: 6.8, high: 10.0 },
  swim: { low: 5.8, medium: 7.0, high: 9.8 },
  weights: { low: 3.5, medium: 5.0, high: 6.0 },
  hiit: { low: 5.0, medium: 8.0, high: 10.0 },
};

/** ACSM formula: kcal/min = MET × 3.5 × kg / 200. */
export function exerciseCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(((met * 3.5 * weightKg) / 200) * minutes);
}

export type DayStatus = 'none' | 'success' | 'over' | 'under';

/** Losing/maintaining: staying under the goal is a success. Gaining: reaching it is. */
export function dayStatus(consumed: number, goalCalories: number, goal: GoalType): DayStatus {
  if (consumed <= 0) return 'none';
  if (goal === 'gain') return consumed >= goalCalories ? 'success' : 'under';
  return consumed <= goalCalories ? 'success' : 'over';
}

export function suggestedWaterMl(weightKg: number): number {
  const ml = Math.round((weightKg * 35) / 100) * 100;
  return Math.min(4000, Math.max(1500, ml));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}
