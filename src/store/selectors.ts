import { addDays, addDaysKey, dayKey, startOfWeek } from '@/lib/dates';
import { mealNutrients, sumNutrients, ZERO } from '@/lib/meal';
import type { ExerciseLog, Goals, MealLog, Nutrients, Settings } from '@/lib/types';

export const doneMeals = (meals: MealLog[], day: string) =>
  meals.filter((m) => m.day === day && m.status === 'done');

export function dayNutrients(meals: MealLog[], day: string): Nutrients {
  const list = doneMeals(meals, day);
  return list.length ? sumNutrients(list.map(mealNutrients)) : { ...ZERO };
}

export function dayBurned(exercises: ExerciseLog[], day: string): number {
  return exercises.filter((e) => e.day === day).reduce((sum, e) => sum + e.calories, 0);
}

/** The calorie budget for a day, optionally including calories burned through exercise. */
export function calorieBudget(goals: Goals, settings: Settings, burned: number): number {
  return goals.calories + (settings.addBurnedToGoal ? burned : 0);
}

export interface StreakInfo {
  current: number;
  best: number;
  loggedDays: Set<string>;
}

/** Consecutive days with at least one logged meal, ending today (or yesterday if today is still empty). */
export function streakInfo(meals: MealLog[], today: string = dayKey()): StreakInfo {
  const loggedDays = new Set(meals.filter((m) => m.status === 'done').map((m) => m.day));
  let cursor = loggedDays.has(today) ? today : addDaysKey(today, -1);
  let current = 0;
  while (loggedDays.has(cursor)) {
    current += 1;
    cursor = addDaysKey(cursor, -1);
  }
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of [...loggedDays].sort()) {
    run = prev && addDaysKey(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current, best: Math.max(best, current), loggedDays };
}

export interface DaySummary extends Nutrients {
  day: string;
  date: Date;
}

/** Seven days (Mon–Sun) of nutrient totals for the week `weeksAgo` weeks before this one. */
export function weekSummary(meals: MealLog[], weeksAgo: number, now: Date = new Date()): DaySummary[] {
  const monday = addDays(startOfWeek(now), -7 * weeksAgo);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const day = dayKey(date);
    return { day, date, ...dayNutrients(meals, day) };
  });
}
