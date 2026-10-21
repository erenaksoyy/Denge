import { ThinkingLevel } from '@google/genai';

import { generateJson, isMock, MODELS } from '@/server/gemini';
import { checkRateLimit, readJson, toErrorResponse } from '@/server/http';
import { delay, mockLabel, mockMeal } from '@/server/mock';
import { foodPhotoPrompt, labelPhotoPrompt } from '@/server/prompts';
import { analyzeFoodBody, foodAnalysisSchema } from '@/server/schemas';

export async function POST(request: Request) {
  try {
    const body = await readJson(request, analyzeFoodBody, 12_500_000);
    if (isMock()) {
      await delay(1500);
      return Response.json(body.mode === 'label' ? mockLabel(body.lang) : mockMeal(body.lang));
    }
    checkRateLimit();
    const instruction =
      body.mode === 'label'
        ? 'Read the nutrition label in this photo.'
        : 'Analyze the food in this photo.';
    const result = await generateJson({
      model: MODELS.vision,
      system: body.mode === 'label' ? labelPhotoPrompt(body.lang) : foodPhotoPrompt(body.lang),
      parts: [{ text: instruction }, { inlineData: { mimeType: body.mimeType, data: body.imageBase64 } }],
      schema: foodAnalysisSchema,
      thinking: ThinkingLevel.LOW,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
