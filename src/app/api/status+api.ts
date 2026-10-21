import { isConfigured, isMock } from '@/server/gemini';

export function GET() {
  return Response.json({ ai: isConfigured(), mock: isMock() });
}
