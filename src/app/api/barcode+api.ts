import { errorResponse, langOf } from '@/server/http';
import { lookupBarcode } from '@/server/off';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') ?? '').replace(/\D/g, '');
  if (code.length < 6 || code.length > 14) return errorResponse('badRequest', 'Invalid barcode');
  try {
    const item = await lookupBarcode(code, langOf(url.searchParams.get('lang')));
    return Response.json({ item });
  } catch (error) {
    console.error('[barcode]', error);
    return errorResponse('aiFailed', 'Product lookup is unavailable right now');
  }
}
