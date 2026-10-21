import type {
  AiIngredient,
  CoachContext,
  ExerciseEstimate,
  FoodAnalysis,
  FoodItem,
} from './types';

export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'notConfigured'
  | 'aiFailed'
  | 'tooLarge'
  | 'badRequest'
  | 'rateLimited'
  | 'notFound'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message?: string,
    public status?: number,
  ) {
    super(message ?? code);
  }
}

const KNOWN: ApiErrorCode[] = ['notConfigured', 'aiFailed', 'tooLarge', 'badRequest', 'rateLimited', 'notFound'];

function toCode(code: unknown, status: number): ApiErrorCode {
  if (typeof code === 'string' && (KNOWN as string[]).includes(code)) return code as ApiErrorCode;
  if (status === 413) return 'tooLarge';
  if (status === 429) return 'rateLimited';
  if (status === 503) return 'notConfigured';
  return 'unknown';
}

async function request<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 60_000);
  const onAbort = () => controller.abort();
  init.signal?.addEventListener('abort', onAbort);
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? 'GET',
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(controller.signal.aborted && !init.signal?.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', onAbort);
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(toCode(err?.code, res.status), err?.message, res.status);
  }
  return data as T;
}

export interface StatusResponse {
  ai: boolean;
  mock: boolean;
}

export const api = {
  status: () => request<StatusResponse>('/api/status', { timeoutMs: 8_000 }),

  analyzeFood: (body: { imageBase64: string; mimeType: string; mode: 'meal' | 'label'; lang: string }) =>
    request<FoodAnalysis>('/api/analyze-food', { method: 'POST', body, timeoutMs: 90_000 }),

  fixMeal: (body: { name: string; ingredients: AiIngredient[]; instruction: string; lang: string }) =>
    request<FoodAnalysis>('/api/fix-meal', { method: 'POST', body, timeoutMs: 60_000 }),

  estimateFood: (body: { query: string; lang: string }) =>
    request<FoodAnalysis>('/api/estimate-food', { method: 'POST', body, timeoutMs: 60_000 }),

  analyzeExercise: (body: {
    description: string;
    sex: string;
    age: number;
    weightKg: number;
    lang: string;
  }) => request<ExerciseEstimate>('/api/analyze-exercise', { method: 'POST', body, timeoutMs: 45_000 }),

  searchFoods: (query: string, lang: string, signal?: AbortSignal) =>
    request<{ items: FoodItem[] }>(
      `/api/food-search?q=${encodeURIComponent(query)}&lang=${lang}`,
      { timeoutMs: 15_000, signal },
    ),

  barcode: (code: string, lang: string) =>
    request<{ item: FoodItem | null }>(`/api/barcode?code=${encodeURIComponent(code)}&lang=${lang}`, {
      timeoutMs: 15_000,
    }),
};

/** Marker the coach route appends when the model fails mid-stream. */
const STREAM_ERROR = '\u0000ERR:';

/** Streams the coach reply, calling `onText` with the full text so far. Resolves with the final text. */
export async function streamCoach(
  body: { messages: { role: 'user' | 'model'; text: string }[]; context: CoachContext; lang: string },
  onText: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal.aborted) return '';
    throw new ApiError('network');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new ApiError(toCode(data?.error?.code, res.status), undefined, res.status);
  }

  let full = '';
  const emit = () => {
    const cut = full.indexOf(STREAM_ERROR);
    onText(cut >= 0 ? full.slice(0, cut) : full);
  };

  const reader = res.body?.getReader();
  if (!reader) {
    full = await res.text();
  } else {
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        emit();
      }
      full += decoder.decode();
    } catch {
      if (signal.aborted) return full;
      throw new ApiError('network');
    }
  }

  const cut = full.indexOf(STREAM_ERROR);
  if (cut >= 0) {
    const code = full.slice(cut + STREAM_ERROR.length).trim();
    onText(full.slice(0, cut));
    throw new ApiError(toCode(code, 500));
  }
  emit();
  return full;
}
