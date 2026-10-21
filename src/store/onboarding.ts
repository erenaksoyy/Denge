import { create } from 'zustand';

import type { ActivityLevel, DietType, GoalType, Sex } from '@/lib/nutrition';
import type { Obstacle, Units } from '@/lib/types';

export interface OnboardingDraft {
  sex: Sex | null;
  activity: ActivityLevel | null;
  heightCm: number;
  weightKg: number;
  age: number;
  goal: GoalType | null;
  targetWeightKg: number;
  weeklyRateKg: number;
  diet: DietType | null;
  obstacles: Obstacle[];
  units: Units;
}

const INITIAL: OnboardingDraft = {
  sex: null,
  activity: null,
  heightCm: 170,
  weightKg: 70,
  age: 30,
  goal: null,
  targetWeightKg: 65,
  weeklyRateKg: 0.5,
  diet: null,
  obstacles: [],
  units: 'metric',
};

interface OnboardingState {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

/** Answers collected during onboarding; discarded once the profile is created. */
export const useOnboarding = create<OnboardingState>()((set) => ({
  draft: INITIAL,
  update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  reset: () => set({ draft: INITIAL }),
}));
