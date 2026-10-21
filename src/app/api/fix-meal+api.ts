import { ThinkingLevel } from '@google/genai';

import { generateJson, isMock, MODELS } from '@/server/gemini';
import { checkRateLimit, readJson, toErrorResponse } from '@/server/http';
import { delay, mockFix } from '@/server/mock';
import { fixMealPrompt } from '@/server/prompts';
import { fixMealBody, foodAnalysisSchema } from '@/server/schemas';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, fixMealBody, 100_000);
    if (isMock()) {
      await delay(1200);
      return Response.json(mockFix(body.name, body.ingredients, body.lang));
    }
    checkRateLimit();
    const meal = JSON.stringify({ name: body.name, ingredients: body.ingredients });
    const result = await generateJson({
      model: MODELS.text,
      system: fixMealPrompt(body.lang),
      parts: [{ text: `Meal:\n${meal}\n\nUser note:\n${body.instruction}` }],
      schema: foodAnalysisSchema,
      thinking: ThinkingLevel.LOW,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
