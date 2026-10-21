import { localFoodById } from './foods-data';
import { ingredientFromFood, mealNutrients } from './meal';
import type { Ingredient, Nutrients } from './types';

export type RecipeTag = 'breakfast' | 'main' | 'snack' | 'highProtein' | 'vegetarian' | 'vegan' | 'lowCarb';

export interface Recipe {
  id: string;
  emoji: string;
  tint: string;
  tags: RecipeTag[];
  minutes: number;
  /** How many servings the listed amounts make. */
  servings: number;
  tr: { name: string; steps: string[] };
  en: { name: string; steps: string[] };
  ingredients: { food: string; grams: number }[];
}

export const RECIPES: Recipe[] = [
  {
    id: 'oat-banana-bowl',
    emoji: '🥣',
    tint: '#FCF0DC',
    tags: ['breakfast', 'vegetarian'],
    minutes: 10,
    servings: 1,
    tr: {
      name: 'Muzlu cevizli yulaf kasesi',
      steps: [
        'Yulafı ve sütü küçük bir tencereye al.',
        'Kısık ateşte 4-5 dakika, kıvam alana kadar karıştırarak pişir.',
        'Kaseye aktar, dilimlediğin muzu ve iri kırdığın cevizi üzerine diz.',
        'Balı gezdirip sıcak servis et.',
      ],
    },
    en: {
      name: 'Banana walnut oat bowl',
      steps: [
        'Put the oats and milk in a small pot.',
        'Cook on low heat for 4–5 minutes, stirring until thick.',
        'Transfer to a bowl and top with sliced banana and chopped walnuts.',
        'Drizzle with honey and serve warm.',
      ],
    },
    ingredients: [
      { food: 'oats', grams: 50 },
      { food: 'milk', grams: 200 },
      { food: 'banana', grams: 100 },
      { food: 'walnuts', grams: 15 },
      { food: 'honey', grams: 10 },
    ],
  },
  {
    id: 'veggie-omelette',
    emoji: '🍳',
    tint: '#FCF0DC',
    tags: ['breakfast', 'vegetarian', 'highProtein', 'lowCarb'],
    minutes: 10,
    servings: 1,
    tr: {
      name: 'Ispanaklı kaşarlı omlet',
      steps: [
        'Yumurtaları bir kasede çırp, tuz ve karabiberle tatlandır.',
        'Tavada tereyağını erit, doğranmış biberi 2 dakika sotele.',
        'Ispanağı ekle, sölenince yumurtayı dök.',
        'Üzerine domates ve rendelenmiş kaşarı serp, kapağı kapalı 3 dakika pişir.',
      ],
    },
    en: {
      name: 'Spinach & cheese omelette',
      steps: [
        'Whisk the eggs with a pinch of salt and pepper.',
        'Melt the butter in a pan and sauté the chopped pepper for 2 minutes.',
        'Add the spinach; once wilted, pour in the eggs.',
        'Top with tomato and grated cheese, cover and cook for 3 minutes.',
      ],
    },
    ingredients: [
      { food: 'egg', grams: 150 },
      { food: 'spinach', grams: 40 },
      { food: 'green_pepper', grams: 30 },
      { food: 'tomato', grams: 60 },
      { food: 'kashar', grams: 30 },
      { food: 'butter', grams: 5 },
    ],
  },
  {
    id: 'chicken-bulgur-bowl',
    emoji: '🍗',
    tint: '#FDE8E3',
    tags: ['main', 'highProtein'],
    minutes: 25,
    servings: 1,
    tr: {
      name: 'Izgara tavuklu bulgur kasesi',
      steps: [
        'Tavuk göğsünü pul biber, kekik ve az zeytinyağıyla marine et.',
        'Izgara tavada her yüzünü 5-6 dakika pişir, dilimle.',
        'Domates, salatalık ve maydanozu doğra; limon ve kalan zeytinyağıyla karıştır.',
        'Kaseye bulgur pilavını, salatayı ve tavuğu yerleştir.',
      ],
    },
    en: {
      name: 'Grilled chicken bulgur bowl',
      steps: [
        'Marinate the chicken with chili flakes, oregano and a little olive oil.',
        'Grill for 5–6 minutes per side, then slice.',
        'Dice tomato, cucumber and parsley; dress with lemon and the remaining oil.',
        'Arrange the bulgur pilaf, salad and chicken in a bowl.',
      ],
    },
    ingredients: [
      { food: 'chicken_breast', grams: 150 },
      { food: 'bulgur_pilaf', grams: 150 },
      { food: 'tomato', grams: 80 },
      { food: 'cucumber', grams: 80 },
      { food: 'parsley', grams: 10 },
      { food: 'olive_oil', grams: 7 },
      { food: 'lemon', grams: 15 },
    ],
  },
  {
    id: 'red-lentil-soup',
    emoji: '🍲',
    tint: '#FCF0DC',
    tags: ['main', 'vegan'],
    minutes: 35,
    servings: 4,
    tr: {
      name: 'Kırmızı mercimek çorbası',
      steps: [
        'Zeytinyağında doğranmış soğan ve havucu 5 dakika kavur.',
        'Yıkanmış mercimeği ve 1,5 litre sıcak suyu ekle.',
        'Mercimekler dağılana kadar yaklaşık 25 dakika pişir.',
        'Blenderdan geçir, tuz ve kimyonla tatlandır; limonla servis et.',
      ],
    },
    en: {
      name: 'Red lentil soup',
      steps: [
        'Sauté the diced onion and carrot in olive oil for 5 minutes.',
        'Add the rinsed lentils and 1.5 liters of hot water.',
        'Simmer for about 25 minutes until the lentils break down.',
        'Blend, season with salt and cumin, and serve with lemon.',
      ],
    },
    ingredients: [
      { food: 'red_lentils', grams: 200 },
      { food: 'onion', grams: 100 },
      { food: 'carrot', grams: 70 },
      { food: 'olive_oil', grams: 28 },
      { food: 'lemon', grams: 20 },
    ],
  },
  {
    id: 'tuna-salad',
    emoji: '🥗',
    tint: '#E3EFFC',
    tags: ['main', 'highProtein', 'lowCarb'],
    minutes: 10,
    servings: 1,
    tr: {
      name: 'Ton balıklı mısırlı salata',
      steps: [
        'Marulu, domatesi ve salatalığı doğra.',
        'Suyu süzülmüş ton balığını ve mısırı ekle.',
        'Zeytinyağı ve limonla sosla, hafifçe karıştır.',
      ],
    },
    en: {
      name: 'Tuna & sweet corn salad',
      steps: [
        'Chop the lettuce, tomato and cucumber.',
        'Add the drained tuna and the corn.',
        'Dress with olive oil and lemon and toss gently.',
      ],
    },
    ingredients: [
      { food: 'tuna', grams: 80 },
      { food: 'lettuce', grams: 80 },
      { food: 'tomato', grams: 80 },
      { food: 'cucumber', grams: 80 },
      { food: 'corn', grams: 50 },
      { food: 'olive_oil', grams: 10 },
      { food: 'lemon', grams: 15 },
    ],
  },
  {
    id: 'salmon-potatoes',
    emoji: '🐟',
    tint: '#FDE8E3',
    tags: ['main', 'highProtein'],
    minutes: 35,
    servings: 2,
    tr: {
      name: 'Fırında somon, patates ve brokoli',
      steps: [
        'Fırını 200 °C’ye ısıt. Patatesleri küp doğrayıp zeytinyağıyla harmanla.',
        'Patatesleri 15 dakika pişir.',
        'Somonu ve brokoliyi tepsiye ekle, limon gezdir.',
        '12-15 dakika daha, somon pişene kadar fırınla.',
      ],
    },
    en: {
      name: 'Baked salmon with potatoes & broccoli',
      steps: [
        'Heat the oven to 200 °C. Cube the potatoes and toss with olive oil.',
        'Roast the potatoes for 15 minutes.',
        'Add the salmon and broccoli to the tray and drizzle with lemon.',
        'Bake for another 12–15 minutes until the salmon is cooked.',
      ],
    },
    ingredients: [
      { food: 'salmon', grams: 300 },
      { food: 'potato', grams: 300 },
      { food: 'broccoli', grams: 200 },
      { food: 'olive_oil', grams: 20 },
      { food: 'lemon', grams: 20 },
    ],
  },
  {
    id: 'chickpea-salad',
    emoji: '🥙',
    tint: '#E2F5EC',
    tags: ['main', 'vegan', 'vegetarian'],
    minutes: 15,
    servings: 2,
    tr: {
      name: 'Nohut salatası',
      steps: [
        'Domates, salatalık, kuru soğan ve maydanozu ince doğra.',
        'Haşlanmış nohutu ekle.',
        'Zeytinyağı, limon, tuz ve sumakla karıştır, 10 dakika dinlendir.',
      ],
    },
    en: {
      name: 'Chickpea salad',
      steps: [
        'Finely chop the tomato, cucumber, onion and parsley.',
        'Add the cooked chickpeas.',
        'Mix with olive oil, lemon, salt and sumac; let it rest for 10 minutes.',
      ],
    },
    ingredients: [
      { food: 'chickpeas', grams: 250 },
      { food: 'tomato', grams: 120 },
      { food: 'cucumber', grams: 120 },
      { food: 'onion', grams: 40 },
      { food: 'parsley', grams: 20 },
      { food: 'olive_oil', grams: 20 },
      { food: 'lemon', grams: 30 },
    ],
  },
  {
    id: 'yogurt-berry-bowl',
    emoji: '🍓',
    tint: '#FDE8E3',
    tags: ['breakfast', 'snack', 'vegetarian', 'highProtein'],
    minutes: 5,
    servings: 1,
    tr: {
      name: 'Çilekli süzme yoğurt kasesi',
      steps: [
        'Süzme yoğurdu kaseye al.',
        'Doğranmış çilekleri ve granolayı ekle.',
        'Üzerine bal gezdir.',
      ],
    },
    en: {
      name: 'Strawberry Greek yogurt bowl',
      steps: [
        'Spoon the Greek yogurt into a bowl.',
        'Add the chopped strawberries and the granola.',
        'Drizzle with honey.',
      ],
    },
    ingredients: [
      { food: 'greek_yogurt', grams: 150 },
      { food: 'strawberries', grams: 100 },
      { food: 'granola', grams: 30 },
      { food: 'honey', grams: 10 },
    ],
  },
  {
    id: 'pb-protein-smoothie',
    emoji: '🥤',
    tint: '#FCF0DC',
    tags: ['snack', 'highProtein'],
    minutes: 5,
    servings: 1,
    tr: {
      name: 'Fıstık ezmeli protein smoothie',
      steps: [
        'Tüm malzemeleri blendere koy.',
        'Pürüzsüz olana kadar 30-40 saniye çek.',
        'İstersen birkaç buz küpüyle servis et.',
      ],
    },
    en: {
      name: 'Peanut butter protein smoothie',
      steps: [
        'Put all the ingredients in a blender.',
        'Blend for 30–40 seconds until smooth.',
        'Serve with a few ice cubes if you like.',
      ],
    },
    ingredients: [
      { food: 'milk', grams: 250 },
      { food: 'banana', grams: 100 },
      { food: 'peanut_butter', grams: 16 },
      { food: 'whey', grams: 30 },
    ],
  },
  {
    id: 'avocado-turkey-toast',
    emoji: '🥑',
    tint: '#E2F5EC',
    tags: ['breakfast'],
    minutes: 10,
    servings: 1,
    tr: {
      name: 'Avokadolu hindi füme tost',
      steps: [
        'Ekmek dilimlerini kızart.',
        'Avokadoyu limon, tuz ve karabiberle ez.',
        'Ekmeklere sür, üzerine hindi füme ve domates dilimlerini yerleştir.',
      ],
    },
    en: {
      name: 'Avocado & smoked turkey toast',
      steps: [
        'Toast the bread slices.',
        'Mash the avocado with lemon, salt and pepper.',
        'Spread on the toast and top with smoked turkey and tomato slices.',
      ],
    },
    ingredients: [
      { food: 'wholewheat_bread', grams: 60 },
      { food: 'avocado', grams: 70 },
      { food: 'turkey_ham', grams: 30 },
      { food: 'tomato', grams: 50 },
      { food: 'lemon', grams: 5 },
    ],
  },
  {
    id: 'classic-menemen',
    emoji: '🍅',
    tint: '#FDE8E3',
    tags: ['breakfast', 'vegetarian'],
    minutes: 15,
    servings: 2,
    tr: {
      name: 'Klasik menemen',
      steps: [
        'Zeytinyağında doğranmış biberleri 3-4 dakika kavur.',
        'Rendelenmiş domatesi ekle, suyunu çekene kadar pişir.',
        'Yumurtaları kır, hafifçe karıştırarak kıvamını ayarla.',
        'Tuz ve pul biberle tatlandırıp sıcak servis et.',
      ],
    },
    en: {
      name: 'Classic menemen',
      steps: [
        'Sauté the chopped peppers in olive oil for 3–4 minutes.',
        'Add the grated tomatoes and cook until the liquid reduces.',
        'Crack in the eggs and stir gently to your liking.',
        'Season with salt and chili flakes and serve hot.',
      ],
    },
    ingredients: [
      { food: 'egg', grams: 200 },
      { food: 'tomato', grams: 300 },
      { food: 'green_pepper', grams: 90 },
      { food: 'olive_oil', grams: 14 },
    ],
  },
  {
    id: 'quinoa-salad',
    emoji: '🥗',
    tint: '#E2F5EC',
    tags: ['main', 'vegan', 'vegetarian'],
    minutes: 20,
    servings: 2,
    tr: {
      name: 'Sebzeli kinoa salatası',
      steps: [
        'Kinoayı haşlayıp soğumaya bırak.',
        'Salatalık, domates ve maydanozu küçük küp doğra.',
        'Kinoa, sebzeler ve mısırı birleştir; zeytinyağı ve limonla sosla.',
      ],
    },
    en: {
      name: 'Quinoa vegetable salad',
      steps: [
        'Cook the quinoa and let it cool.',
        'Dice the cucumber, tomato and parsley.',
        'Combine quinoa, vegetables and corn; dress with olive oil and lemon.',
      ],
    },
    ingredients: [
      { food: 'quinoa', grams: 300 },
      { food: 'cucumber', grams: 120 },
      { food: 'tomato', grams: 120 },
      { food: 'parsley', grams: 20 },
      { food: 'corn', grams: 80 },
      { food: 'olive_oil', grams: 20 },
      { food: 'lemon', grams: 30 },
    ],
  },
];

/** Ingredients for the given number of servings, in the user's language. */
export function recipeIngredients(recipe: Recipe, servings: number, lang: 'tr' | 'en'): Ingredient[] {
  const factor = servings / recipe.servings;
  return recipe.ingredients.flatMap(({ food, grams }) => {
    const item = localFoodById(food, lang);
    return item ? [ingredientFromFood(item, grams * factor)] : [];
  });
}

export function recipeNutrition(recipe: Recipe, lang: 'tr' | 'en'): Nutrients {
  return mealNutrients({ ingredients: recipeIngredients(recipe, 1, lang), servings: 1 });
}
