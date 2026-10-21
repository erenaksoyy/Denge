import type { FoodItem } from './types';

// Approximate values per 100 g, compiled from general food composition tables.
// [id, Turkish name, English name, kcal, protein, carbs, fat, serving grams, serving TR, serving EN, extra search words]
type Row = [string, string, string, number, number, number, number, number, string, string, string?];

const ROWS: Row[] = [
  // Breakfast & dairy
  ['egg', 'Haşlanmış yumurta', 'Boiled egg', 155, 12.6, 1.1, 10.6, 50, '1 adet', '1 egg', 'yumurta egg'],
  ['egg_fried', 'Sahanda yumurta', 'Fried egg', 196, 13.6, 0.8, 15, 55, '1 adet', '1 egg', 'yumurta egg'],
  ['menemen', 'Menemen', 'Menemen (Turkish scrambled eggs)', 105, 5.5, 4.5, 7.5, 200, '1 porsiyon', '1 serving'],
  ['white_cheese', 'Beyaz peynir', 'White cheese (feta style)', 265, 17, 2, 21, 30, '1 dilim', '1 slice', 'peynir cheese feta'],
  ['kashar', 'Kaşar peyniri', 'Kashar cheese', 370, 25, 1.5, 29, 30, '1 dilim', '1 slice', 'peynir cheese'],
  ['labneh', 'Labne', 'Labneh', 175, 6, 4, 15, 20, '1 yemek kaşığı', '1 tbsp', 'peynir cheese'],
  ['yogurt', 'Yoğurt (tam yağlı)', 'Yogurt (whole milk)', 61, 3.5, 4.7, 3.3, 200, '1 kase', '1 bowl'],
  ['greek_yogurt', 'Süzme yoğurt', 'Greek yogurt', 97, 9, 3.6, 5, 150, '1 kase', '1 bowl', 'yogurt'],
  ['milk', 'Süt (yarım yağlı)', 'Milk (semi-skimmed)', 47, 3.4, 4.8, 1.6, 200, '1 bardak', '1 glass'],
  ['ayran', 'Ayran', 'Ayran (yogurt drink)', 38, 1.7, 2.8, 2, 200, '1 bardak', '1 glass'],
  ['kefir', 'Kefir', 'Kefir', 55, 3.3, 4.8, 2.5, 200, '1 bardak', '1 glass'],
  ['olives', 'Zeytin', 'Olives', 145, 1, 3.8, 15, 20, '5 adet', '5 olives'],
  ['butter', 'Tereyağı', 'Butter', 717, 0.9, 0.1, 81, 10, '1 parça (10 g)', '1 pat (10 g)'],
  ['honey', 'Bal', 'Honey', 304, 0.3, 82, 0, 20, '1 yemek kaşığı', '1 tbsp'],
  ['molasses', 'Pekmez', 'Grape molasses', 293, 0.5, 72, 0.1, 20, '1 yemek kaşığı', '1 tbsp'],
  ['tahini', 'Tahin', 'Tahini', 595, 17, 21, 54, 15, '1 yemek kaşığı', '1 tbsp'],
  ['peanut_butter', 'Fıstık ezmesi', 'Peanut butter', 588, 25, 20, 50, 16, '1 yemek kaşığı', '1 tbsp'],
  ['jam', 'Reçel', 'Jam', 250, 0.4, 62, 0.1, 20, '1 yemek kaşığı', '1 tbsp'],
  ['simit', 'Simit', 'Simit (sesame bread ring)', 305, 9.5, 54, 6, 110, '1 adet', '1 piece'],
  ['white_bread', 'Beyaz ekmek', 'White bread', 265, 9, 49, 3.2, 30, '1 dilim', '1 slice', 'ekmek bread'],
  ['wholewheat_bread', 'Tam buğday ekmeği', 'Whole wheat bread', 250, 12, 41, 3.5, 30, '1 dilim', '1 slice', 'ekmek bread'],
  ['oats', 'Yulaf ezmesi', 'Rolled oats', 389, 16.9, 66, 6.9, 40, '4 yemek kaşığı', '1/2 cup', 'oatmeal yulaf'],
  ['granola', 'Granola', 'Granola', 470, 10, 64, 20, 50, '1 kase', '1 bowl'],
  ['cornflakes', 'Mısır gevreği', 'Corn flakes', 357, 7.5, 84, 0.4, 30, '1 kase', '1 bowl', 'cereal'],
  ['sucuk', 'Sucuk', 'Sucuk (Turkish sausage)', 430, 20, 2, 38, 30, '3 dilim', '3 slices', 'sausage'],
  ['turkey_ham', 'Hindi füme', 'Smoked turkey', 105, 18, 2, 3, 30, '2 dilim', '2 slices', 'jambon ham'],
  ['borek', 'Peynirli börek', 'Cheese börek', 300, 9, 27, 17, 100, '1 dilim', '1 slice', 'pastry'],
  ['pogaca', 'Poğaça', 'Poğaça (savory pastry)', 360, 8, 40, 18, 70, '1 adet', '1 piece', 'pastry'],

  // Mains & sides
  ['chicken_breast', 'Izgara tavuk göğsü', 'Grilled chicken breast', 165, 31, 0, 3.6, 150, '1 porsiyon', '1 serving', 'tavuk chicken'],
  ['chicken_thigh', 'Fırın tavuk but', 'Roasted chicken thigh', 209, 26, 0, 10.9, 150, '1 porsiyon', '1 serving', 'tavuk chicken'],
  ['meatballs', 'Izgara köfte', 'Grilled meatballs (köfte)', 230, 18, 6, 15, 150, '6 adet', '6 pieces', 'kofte meatball'],
  ['ground_beef', 'Dana kıyma (pişmiş)', 'Ground beef (cooked)', 250, 26, 0, 15, 100, '1 porsiyon', '1 serving', 'beef et'],
  ['beef_steak', 'Izgara dana biftek', 'Grilled beef steak', 217, 26, 0, 12, 150, '1 porsiyon', '1 serving', 'et steak'],
  ['salmon', 'Fırında somon', 'Baked salmon', 206, 22, 0, 12, 150, '1 porsiyon', '1 serving', 'balık fish'],
  ['tuna', 'Ton balığı (suda)', 'Tuna (in water)', 116, 26, 0, 0.8, 80, '1 küçük kutu', '1 small can', 'balık fish'],
  ['doner_wrap', 'Tavuk dürüm', 'Chicken döner wrap', 220, 12, 22, 9, 250, '1 adet', '1 wrap', 'döner doner dürüm'],
  ['lahmacun', 'Lahmacun', 'Lahmacun', 235, 10, 32, 7, 170, '1 adet', '1 piece'],
  ['pide', 'Kıymalı pide', 'Pide with minced meat', 245, 11, 31, 8.5, 300, '1 porsiyon', '1 serving'],
  ['manti', 'Mantı (yoğurtlu)', 'Mantı with yogurt', 185, 8, 22, 7, 250, '1 porsiyon', '1 serving', 'dumplings'],
  ['lentil_soup', 'Mercimek çorbası', 'Lentil soup', 65, 3.5, 9, 1.8, 250, '1 kase', '1 bowl', 'çorba soup'],
  ['bean_stew', 'Kuru fasulye', 'White bean stew', 110, 6, 14, 3.5, 250, '1 porsiyon', '1 serving', 'fasulye beans'],
  ['chickpeas', 'Haşlanmış nohut', 'Chickpeas (cooked)', 164, 8.9, 27, 2.6, 150, '1 porsiyon', '1 serving'],
  ['rice_pilaf', 'Pirinç pilavı', 'Rice pilaf', 155, 2.8, 28, 3.5, 150, '1 porsiyon', '1 serving', 'pilav rice pirinç'],
  ['bulgur_pilaf', 'Bulgur pilavı', 'Bulgur pilaf', 110, 3.2, 19, 2.6, 150, '1 porsiyon', '1 serving', 'pilav'],
  ['pasta', 'Haşlanmış makarna', 'Pasta (cooked)', 158, 5.8, 31, 0.9, 200, '1 porsiyon', '1 serving', 'makarna spaghetti'],
  ['quinoa', 'Haşlanmış kinoa', 'Quinoa (cooked)', 120, 4.4, 21, 1.9, 150, '1 porsiyon', '1 serving'],
  ['potato', 'Haşlanmış patates', 'Boiled potato', 87, 1.9, 20, 0.1, 150, '1 adet', '1 potato'],
  ['fries', 'Patates kızartması', 'French fries', 312, 3.4, 41, 15, 120, '1 porsiyon', '1 serving', 'patates fries chips'],
  ['pizza', 'Karışık pizza', 'Pizza', 266, 11, 33, 10, 110, '1 dilim', '1 slice'],
  ['burger', 'Hamburger', 'Hamburger', 245, 13, 24, 11, 220, '1 adet', '1 burger'],
  ['green_beans', 'Zeytinyağlı taze fasulye', 'Green beans in olive oil', 75, 1.8, 7, 4.5, 200, '1 porsiyon', '1 serving'],
  ['shepherd_salad', 'Çoban salata', 'Shepherd’s salad', 50, 1, 4.5, 3.5, 200, '1 kase', '1 bowl', 'salata salad'],

  // Vegetables & fruit
  ['tomato', 'Domates', 'Tomato', 18, 0.9, 3.9, 0.2, 120, '1 adet', '1 tomato'],
  ['cucumber', 'Salatalık', 'Cucumber', 15, 0.7, 3.6, 0.1, 150, '1 adet', '1 cucumber'],
  ['green_pepper', 'Yeşil biber', 'Green pepper', 20, 0.9, 4.6, 0.2, 30, '1 adet', '1 pepper'],
  ['onion', 'Soğan', 'Onion', 40, 1.1, 9.3, 0.1, 100, '1 adet', '1 onion'],
  ['carrot', 'Havuç', 'Carrot', 41, 0.9, 9.6, 0.2, 70, '1 adet', '1 carrot'],
  ['lettuce', 'Marul', 'Lettuce', 15, 1.4, 2.9, 0.2, 50, '1 kase', '1 cup'],
  ['spinach', 'Ispanak', 'Spinach', 23, 2.9, 3.6, 0.4, 50, '1 kase', '1 cup'],
  ['broccoli', 'Brokoli', 'Broccoli', 34, 2.8, 7, 0.4, 150, '1 porsiyon', '1 serving'],
  ['parsley', 'Maydanoz', 'Parsley', 36, 3, 6.3, 0.8, 10, '1 tutam', '1 handful'],
  ['lemon', 'Limon', 'Lemon', 29, 1.1, 9.3, 0.3, 20, 'yarım limon suyu', 'juice of 1/2 lemon'],
  ['corn', 'Haşlanmış mısır', 'Sweet corn', 96, 3.4, 21, 1.5, 100, '1 koçan', '1 cob'],
  ['avocado', 'Avokado', 'Avocado', 160, 2, 8.5, 14.7, 100, 'yarım adet', '1/2 avocado'],
  ['apple', 'Elma', 'Apple', 52, 0.3, 14, 0.2, 180, '1 adet', '1 apple'],
  ['banana', 'Muz', 'Banana', 89, 1.1, 23, 0.3, 120, '1 adet', '1 banana'],
  ['orange', 'Portakal', 'Orange', 47, 0.9, 12, 0.1, 150, '1 adet', '1 orange'],
  ['mandarin', 'Mandalina', 'Mandarin', 53, 0.8, 13, 0.3, 80, '1 adet', '1 mandarin'],
  ['strawberries', 'Çilek', 'Strawberries', 32, 0.7, 7.7, 0.3, 150, '1 kase', '1 cup'],
  ['grapes', 'Üzüm', 'Grapes', 69, 0.7, 18, 0.2, 150, '1 kase', '1 cup'],
  ['watermelon', 'Karpuz', 'Watermelon', 30, 0.6, 7.6, 0.2, 300, '1 dilim', '1 slice'],
  ['dried_apricot', 'Kuru kayısı', 'Dried apricots', 241, 3.4, 63, 0.5, 40, '5 adet', '5 pieces'],
  ['dates', 'Hurma', 'Dates', 282, 2.5, 75, 0.4, 24, '3 adet', '3 dates'],
  ['red_lentils', 'Kırmızı mercimek (kuru)', 'Red lentils (dry)', 358, 24, 60, 2.2, 50, '1/4 su bardağı', '1/4 cup'],

  // Nuts, sweets & snacks
  ['almonds', 'Badem', 'Almonds', 579, 21, 22, 50, 28, '1 avuç', '1 handful', 'kuruyemiş nuts'],
  ['walnuts', 'Ceviz', 'Walnuts', 654, 15, 14, 65, 28, '1 avuç', '1 handful', 'kuruyemiş nuts'],
  ['hazelnuts', 'Fındık', 'Hazelnuts', 628, 15, 17, 61, 28, '1 avuç', '1 handful', 'kuruyemiş nuts'],
  ['dark_chocolate', 'Bitter çikolata (%70)', 'Dark chocolate (70%)', 598, 7.8, 46, 43, 20, '2 kare', '2 squares', 'chocolate'],
  ['milk_chocolate', 'Sütlü çikolata', 'Milk chocolate', 535, 7.6, 59, 30, 40, '1 küçük paket', '1 small bar', 'chocolate'],
  ['baklava', 'Baklava', 'Baklava', 430, 6.5, 50, 23, 40, '1 dilim', '1 piece', 'tatlı dessert'],
  ['sutlac', 'Sütlaç', 'Rice pudding', 130, 3.5, 22, 3, 200, '1 kase', '1 bowl', 'tatlı dessert'],
  ['ice_cream', 'Dondurma', 'Ice cream', 207, 3.5, 24, 11, 60, '1 top', '1 scoop', 'tatlı dessert'],
  ['whey', 'Protein tozu (whey)', 'Whey protein powder', 400, 80, 8, 6, 30, '1 ölçek', '1 scoop'],

  // Drinks & extras
  ['tea', 'Çay (şekersiz)', 'Tea (unsweetened)', 1, 0, 0.2, 0, 100, '1 bardak', '1 glass'],
  ['turkish_coffee', 'Türk kahvesi (şekersiz)', 'Turkish coffee (no sugar)', 3, 0.2, 0.3, 0, 65, '1 fincan', '1 cup', 'kahve coffee'],
  ['latte', 'Latte', 'Caffè latte', 56, 3.1, 4.6, 2.9, 350, '1 orta boy', '1 medium', 'kahve coffee'],
  ['cola', 'Kola', 'Cola', 42, 0, 10.6, 0, 330, '1 kutu', '1 can', 'soda'],
  ['orange_juice', 'Portakal suyu', 'Orange juice', 45, 0.7, 10.4, 0.2, 200, '1 bardak', '1 glass', 'meyve suyu juice'],
  ['sugar', 'Toz şeker', 'Sugar', 387, 0, 100, 0, 5, '1 tatlı kaşığı', '1 tsp'],
  ['olive_oil', 'Zeytinyağı', 'Olive oil', 884, 0, 0, 100, 14, '1 yemek kaşığı', '1 tbsp', 'yağ oil'],
];

export interface LocalFood extends FoodItem {
  keywords: string;
}

const cache: Partial<Record<'tr' | 'en', LocalFood[]>> = {};

export function localFoods(lang: 'tr' | 'en'): LocalFood[] {
  const hit = cache[lang];
  if (hit) return hit;
  const list = ROWS.map(([id, tr, en, calories, protein, carbs, fat, servingG, sTr, sEn, extra]) => ({
    id: `local:${id}`,
    name: lang === 'tr' ? tr : en,
    per100: { calories, protein, carbs, fat },
    servingG,
    servingLabel: lang === 'tr' ? sTr : sEn,
    source: 'local' as const,
    keywords: normalize(`${tr} ${en} ${extra ?? ''}`),
  }));
  cache[lang] = list;
  return list;
}

export function localFoodById(id: string, lang: 'tr' | 'en'): LocalFood | undefined {
  const key = id.startsWith('local:') ? id : `local:${id}`;
  return localFoods(lang).find((f) => f.id === key);
}

/** Lowercases and strips accents so "ŞEKER", "seker" and "şeker" all match. */
export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function searchLocalFoods(query: string, lang: 'tr' | 'en', limit = 12): LocalFood[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(/\s+/);
  return localFoods(lang)
    .map((f) => {
      const name = normalize(f.name);
      if (!words.every((w) => f.keywords.includes(w))) return null;
      const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2;
      return { f, score };
    })
    .filter((x): x is { f: LocalFood; score: number } => x !== null)
    .sort((a, b) => a.score - b.score || a.f.name.localeCompare(b.f.name, lang))
    .slice(0, limit)
    .map((x) => x.f);
}

/** A few everyday foods to show before the user types anything. */
export const POPULAR_FOOD_IDS = ['egg', 'white_cheese', 'banana', 'chicken_breast', 'rice_pilaf', 'yogurt', 'apple', 'simit'];
