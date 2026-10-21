import { ApiError as GenAiError, GoogleGenAI, ThinkingLevel } from '@google/genai';
import { z } from 'zod';

import { HttpError } from './http';

export const MODELS = {
  vision: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  text: process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite',
  chat: process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash',
};

export const isMock = () => process.env.AI_MOCK === '1';
export const isConfigured = () => isMock() || Boolean(process.env.GEMINI_API_KEY);

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError('notConfigured', 'GEMINI_API_KEY is not set');
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

// Some models reject certain thinking levels; remember that and stop sending it.
const thinkingUnsupported = new Set<string>();

function mapError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof GenAiError) {
    if (error.status === 429) return new HttpError('rateLimited');
    if (error.status === 401 || error.status === 403) {
      return new HttpError('notConfigured', 'The Gemini API key was rejected');
    }
    if (error.status === 400 && /api key/i.test(error.message)) {
      return new HttpError('notConfigured', 'The Gemini API key is invalid');
    }
  }
  console.error('[gemini]', error);
  return new HttpError('aiFailed');
}

function isThinkingError(error: unknown) {
  return error instanceof GenAiError && error.status === 400 && /think/i.test(error.message);
}

function stripFences(text: string) {
  return text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
}

/** Calls Gemini with a JSON schema and validates the answer. Retries once on a malformed reply. */
export async function generateJson<T>(opts: {
  model: string;
  system: string;
  parts: Part[];
  schema: z.ZodType<T>;
  temperature?: number;
  thinking?: ThinkingLevel;
}): Promise<T> {
  const ai = getClient();
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const useThinking = opts.thinking && !thinkingUnsupported.has(opts.model);
    try {
      const response = await ai.models.generateContent({
        model: opts.model,
        contents: [{ role: 'user', parts: opts.parts }],
        config: {
          systemInstruction: opts.system,
          responseMimeType: 'application/json',
          responseJsonSchema: toJsonSchema(opts.schema),
          temperature: opts.temperature ?? 0.2,
          ...(useThinking ? { thinkingConfig: { thinkingLevel: opts.thinking } } : {}),
        },
      });
      const parsed = opts.schema.safeParse(JSON.parse(stripFences(response.text ?? '')));
      if (parsed.success) return parsed.data;
      lastError = parsed.error;
    } catch (error) {
      if (useThinking && isThinkingError(error)) {
        thinkingUnsupported.add(opts.model);
        lastError = error;
        continue;
      }
      if (error instanceof SyntaxError) {
        lastError = error;
        continue;
      }
      throw mapError(error);
    }
  }
  console.error('[gemini] invalid structured output', lastError);
  throw new HttpError('aiFailed');
}

/** Streams plain text for a chat conversation. */
export async function* streamChat(opts: {
  model: string;
  system: string;
  history: { role: 'user' | 'model'; text: string }[];
}): AsyncGenerator<string> {
  const ai = getClient();
  const request = (withThinking: boolean) =>
    ai.models.generateContentStream({
      model: opts.model,
      contents: opts.history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      config: {
        systemInstruction: opts.system,
        temperature: 0.7,
        ...(withThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      },
    });

  let stream;
  try {
    stream = await request(!thinkingUnsupported.has(opts.model));
  } catch (error) {
    if (!isThinkingError(error)) throw mapError(error);
    thinkingUnsupported.add(opts.model);
    stream = await request(false).catch((e: unknown) => {
      throw mapError(e);
    });
  }
  try {
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    throw mapError(error);
  }
}
