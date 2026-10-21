import { errorResponse, langOf } from '@/server/http';
import { searchProducts } from '@/server/off';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  if (query.length < 2) return Response.json({ items: [] });
  try {
    const items = await searchProducts(query, langOf(url.searchParams.get('lang')));
    return Response.json({ items });
  } catch (error) {
    console.error('[food-search]', error);
    return errorResponse('aiFailed', 'Product search is unavailable right now');
  }
}
