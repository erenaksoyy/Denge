import { create } from 'zustand';

import { dayKey } from '@/lib/dates';
import type { FoodItem } from '@/lib/types';

export interface PendingFood {
  food: FoodItem;
  source: 'search' | 'barcode';
  /** When set, the food is added as an ingredient to this meal instead of as a new log. */
  addToMealId?: string;
}

interface UiState {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  pendingFood: PendingFood | null;
  setPendingFood: (pending: PendingFood | null) => void;
  toast: { id: number; text: string } | null;
  showToast: (text: string) => void;
  hideToast: () => void;
}

/** In-memory UI state that should not survive an app restart. */
export const useUi = create<UiState>()((set) => ({
  selectedDay: dayKey(),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  pendingFood: null,
  setPendingFood: (pendingFood) => set({ pendingFood }),
  toast: null,
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
  hideToast: () => set({ toast: null }),
}));

export const showToast = (text: string) => useUi.getState().showToast(text);
