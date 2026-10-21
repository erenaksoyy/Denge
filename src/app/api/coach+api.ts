import { isMock, MODELS, streamChat } from '@/server/gemini';
import { checkRateLimit, HttpError, readJson, toErrorResponse } from '@/server/http';
import { delay, mockCoachReply } from '@/server/mock';
import { coachPrompt } from '@/server/prompts';
import { coachBody } from '@/server/schemas';

// Appended to the stream when the model fails after the response has started.
const STREAM_ERROR = '\u0000ERR:';
const streamHeaders = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: Request) {
  let body;
  try {
    body = await readJson(request, coachBody, 200_000);
    if (!isMock()) checkRateLimit();
  } catch (error) {
    return toErrorResponse(error);
  }

  const { messages, context, lang } = body;
  const encoder = new TextEncoder();

  if (isMock()) {
    const reply = mockCoachReply(lang);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const word of reply.split(/(?<=\s)/)) {
          controller.enqueue(encoder.encode(word));
          await delay(25);
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: streamHeaders });
  }

  // Start the model call before responding so configuration errors still get a proper status code.
  const chunks = streamChat({ model: MODELS.chat, system: coachPrompt(lang, context), history: messages });
  let first: IteratorResult<string>;
  try {
    first = await chunks.next();
  } catch (error) {
    return toErrorResponse(error);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        for (;;) {
          const next = await chunks.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
        }
      } catch (error) {
        const code = error instanceof HttpError ? error.code : 'aiFailed';
        controller.enqueue(encoder.encode(`${STREAM_ERROR}${code}`));
      } finally {
        controller.close();
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });
  return new Response(stream, { headers: streamHeaders });
}
