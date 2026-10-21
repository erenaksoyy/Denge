import { ThinkingLevel } from '@google/genai';

import { generateJson, isMock, MODELS } from '@/server/gemini';
import { checkRateLimit, readJson, toErrorResponse } from '@/server/http';
import { delay, mockEstimate } from '@/server/mock';
import { estimateFoodPrompt } from '@/server/prompts';
import { estimateFoodBody, foodAnalysisSchema } from '@/server/schemas';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, estimateFoodBody, 10_000);
    if (isMock()) {
      await delay(1000);
      return Response.json(mockEstimate(body.query, body.lang));
    }
    checkRateLimit();
    const result = await generateJson({
      model: MODELS.text,
      system: estimateFoodPrompt(body.lang),
      parts: [{ text: body.query }],
      schema: foodAnalysisSchema,
      thinking: ThinkingLevel.LOW,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
