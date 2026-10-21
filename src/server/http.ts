import type { z } from 'zod';

export type ErrorCode = 'badRequest' | 'tooLarge' | 'notConfigured' | 'aiFailed' | 'rateLimited' | 'notFound';

const STATUS: Record<ErrorCode, number> = {
  badRequest: 400,
  notFound: 404,
  tooLarge: 413,
  rateLimited: 429,
  aiFailed: 502,
  notConfigured: 503,
};

export class HttpError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export function errorResponse(code: ErrorCode, message?: string): Response {
  return Response.json({ error: { code, message } }, { status: STATUS[code] });
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) return errorResponse(error.code, error.message);
  console.error('[api] unexpected error', error);
  return errorResponse('aiFailed');
}

/** Reads and validates a JSON body, rejecting anything larger than `maxBytes`. */
export async function readJson<T>(request: Request, schema: z.ZodType<T>, maxBytes: number): Promise<T> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new HttpError('tooLarge');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError('tooLarge');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new HttpError('badRequest', 'Invalid JSON');
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new HttpError('badRequest', parsed.error.issues[0]?.message);
  return parsed.data;
}

export const langOf = (value: unknown): 'tr' | 'en' => (value === 'tr' ? 'tr' : 'en');

// A simple per-process limiter so a client bug can't burn through the AI quota.
const WINDOW_MS = 60_000;
const MAX_CALLS = 40;
const calls: number[] = [];

export function checkRateLimit() {
  const now = Date.now();
  while (calls.length && now - calls[0] > WINDOW_MS) calls.shift();
  if (calls.length >= MAX_CALLS) throw new HttpError('rateLimited');
  calls.push(now);
}
