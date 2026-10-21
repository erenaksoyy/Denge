// Open Food Facts client (https://world.openfoodfacts.org). Data is ODbL licensed; the app credits it.
import type { FoodItem } from '@/lib/types';

const USER_AGENT = 'Denge/1.0 (personal nutrition tracker built with Expo)';
const FIELDS =
  'code,product_name,product_name_tr,product_name_en,brands,nutriments,serving_quantity,serving_size,image_front_small_url';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_tr?: string;
  product_name_en?: string;
  brands?: string | string[];
  nutriments?: Record<string, unknown>;
  serving_quantity?: number | string;
  serving_size?: string;
  image_front_small_url?: string;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function toFoodItem(p: OffProduct, lang: 'tr' | 'en'): FoodItem | null {
  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
  if (kcal === null && kj !== null) kcal = kj / 4.184;
  if (kcal === null || !p.code) return null;

  const localized = lang === 'tr' ? p.product_name_tr : p.product_name_en;
  const name = (localized || p.product_name || p.product_name_en || p.product_name_tr || '').trim();
  if (!name) return null;

  const brandList = Array.isArray(p.brands) ? p.brands : String(p.brands ?? '').split(',');
  const brand = [...new Set(brandList.map((b) => b.trim()).filter(Boolean))].slice(0, 2).join(', ');
  const serving = num(p.serving_quantity);

  return {
    id: `off:${p.code}`,
    name,
    brand: brand || undefined,
    per100: {
      calories: Math.round(kcal),
      protein: round1(num(n.proteins_100g) ?? 0),
      carbs: round1(num(n.carbohydrates_100g) ?? 0),
      fat: round1(num(n.fat_100g) ?? 0),
    },
    servingG: serving && serving > 0 && serving < 3000 ? serving : undefined,
    servingLabel: p.serving_size || undefined,
    source: 'off',
    imageUrl: p.image_front_small_url || undefined,
  };
}

export async function searchProducts(query: string, lang: 'tr' | 'en'): Promise<FoodItem[]> {
  const url =
    `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}` +
    `&page_size=24&langs=${lang},en&fields=${FIELDS}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Open Food Facts search failed: ${res.status}`);
  const data = (await res.json()) as { hits?: OffProduct[] };
  const seen = new Set<string>();
  const items: FoodItem[] = [];
  for (const hit of data.hits ?? []) {
    const item = toFoodItem(hit, lang);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items.slice(0, 20);
}

export async function lookupBarcode(code: string, lang: 'tr' | 'en'): Promise<FoodItem | null> {
  if (!/^\d{6,14}$/.test(code)) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts lookup failed: ${res.status}`);
  const data = (await res.json()) as { product?: OffProduct };
  return data.product ? toFoodItem({ ...data.product, code }, lang) : null;
}
