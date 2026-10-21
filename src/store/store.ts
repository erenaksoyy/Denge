import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyLanguage } from '@/i18n';
import { dayKey } from '@/lib/dates';
import { deleteImage } from '@/lib/images';
import { uid } from '@/lib/meal';
import { calcPlan, suggestedWaterMl } from '@/lib/nutrition';
import type {
  ActiveFast,
  ChatMessage,
  ExerciseLog,
  FastPlanId,
  FastRecord,
  Goals,
  MealLog,
  Profile,
  SavedFood,
  Settings,
  WeightEntry,
} from '@/lib/types';

export const FAST_PLAN_HOURS: Record<Exclude<FastPlanId, 'custom'>, number> = {
  circadian: 13,
  '16_8': 16,
  '18_6': 18,
  '20_4': 20,
  '36h': 36,
};

export interface FastingState {
  planId: FastPlanId;
  customHours: number;
  active: ActiveFast | null;
  history: FastRecord[];
}

interface Data {
  profile: Profile | null;
  goals: Goals;
  settings: Settings;
  meals: MealLog[];
  exercises: ExerciseLog[];
  /** Milliliters of water per day key. */
  water: Record<string, number>;
  weights: WeightEntry[];
  fasting: FastingState;
  saved: SavedFood[];
  chat: ChatMessage[];
}

interface Actions {
  completeOnboarding: (profile: Profile, settings?: Partial<Settings>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setCustomGoals: (goals: Goals) => void;
  resetToAutoGoals: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addMeal: (meal: MealLog) => void;
  updateMeal: (id: string, patch: Partial<MealLog>) => void;
  removeMeal: (id: string) => void;
  addExercise: (exercise: ExerciseLog) => void;
  removeExercise: (id: string) => void;
  addWater: (day: string, deltaMl: number) => void;
  logWeight: (kg: number, day?: string) => void;
  removeWeight: (id: string) => void;
  setFastPlan: (planId: FastPlanId, customHours?: number) => void;
  startFast: (startIso?: string) => void;
  setFastStart: (startIso: string) => void;
  endFast: (endIso?: string) => FastRecord | null;
  cancelFast: () => void;
  removeFast: (id: string) => void;
  saveFood: (food: SavedFood) => void;
  removeSaved: (id: string) => void;
  addChat: (message: ChatMessage) => void;
  patchChat: (id: string, patch: Partial<ChatMessage>) => void;
  clearChat: () => void;
  resetAll: () => void;
}

export type AppState = Data & Actions;

const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  language: 'system',
  formula: 'mifflin',
  addBurnedToGoal: false,
  goalsMode: 'auto',
  waterGoalMl: 2500,
  glassMl: 250,
};

const INITIAL: Data = {
  profile: null,
  goals: { calories: 2000, proteinG: 125, carbsG: 250, fatG: 56 },
  settings: DEFAULT_SETTINGS,
  meals: [],
  exercises: [],
  water: {},
  weights: [],
  fasting: { planId: '16_8', customHours: 14, active: null, history: [] },
  saved: [],
  chat: [],
};

export function planGoals(profile: Profile, formula: Settings['formula']): Goals {
  const plan = calcPlan(profile, formula);
  return { calories: plan.calories, proteinG: plan.proteinG, carbsG: plan.carbsG, fatG: plan.fatG };
}

export function fastGoalHours(f: Pick<FastingState, 'planId' | 'customHours'>): number {
  return f.planId === 'custom' ? f.customHours : FAST_PLAN_HOURS[f.planId];
}

/** Keeps auto goals in sync whenever the profile or formula changes. */
function withAutoGoals(state: Data): Partial<Data> {
  if (!state.profile || state.settings.goalsMode !== 'auto') return {};
  return { goals: planGoals(state.profile, state.settings.formula) };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      completeOnboarding: (profile, settings) => {
        const merged = {
          ...get().settings,
          waterGoalMl: suggestedWaterMl(profile.weightKg),
          ...settings,
          goalsMode: 'auto' as const,
        };
        const today = dayKey();
        set({
          profile,
          settings: merged,
          goals: planGoals(profile, merged.formula),
          weights: [{ id: uid(), day: today, kg: profile.weightKg, createdAt: new Date().toISOString() }],
        });
      },

      updateProfile: (patch) => {
        const current = get().profile;
        if (!current) return;
        const next = { ...get(), profile: { ...current, ...patch } };
        set({ profile: next.profile, ...withAutoGoals(next) });
      },

      setCustomGoals: (goals) =>
        set((s) => ({ goals, settings: { ...s.settings, goalsMode: 'custom' } })),

      resetToAutoGoals: () => {
        const settings = { ...get().settings, goalsMode: 'auto' as const };
        set({ settings, ...withAutoGoals({ ...get(), settings }) });
      },

      updateSettings: (patch) => {
        const settings = { ...get().settings, ...patch };
        set({ settings, ...withAutoGoals({ ...get(), settings }) });
        if (patch.language) applyLanguage(patch.language);
      },

      addMeal: (meal) => set((s) => ({ meals: [...s.meals, meal] })),

      updateMeal: (id, patch) =>
        set((s) => ({ meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      removeMeal: (id) => {
        const { meals, saved } = get();
        const meal = meals.find((m) => m.id === id);
        const rest = meals.filter((m) => m.id !== id);
        const stillUsed =
          rest.some((m) => m.imageUri === meal?.imageUri) || saved.some((f) => f.imageUri === meal?.imageUri);
        if (meal?.imageUri && !stillUsed) deleteImage(meal.imageUri);
        set({ meals: rest });
      },

      addExercise: (exercise) => set((s) => ({ exercises: [...s.exercises, exercise] })),
      removeExercise: (id) => set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) })),

      addWater: (day, deltaMl) =>
        set((s) => ({ water: { ...s.water, [day]: Math.max(0, (s.water[day] ?? 0) + deltaMl) } })),

      logWeight: (kg, day = dayKey()) => {
        const s = get();
        const entry: WeightEntry = { id: uid(), day, kg, createdAt: new Date().toISOString() };
        // One entry per day: the latest weigh-in of a day replaces the earlier one.
        const weights = [...s.weights.filter((w) => w.day !== day), entry].sort((a, b) =>
          a.day.localeCompare(b.day),
        );
        const latest = weights[weights.length - 1];
        const profile = s.profile ? { ...s.profile, weightKg: latest.kg } : null;
        set({ weights, profile, ...withAutoGoals({ ...s, profile }) });
      },

      removeWeight: (id) => {
        const s = get();
        const weights = s.weights.filter((w) => w.id !== id);
        const latest = weights[weights.length - 1];
        const profile = s.profile && latest ? { ...s.profile, weightKg: latest.kg } : s.profile;
        set({ weights, profile, ...withAutoGoals({ ...s, profile }) });
      },

      setFastPlan: (planId, customHours) =>
        set((s) => {
          const fasting = {
            ...s.fasting,
            planId,
            customHours: customHours ?? s.fasting.customHours,
          };
          const active = fasting.active ? { ...fasting.active, goalHours: fastGoalHours(fasting) } : null;
          return { fasting: { ...fasting, active } };
        }),

      startFast: (startIso) =>
        set((s) => ({
          fasting: {
            ...s.fasting,
            active: { start: startIso ?? new Date().toISOString(), goalHours: fastGoalHours(s.fasting) },
          },
        })),

      setFastStart: (startIso) =>
        set((s) => (s.fasting.active ? { fasting: { ...s.fasting, active: { ...s.fasting.active, start: startIso } } } : {})),

      endFast: (endIso) => {
        const { fasting } = get();
        if (!fasting.active) return null;
        const record: FastRecord = { id: uid(), ...fasting.active, end: endIso ?? new Date().toISOString() };
        set({ fasting: { ...fasting, active: null, history: [record, ...fasting.history] } });
        return record;
      },

      cancelFast: () => set((s) => ({ fasting: { ...s.fasting, active: null } })),
      removeFast: (id) =>
        set((s) => ({ fasting: { ...s.fasting, history: s.fasting.history.filter((f) => f.id !== id) } })),

      saveFood: (food) => set((s) => ({ saved: [food, ...s.saved.filter((f) => f.id !== food.id)] })),
      removeSaved: (id) => set((s) => ({ saved: s.saved.filter((f) => f.id !== id) })),

      addChat: (message) => set((s) => ({ chat: [...s.chat, message].slice(-200) })),
      patchChat: (id, patch) =>
        set((s) => ({ chat: s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      clearChat: () => set({ chat: [] }),

      resetAll: () => {
        const { meals, saved } = get();
        for (const uri of new Set([...meals, ...saved].map((m) => m.imageUri))) deleteImage(uri);
        set({ ...INITIAL, settings: { ...DEFAULT_SETTINGS, language: get().settings.language } });
      },
    }),
    {
      name: 'denge-data',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): Data => ({
        profile: s.profile,
        goals: s.goals,
        settings: s.settings,
        meals: s.meals,
        exercises: s.exercises,
        water: s.water,
        weights: s.weights,
        fasting: s.fasting,
        saved: s.saved,
        chat: s.chat,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Data>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...p.settings },
          fasting: { ...INITIAL.fasting, ...p.fasting },
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyLanguage(state.settings.language);
        // An analysis can't survive an app restart; let the user retry it.
        const stale = state.meals.filter((m) => m.status === 'processing');
        for (const m of stale) state.updateMeal(m.id, { status: 'failed', error: 'interrupted' });
        // Streaming replies that were cut off by a restart.
        for (const c of state.chat.filter((m) => m.status === 'streaming')) {
          state.patchChat(c.id, { status: c.text ? 'done' : 'error' });
        }
      },
    },
  ),
);

export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
