import { StyleSheet, View } from 'react-native';

import { useT } from '@/i18n';
import { formatNumber } from '@/lib/units';
import type { Nutrients } from '@/lib/types';
import { colors, macroColor, radius, space, type MacroKey } from '@/theme';

import { Icon, type IconName } from './icon';
import { Ring } from './ring';
import { Card, ProgressBar, Txt } from './ui';

const MACRO_ICON: Record<MacroKey, IconName> = { protein: 'protein', carbs: 'carbs', fat: 'fat' };

export function CalorieCard({
  eaten,
  burned,
  budget,
  onPress,
}: {
  eaten: number;
  burned: number;
  budget: number;
  onPress?: () => void;
}) {
  const { t, locale } = useT();
  const left = Math.round(budget - eaten);
  const over = left < 0;
  return (
    <Card onPress={onPress} style={styles.calorieCard} accessibilityLabel={t('today.caloriesLeft')}>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="number">{formatNumber(Math.abs(left), locale)}</Txt>
        <Txt variant="callout" color={over ? colors.danger : colors.textSecondary}>
          {over ? t('today.caloriesOver') : t('today.caloriesLeft')}
        </Txt>
        <View style={styles.calorieStats}>
          <Stat label={t('today.eaten')} value={formatNumber(eaten, locale)} />
          <Stat label={t('today.burned')} value={formatNumber(burned, locale)} />
          <Stat label={t('today.goal')} value={formatNumber(budget, locale)} />
        </View>
      </View>
      <Ring size={104} stroke={11} progress={budget > 0 ? eaten / budget : 0} color={over ? colors.danger : colors.primary}>
        <Icon name="flame" size={28} color={over ? colors.danger : colors.text} />
      </Ring>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Txt variant="headline">{value}</Txt>
      <Txt variant="micro" color={colors.textTertiary}>
        {label.toLocaleUpperCase()}
      </Txt>
    </View>
  );
}

export function MacroCards({
  eaten,
  goals,
  onPress,
}: {
  eaten: Pick<Nutrients, MacroKey>;
  goals: Record<MacroKey, number>;
  onPress?: () => void;
}) {
  const { t } = useT();
  const labels: Record<MacroKey, string> = {
    protein: t('common.protein'),
    carbs: t('common.carbs'),
    fat: t('common.fat'),
  };
  return (
    <View style={styles.macroRow}>
      {(['protein', 'carbs', 'fat'] as const).map((key) => {
        const goal = goals[key];
        const left = Math.round(goal - eaten[key]);
        return (
          <Card key={key} style={styles.macroCard} onPress={onPress} accessibilityLabel={labels[key]}>
            <Txt variant="headline">
              {Math.abs(left)}
              <Txt variant="caption" color={colors.textSecondary}>
                {' '}
                g
              </Txt>
            </Txt>
            <Txt variant="caption" color={left < 0 ? colors.danger : colors.textSecondary} numberOfLines={1}>
              {labels[key]} {left < 0 ? t('common.over') : t('common.left')}
            </Txt>
            <View style={{ marginTop: space.sm }}>
              <Ring
                size={54}
                stroke={6}
                progress={goal > 0 ? eaten[key] / goal : 0}
                color={left < 0 ? colors.danger : macroColor[key].main}
                track={macroColor[key].soft}>
                <Icon name={MACRO_ICON[key]} size={18} color={macroColor[key].main} />
              </Ring>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

/** Four tiles: calories, protein, carbs and fat. */
export function NutrientTiles({ value }: { value: Nutrients }) {
  const { t, locale } = useT();
  const tiles: { key: string; label: string; text: string; icon: IconName; color: string }[] = [
    { key: 'kcal', label: t('common.calories'), text: formatNumber(value.calories, locale), icon: 'flame', color: colors.text },
    { key: 'p', label: t('common.protein'), text: `${formatNumber(value.protein, locale, 1)} g`, icon: 'protein', color: colors.protein },
    { key: 'c', label: t('common.carbs'), text: `${formatNumber(value.carbs, locale, 1)} g`, icon: 'carbs', color: colors.carbs },
    { key: 'f', label: t('common.fat'), text: `${formatNumber(value.fat, locale, 1)} g`, icon: 'fat', color: colors.fat },
  ];
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <View key={tile.key} style={styles.tile}>
          <Icon name={tile.icon} size={16} color={tile.color} />
          <Txt variant="headline" numberOfLines={1} adjustsFontSizeToFit>
            {tile.text}
          </Txt>
          <Txt variant="micro" color={colors.textTertiary} numberOfLines={1}>
            {tile.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export function HealthScore({ score }: { score: number }) {
  const { t } = useT();
  const color = score >= 7 ? colors.brand : score >= 4 ? colors.warning : colors.danger;
  const label = score >= 7 ? t('meal.score.high') : score >= 4 ? t('meal.score.mid') : t('meal.score.low');
  return (
    <Card style={{ gap: space.sm }}>
      <View style={styles.scoreHeader}>
        <Icon name="heart" size={18} color={color} />
        <Txt variant="headline" style={{ flex: 1 }}>
          {t('meal.healthScore')}
        </Txt>
        <Txt variant="headline">{score}/10</Txt>
      </View>
      <ProgressBar value={score / 10} color={color} />
      <Txt variant="caption" color={colors.textSecondary}>
        {label}
      </Txt>
    </Card>
  );
}

/** Compact "P 30 · C 45 · F 12" line with colored dots. */
export function MacroLine({ value }: { value: Pick<Nutrients, MacroKey> }) {
  return (
    <View style={styles.macroLine}>
      {(['protein', 'carbs', 'fat'] as const).map((key) => (
        <View key={key} style={styles.macroLineItem}>
          <View style={[styles.macroDot, { backgroundColor: macroColor[key].main }]} />
          <Txt variant="caption" color={colors.textSecondary}>
            {Math.round(value[key])} g
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  calorieCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  calorieStats: { flexDirection: 'row', gap: space.lg, marginTop: space.md },
  macroRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  macroCard: { flex: 1, padding: space.md, alignItems: 'flex-start' },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  macroLine: { flexDirection: 'row', gap: space.md },
  macroLineItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroDot: { width: 7, height: 7, borderRadius: 4 },
});
