// Run with: npm test   (uses Node's built-in test runner and TypeScript type stripping)
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bmi,
  bmiCategory,
  calcBmr,
  calcPlan,
  calcTdee,
  dayStatus,
  effectiveGoal,
  exerciseCalories,
  goalTimeline,
  macroGrams,
  suggestedWaterMl,
  weeksToGoal,
} from '../src/lib/nutrition.ts';

const sample = {
  sex: 'male',
  age: 35,
  heightCm: 178,
  weightKg: 70,
  targetWeightKg: 65,
  goal: 'lose',
  activity: 'moderate',
  weeklyRateKg: 0.8,
  diet: 'balanced',
};

test('Harris-Benedict BMR and TDEE for a known example', () => {
  // BMR ≈ 1681.26 kcal; with moderate activity TDEE ≈ 1681.26 * 1.55 ≈ 2606 kcal.
  const bmr = calcBmr(sample, 'harris');
  assert.ok(Math.abs(bmr - 1681.3) < 1, `bmr=${bmr}`);
  assert.ok(Math.abs(calcTdee(bmr, 'moderate') - 2606) < 2);
});

test('Mifflin-St Jeor BMR', () => {
  assert.equal(calcBmr(sample, 'mifflin'), 1642.5);
  assert.equal(calcBmr({ ...sample, sex: 'female' }, 'mifflin'), 1476.5);
});

test('plan subtracts 1100 kcal per kg of weekly loss', () => {
  const plan = calcPlan(sample, 'mifflin');
  // 1642.5 * 1.55 = 2545.875 ; minus 0.8 * 1100 = 880
  assert.equal(plan.tdee, 2546);
  assert.equal(plan.calories, 1666);
  assert.deepEqual(
    { p: plan.proteinG, c: plan.carbsG, f: plan.fatG },
    { p: 104, c: 208, f: 46 },
  );
  assert.equal(plan.weeks, 6.25);
  assert.equal(plan.clampedToMinimum, false);
});

test('plan never goes below the safety floor', () => {
  const plan = calcPlan(
    { ...sample, sex: 'female', heightCm: 155, weightKg: 52, targetWeightKg: 45, activity: 'low', weeklyRateKg: 1 },
    'mifflin',
  );
  assert.equal(plan.calories, 1200);
  assert.equal(plan.clampedToMinimum, true);
});

test('gain and maintain plans', () => {
  const gain = calcPlan({ ...sample, goal: 'gain', targetWeightKg: 75, weeklyRateKg: 0.25 }, 'mifflin');
  assert.equal(gain.calories, Math.round(2545.875 + 275));
  const keep = calcPlan({ ...sample, goal: 'maintain' }, 'mifflin');
  assert.equal(keep.calories, 2546);
  assert.equal(keep.weeks, 0);
});

test('macro grams follow 4/4/9 kcal per gram', () => {
  assert.deepEqual(macroGrams(2000, { carbs: 50, protein: 25, fat: 25 }), { protein: 125, carbs: 250, fat: 56 });
});

test('goal timeline', () => {
  assert.equal(weeksToGoal(70, 65, 0.5), 10);
  const start = new Date(2026, 9, 19);
  const t = goalTimeline(70, 65, 0.8, start);
  assert.equal(t.days, 44);
  assert.equal(t.targetDate.getMonth(), 11); // December
  assert.equal(t.targetDate.getDate(), 2);
  assert.equal(goalTimeline(70, 70, 0.5, start), null);
});

test('effective goal follows the target weight', () => {
  assert.equal(effectiveGoal({ goal: 'lose', weightKg: 70, targetWeightKg: 75 }), 'gain');
  assert.equal(effectiveGoal({ goal: 'gain', weightKg: 70, targetWeightKg: 70 }), 'maintain');
});

test('BMI and categories', () => {
  assert.equal(bmi(70, 178), 22.1);
  assert.equal(bmiCategory(18.4), 'underweight');
  assert.equal(bmiCategory(24.9), 'healthy');
  assert.equal(bmiCategory(25), 'overweight');
  assert.equal(bmiCategory(30), 'obese');
});

test('exercise calories use the ACSM MET formula', () => {
  assert.equal(exerciseCalories(9.8, 70, 30), 360);
});

test('day status depends on the goal direction', () => {
  assert.equal(dayStatus(0, 2000, 'lose'), 'none');
  assert.equal(dayStatus(1800, 2000, 'lose'), 'success');
  assert.equal(dayStatus(2100, 2000, 'maintain'), 'over');
  assert.equal(dayStatus(1800, 2000, 'gain'), 'under');
  assert.equal(dayStatus(2100, 2000, 'gain'), 'success');
});

test('water suggestion is bounded', () => {
  assert.equal(suggestedWaterMl(70), 2500);
  assert.equal(suggestedWaterMl(30), 1500);
  assert.equal(suggestedWaterMl(150), 4000);
});
