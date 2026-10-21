import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Chip, EmptyState, Header, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { normalize } from '@/lib/foods-data';
import { RECIPES, recipeNutrition, type RecipeTag } from '@/lib/recipes-data';
import { colors, radius, shadow, space } from '@/theme';

const TAGS: (RecipeTag | 'all')[] = ['all', 'breakfast', 'main', 'snack', 'highProtein', 'vegetarian', 'vegan', 'lowCarb'];

export default function RecipesScreen() {
  const { t, lang } = useT();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<RecipeTag | 'all'>('all');

  const q = normalize(query);
  const list = RECIPES.filter(
    (r) => (tag === 'all' || r.tags.includes(tag)) && (!q || normalize(r[lang].name).includes(q)),
  );

  return (
    <Screen header={<Header title={t('recipes.title')} />}>
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('recipes.placeholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          accessibilityLabel={t('recipes.placeholder')}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tags}>
        {TAGS.map((tg) => (
          <Chip key={tg} label={t(`recipes.${tg}`)} selected={tag === tg} onPress={() => setTag(tg)} />
        ))}
      </ScrollView>

      {list.length === 0 ? (
        <EmptyState icon="recipe" title={t('recipes.empty')} />
      ) : (
        <View style={styles.grid}>
          {list.map((r) => {
            const n = recipeNutrition(r, lang);
            return (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={r[lang].name}
                onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: r.id } })}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
                <View style={[styles.cover, { backgroundColor: r.tint }]}>
                  <Txt style={styles.emoji}>{r.emoji}</Txt>
                </View>
                <View style={styles.cardBody}>
                  <Txt variant="callout" numberOfLines={2} style={{ minHeight: 40 }}>
                    {r[lang].name}
                  </Txt>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {n.calories} {t('common.kcal')} · {t('recipes.minutes', { count: r.minutes })}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, height: '100%' },
  tags: { gap: space.sm, paddingVertical: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  card: { flexBasis: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  cover: { height: 110, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 52, lineHeight: 64 },
  cardBody: { padding: space.md, gap: 4 },
});
