import { ThinkingLevel } from '@google/genai';

import { generateJson, isMock, MODELS } from '@/server/gemini';
import { checkRateLimit, readJson, toErrorResponse } from '@/server/http';
import { delay, mockExercise } from '@/server/mock';
import { exercisePrompt } from '@/server/prompts';
import { exerciseBody, exerciseSchema } from '@/server/schemas';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, exerciseBody, 10_000);
    if (isMock()) {
      await delay(900);
      return Response.json(mockExercise(body.lang));
    }
    checkRateLimit();
    const result = await generateJson({
      model: MODELS.text,
      system: exercisePrompt(body.lang),
      parts: [
        {
          text: `User: ${body.sex}, ${Math.round(body.age)} years old, ${Math.round(body.weightKg)} kg.\nActivity: ${body.description}`,
        },
      ],
      schema: exerciseSchema,
      thinking: ThinkingLevel.LOW,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
